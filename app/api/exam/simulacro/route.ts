import { NextRequest, NextResponse } from "next/server"
import fs from 'fs/promises'
import path from 'path'

// Endpoint: /api/exam/simulacro
// Query params (optional): difficulty=basico|intermedio|avanzado, timeTotal=minutes (number), secondsPerQuestion, seed, preset=gradoMedio

function mapSubject(materia?: string) {
  if (!materia) return 'general'
  const m = materia.toString().toLowerCase()
  if (m.includes('matem')) return 'matematicas'
  if (m.includes('ingl')) return 'ingles'
  if (m.includes('leng')) return 'lengua'
  if (m.includes('hist') || m.includes('geogr') || m.includes('social')) return 'sociales'
  if (m.includes('natur') || m.includes('cienc')) return 'sociales'
  if (m.includes('tic') || m.includes('ofimat') || m.includes('inform')) return 'tic'
  return 'general'
}

function mapDifficulty(d?: any) {
  const n = Number(d)
  if (isNaN(n)) return d === 'avanzado' ? 'avanzado' : d === 'basico' ? 'basico' : 'intermedio'
  if (n <= 1) return 'basico'
  if (n === 2) return 'intermedio'
  return 'avanzado'
}

function parseClosedOptions(raw?: string) {
  if (!raw) return []
  const parts = raw.split(/\s*\|\s*|;|\r?\n/).map(s => s.trim()).filter(Boolean)
  const cleaned = parts.map(p => p.replace(/^[A-Z]\)\s*/i, '').replace(/^[A-Z]\.\s*/i, '').replace(/^\([A-Z]\)\s*/i, '').trim())
  return cleaned
}

