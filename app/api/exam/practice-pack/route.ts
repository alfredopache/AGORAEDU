import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

import { generatePracticeExamPack } from "@/lib/practice-exam-generator"

function parseClosedOptions(raw: any) {
  if (!raw) return []
  const parts = String(raw).split(/\s*\|\s*|;|\r?\n/).map((s: string) => s.trim()).filter(Boolean)
  return parts.map((p: string) => p.replace(/^[A-Z]\)\s*/i, '').replace(/^[A-Z]\.\s*/i, '').replace(/^\([A-Z]\)\s*/i, '').trim())
}

function parseCorrectIndex(resp: any, options: string[]) {
  if (!resp) return -1
  const r = String(resp).trim()
  const letter = r.match(/^['"]?([A-Z])[\\)\.]?/i)
  if (letter) {
    const idx = letter[1].toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return idx
  }
  const num = r.match(/^([1-9])[\)\.]?$/)
  if (num) {
    const idx = Number(num[1]) - 1
    if (idx >= 0 && idx < options.length) return idx
  }
  const lowResp = r.replace(/^"|"$/g, '').toLowerCase()
  for (let i = 0; i < options.length; i++) {
    const opt = options[i].toLowerCase()
    if (opt === lowResp || opt.includes(lowResp) || lowResp.includes(opt)) return i
  }
  return -1
}

function mapDatasetSubject(materia: any) {
  if (!materia) return 'mixto'
  const m = String(materia).toLowerCase()
  if (m.includes('matem')) return 'matematicas'
  if (m.includes('ingl')) return 'ingles'
  if (m.includes('leng')) return 'lengua'
  if (m.includes('hist') || m.includes('geogr') || m.includes('social')) return 'sociales'
  if (m.includes('natur') || m.includes('cienc')) return 'naturales'
  if (m.includes('tic') || m.includes('ofimat') || m.includes('inform')) return 'tic'
  return 'mixto'
}

function mapDifficulty(d: any) {
  const n = Number(d)
  if (isNaN(n)) return d === 'avanzado' ? 'avanzado' : d === 'basico' ? 'basico' : 'intermedio'
  if (n <= 1) return 'basico'
  if (n === 2) return 'intermedio'
  return 'avanzado'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seedParam = searchParams.get("seed")
    const questionCountParam = searchParams.get("questionCount")
    const difficultyParam = searchParams.get("difficulty") || "intermedio"
    const subject = searchParams.get("subject") || "mixto"
    const preset = searchParams.get("preset")
    const datasetParam = searchParams.get("dataset")
    const useOfficialPreset = preset === "gradoMedio" || preset === "gradoSuperior"
    const level = preset === "gradoSuperior" ? "superior" : (preset === "gradoMedio" ? "medio" : undefined)
    const seed = seedParam ? Number(seedParam) : undefined
    const questionCount = useOfficialPreset ? 36 : (questionCountParam ? Number(questionCountParam) : 36)

    // If a dataset file is requested and exists in /data, try to select questions from it
    if (datasetParam) {
      const datasetFile = path.join(process.cwd(), 'data', datasetParam)
      try {
        await fs.access(datasetFile)
        const raw = await fs.readFile(datasetFile, 'utf-8')
        const json = JSON.parse(raw)
        const items: any[] = json.dataset_preguntas || json.dataset || json.items || json.dataset || []

        // Normalize items
        const normalized = items.map((item: any, idx: number) => {
          const idUnico = item.ID_Unico || item.ID || `ds-${idx}`
          const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || item.opciones_cerradas || item.opciones || '')
          const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA || item.respuesta_correcta || '', optionsText)
          const options = optionsText.length > 0 ? optionsText.map((t: string, i: number) => ({ text: t, isCorrect: i === correctIndex })) : undefined
          return {
            _id: `dataset-${idUnico}`,
            question: item.Pregunta || item.pregunta || item.question || item.enunciado || 'Sin enunciado',
            subject: mapDatasetSubject(item.Materia || item.materia || item.SUBJETO || item.SUBJECT || item.Tema || item.TEMA),
            topic: item.Tema || item.SUBTEMA || item.topic || '',
            difficulty: mapDifficulty(item.Dificultad || item.DIFICULTAD || item.Nivel || item.NIVEL || item.nivel || ''),
            options,
            explanation: item.Explicación || item.RUBRICA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.Explicacion || item.explicacion || '',
            original: item,
          }
        })

        // Filter active items (assume available)
        const activeOnly = normalized

        // Determine desired difficulty
        const desiredDifficulty = level === 'superior' ? 'avanzado' : (difficultyParam || 'intermedio')

        // RNG for deterministic selection
        const rngSeed = seed ?? Math.floor(Math.random() * 1_000_000_000)
        const mulberry32 = (s: number) => {
          return function() {
            let t = s += 0x6D2B79F5
            t = Math.imul(t ^ (t >>> 15), t | 1)
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296
          }
        }
        const rng = mulberry32(rngSeed)
        const shuffle = (arr: any[]) => { const copy = [...arr]; for (let i = copy.length-1; i>0; i--) { const j = Math.floor(rng()* (i+1)); [copy[i], copy[j]] = [copy[j], copy[i]] } return copy }

        const coreSubjects = ['lengua','ingles','sociales','matematicas','naturales','tic']
        const selected: any[] = []

        if (subject === 'mixto') {
          // distribute evenly across core subjects
          const per = Math.max(1, Math.floor(questionCount / coreSubjects.length))
          for (const s of coreSubjects) {
            let candidates = activeOnly.filter(q => q.subject === s && q.difficulty === desiredDifficulty)
            if (candidates.length < per) candidates = [...candidates, ...activeOnly.filter(q => q.subject === s)]
            const shuffled = shuffle(candidates)
            for (const q of shuffled) {
              if (selected.length >= questionCount) break
              if (!selected.find(x => x._id === q._id)) selected.push(q)
              if (selected.filter(x => x.subject === s).length >= per) break
            }
            if (selected.length >= questionCount) break
          }
        } else {
          let candidates = activeOnly.filter(q => q.subject === subject && q.difficulty === desiredDifficulty)
          if (candidates.length < questionCount) candidates = [...candidates, ...activeOnly.filter(q => q.subject === subject)]
          const shuffled = shuffle(candidates)
          for (const q of shuffled) {
            if (selected.length >= questionCount) break
            if (!selected.find(x => x._id === q._id)) selected.push(q)
          }
        }

        // Fill if not enough
        if (selected.length < questionCount) {
          const remaining = shuffle(activeOnly.filter(q => !selected.find(sq => sq._id === q._id)))
          for (const q of remaining) {
            if (selected.length >= questionCount) break
            selected.push(q)
          }
        }

        // Build a base pack for metadata consistency
        const basePack = generatePracticeExamPack({ seed: rngSeed, difficulty: desiredDifficulty, questionCount, subject, useOfficialPreset, level })

        // Convert selected items to PracticeExamQuestion shape
        const conv = selected.map((q, i) => {
          const hasOptions = Array.isArray(q.options) && q.options.length > 0
          const answerText = hasOptions ? (q.options.find((o: any) => o.isCorrect)?.text || '') : (q.original?.RESPUESTA || q.original?.RESPUESTA_MODELO || '')
          return {
            id: `dataset-${q._id || i}`,
            subject: q.subject,
            topic: q.topic || '',
            prompt: q.question || '',
            type: hasOptions ? 'multiple-choice' : 'redaccion',
            options: hasOptions ? q.options : [],
            answerText: answerText || '',
            explanation: q.explanation || '',
          }
        })

        const pack = {
          ...basePack,
          id: `practice-pack-dataset-${rngSeed}`,
          seed: rngSeed,
          title: `Simulador de práctica - ${basePack.subjectLabel} (dataset: ${datasetParam})`,
          questions: conv,
        }

        return NextResponse.json({ pack })
      } catch (err) {
        return NextResponse.json({ error: 'Dataset no encontrado o inválido', detail: String(err) }, { status: 404 })
      }
    }

    // Fallback: generate synthetic pack using existing generator
    const pack = generatePracticeExamPack({
      seed: seed ? seed : undefined,
      difficulty: difficultyParam,
      questionCount,
      subject,
      useOfficialPreset,
      level,
    })

    return NextResponse.json({ pack })
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo generar el examen de practica",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}