function parseCorrectIndex(resp: string | undefined, options: string[]) {
  if (!resp) return -1
  const r = resp.toString().trim()
  const letter = r.match(/^['"]?([A-Z])[\)\.]?/i)
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

function isItemActive(item: any) {
  if (typeof item.APTA_MOTOR === 'undefined' && typeof item.APTA_CHATBOT === 'undefined') return true
  const val = String(item.APTA_MOTOR || item.APTA_CHATBOT || '').toLowerCase()
  return val.startsWith('s') || val === 'true' || val === '1'
}

function normalizeText(text?: string) {
  if (!text) return ''
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function tokensFromText(text: string) {
  return new Set((normalizeText(text) || '').split(/\s+/).filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>) {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng<T>(array: T[], rng: () => number) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = mapDifficulty(searchParams.get('difficulty') || 'intermedio')
    const timeTotal = parseFloat(searchParams.get('timeTotal') || '60') // minutes
    const secondsPerQuestionParam = searchParams.get('secondsPerQuestion')
    const seedParam = searchParams.get('seed')
    const preset = searchParams.get('preset') || 'gradoMedio'

    const seed = seedParam ? Number(seedParam) : Math.floor(Math.random() * 1e9)
    const rng = mulberry32(seed)

    // Default distribution for "Grado Medio" (36 preguntas)
    const presets: Record<string, Record<string, number>> = {
      gradoMedio: { lengua: 6, sociales: 9, ingles: 5, matematicas: 6, tic: 10 },
    }

    const distribution = presets[preset] || presets['gradoMedio']
    const totalQuestions = Object.values(distribution).reduce((a, b) => a + b, 0)
    const secondsPerQuestion = secondsPerQuestionParam ? Number(secondsPerQuestionParam) : Math.max(30, Math.floor((timeTotal * 60) / Math.max(1, totalQuestions)))

    const datasetFile = path.join(process.cwd(), 'data', 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json')
    let raw: string | null = null
    try {
      raw = await fs.readFile(datasetFile, 'utf-8')
    } catch (err) {
      console.error('Dataset local no encontrado:', datasetFile)
      return NextResponse.json({ error: 'Dataset local no encontrado' }, { status: 500 })
    }

    let json: any = {}
    try {
      json = JSON.parse(raw)
    } catch (err) {
      console.error('Error parseando dataset local:', err)
      return NextResponse.json({ error: 'Error parseando dataset local' }, { status: 500 })
    }

    const items = json.dataset_preguntas || json.dataset || json.items || []

    const normalized = items.map((item: any) => {
      const idUnico = item.ID_Unico || (item.ID ? `ID-${item.ID}` : undefined)
      const _id = idUnico ? `examQuestion-${idUnico}` : `examQuestion-dataset-${Math.random().toString(36).slice(2, 9)}`
      const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || item.opciones_cerradas || '')
      const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || item.respuesta_correcta || '', optionsText)
      const options = optionsText.length > 0 ? optionsText.map((t: string, i: number) => ({ text: t, isCorrect: i === correctIndex })) : undefined
      const textReference = (item.TEXTO_REFERENCIA || item.texto_referencia || item.texto_referencia || item.TEXTO_REFERENCIA || '')
      const reqImages: string[] = []
      if (textReference && typeof textReference === 'string') {
        const matches = Array.from(textReference.matchAll(/\[REQ_IMAGE:\s*([^\]]+)\]/ig)).map(m => m[1])
        for (const m of matches) reqImages.push(m)
      }

      return {
        _id,
        question: item.Pregunta || item.question || item.enunciado || item.PREGUNTA || 'Sin enunciado',
        subject: mapSubject(item.Materia || item.materia || item.SUBJETO || item.SUBJECT || item.Tema || item.TEMA),
        topic: item.Tema || item.SUBTEMA || item.topic || '',
        difficulty: mapDifficulty(item.Dificultad || item.DIFICULTAD || item.Nivel || item.NIVEL || ''),
        options,
        explanation: [item.Explicación, item.RUBRICA_MODELO, item.RESPUESTA_MODELO_EXCELENTE, item.Explicacion].filter(Boolean).join('\n\n'),
        source: {
          name: item.FUENTE || item.FUENTE_TEXTO || item.Fuente || item.FUENTE_TEXTO || 'Desconocida',
          year: item.Año || item.ANIO || item.year || null,
          region: item.Region || item.REGION || item.Comunidad || item.COMUNIDAD || item.region || null,
          url: item.FUENTE_URL || item.FUENTE_LINK || item.URL || item.link || item.PDF_URL || null,
        },
        original: item,
        isActive: isItemActive(item),
        textReference,
        reqImages,
      }
    })

    const uniqueQuestions = new Map<string, any>()
    const normalizedUnique = normalized.filter((q: any) => {
      const questionText = normalizeText(q.question)
      const optionsText = Array.isArray(q.options)
        ? q.options.map((o: any) => normalizeText(o.text)).join('|')
        : ''
      const dedupeKey = `${questionText}|${normalizeText(q.subject)}|${normalizeText(q.difficulty)}|${optionsText}`
      if (uniqueQuestions.has(dedupeKey)) return false
      uniqueQuestions.set(dedupeKey, true)
      return true
    })

    const activeOnly = normalizedUnique.filter((q: any) => q.isActive)

    // Selection loop: pick per-subject while avoiding high similarity across entire exam
    const SIMILARITY_THRESHOLD = 0.6
    const selectedById = new Set<string>()
    const selectedQuestions: any[] = []

    for (const [subject, needed] of Object.entries(distribution)) {
      // filter candidates by subject and difficulty
      let candidates = activeOnly.filter((q: any) => q.subject === subject && q.difficulty === difficulty)
      // if not enough, relax difficulty order
      if (candidates.length < needed) {
        const altOrder = ['intermedio', 'basico', 'avanzado'].filter(d => d !== difficulty)
        for (const d of altOrder) {
          const more = activeOnly.filter((q: any) => q.subject === subject && q.difficulty === d)
          candidates = [...candidates, ...more]
          if (candidates.length >= needed) break
        }
      }
      // final fallback: any question with same subject
      if (candidates.length < needed) {
        const more = activeOnly.filter((q: any) => q.subject === subject)
        candidates = [...candidates, ...more]
      }

      const shuffled = shuffleWithRng<any>(candidates, rng)
      for (const q of shuffled) {
        if (selectedQuestions.length >= totalQuestions) break
        if (selectedById.has(q._id)) continue
        // check similarity with already selected
        const qTokens = tokensFromText(q.question || '')
        let tooSimilar = false
        for (const s of selectedQuestions) {
          const sTokens = tokensFromText(s.question || '')
          if (jaccard(qTokens, sTokens) >= SIMILARITY_THRESHOLD) {
            tooSimilar = true
            break
          }
        }
        if (tooSimilar) continue
        selectedById.add(q._id)
        selectedQuestions.push(q)
        if (selectedQuestions.filter(s => s.subject === subject).length >= needed) break
      }
    }

    // If we lack questions because de-dup removed many, fill from remaining pool
    if (selectedQuestions.length < totalQuestions) {
      const remaining = shuffleWithRng<any>(activeOnly.filter((q: any) => !selectedById.has(q._id)), rng)
      for (const q of remaining) {
        if (selectedQuestions.length >= totalQuestions) break
        selectedById.add(q._id)
        selectedQuestions.push(q)
      }
    }

    // Build blocks
    const blocks: any[] = []
    for (const [subject, count] of Object.entries(distribution)) {
      const questionsForSubject = selectedQuestions.filter(q => q.subject === subject).slice(0, count)
      blocks.push({ subject, count: questionsForSubject.length, questions: questionsForSubject })
    }

    const simulacro = {
      id: `sim-${Date.now().toString(36)}-${Math.floor(seed % 10000)}`,
      preset,
      seed,
      timeTotalMinutes: timeTotal,
      secondsPerQuestion,
      totalQuestions: selectedQuestions.length,
      distribution,
      blocks,
      questions: selectedQuestions,
    }

    return NextResponse.json({ simulacro })

  } catch (error) {
    console.error('Error creando simulacro:', error)
    return NextResponse.json({ error: 'Error creando simulacro' }, { status: 500 })
  }
}
