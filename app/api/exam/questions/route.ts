import { NextRequest, NextResponse } from "next/server"
import { client } from "@/sanity/lib/client"
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const difficulty = searchParams.get("difficulty")
    const count = parseInt(searchParams.get("count") || "10")
    const topic = searchParams.get("topic") // optional topic filter (e.g., 'Comentario', 'Historia')

    if (!subject || !difficulty) {
      return NextResponse.json(
        { error: "Se requieren subject y difficulty" },
        { status: 400 }
      )
    }

    // Forzar uso del dataset local: leer el JSON de `data/` y devolver sólo preguntas normalizadas
    const datasetFile = path.join(process.cwd(), 'data', 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json')

    // Helpers (copiados del script de importación para mantener mapeo consistente)
    function mapSubject(materia?: string) {
      if (!materia) return 'general'
      const m = materia.toString().toLowerCase()
      if (m.includes('matem')) return 'matematicas'
      if (m.includes('ingl')) return 'ingles'
      if (m.includes('leng')) return 'lengua'
      if (m.includes('hist') || m.includes('geogr') || m.includes('social')) return 'sociales'
      if (m.includes('natur') || m.includes('cienc')) return 'sociales'
      return 'general'
    }

    function mapDifficulty(d?: any) {
      const n = Number(d)
      if (isNaN(n)) return d === 'avanzado' ? 'avanzado' : 'intermedio'
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

    function parseCorrectIndex(resp?: string, options: string[]) {
      if (!resp) return -1
      const r = resp.toString().trim()
      const letter = r.match(/^['"]?([A-Z])[\)\.]?/i)
      if (letter) {
        const idx = letter[1].toUpperCase().charCodeAt(0) - 65
        if (idx >= 0 && idx < options.length) return idx
      }
      // numeric index like '1' or '2.'
      const num = r.match(/^([1-9])[\)\.]?$/)
      if (num) {
        const idx = Number(num[1]) - 1
        if (idx >= 0 && idx < options.length) return idx
      }
      const letter2 = r.match(/([A-Z])(?!.*[A-Z])/) // last letter
      if (letter2) {
        const idx = letter2[1].toUpperCase().charCodeAt(0) - 65
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

    function shuffleArray<T>(array: T[]) {
      const copy = [...array]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    }

    // Cargar dataset local
    let raw: string | null = null
    try {
      raw = await fs.readFile(datasetFile, 'utf-8')
    } catch (err) {
      console.error('Dataset local no encontrado:', datasetFile)
      return NextResponse.json({ error: 'Dataset local no encontrado: ' + datasetFile }, { status: 500 })
    }

    let json: any = {}
    try {
      json = JSON.parse(raw)
    } catch (err) {
      console.error('Error parseando dataset local:', err)
      return NextResponse.json({ error: 'Error parseando dataset local' }, { status: 500 })
    }

    const items = json.dataset_preguntas || json.dataset || json.items || []

    // Normalizar preguntas
    const normalized = items.map((item: any) => {
      const idUnico = item.ID_Unico || (item.ID ? `ID-${item.ID}` : undefined)
      const _id = idUnico ? `examQuestion-${idUnico}` : `examQuestion-dataset-${Math.random().toString(36).slice(2, 9)}`
      const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || '')
      const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || '', optionsText)

      const options = optionsText.length > 0 ? optionsText.map((t: string, i: number) => ({ text: t, isCorrect: i === correctIndex })) : undefined

      return {
        _id,
        question: item.Pregunta || item.question || item.enunciado || item.PREGUNTA || 'Sin enunciado',
        subject: mapSubject(item.Materia || item.materia || item.SUBJETO || item.SUBJECT),
        topic: item.Tema || item.SUBTEMA || item.topic || '',
        difficulty: mapDifficulty(item.Dificultad || item.DIFICULTAD || item.Nivel || item.NIVEL || ''),
        options,
        explanation: [item.Explicación, item.RUBRICA_MODELO, item.RESPUESTA_MODELO_EXCELENTE, item.Explicacion].filter(Boolean).join('\n\n'),
        source: { name: item.FUENTE || item.FUENTE_TEXTO || item.Fuente || 'Desconocida', year: item.Año || item.ANIO || item.year || null, region: item.FUENTE_TEXTO || 'Nacional' },
        original: item,
        isActive: isItemActive(item),
      }
    })

    // Eliminar preguntas duplicadas basadas en el texto, materia, dificultad y opciones
    const uniqueQuestions = new Map<string, any>()
    const normalizedUnique = normalized.filter((q: any) => {
      const questionText = q.question?.toString().trim().replace(/\s+/g, ' ').toLowerCase() || ''
      const optionsText = Array.isArray(q.options) ? q.options.map((o) => o.text.trim().toLowerCase()).join('|') : ''
      const dedupeKey = `${questionText}|${q.subject}|${q.difficulty}|${optionsText}`
      if (uniqueQuestions.has(dedupeKey)) return false
      uniqueQuestions.set(dedupeKey, true)
      return true
    })

    // Filtrar por isActive
    const activeOnly = normalizedUnique.filter((q: any) => q.isActive)

    // Mapas para ámbitos compuestos (mantener compatibilidad con UI)
    const AMBITO_MAP: Record<string, string[]> = {
      ambito_linguistico: ['lengua', 'ingles', 'sociales'],
      ambito_cientifico: ['matematicas', 'sociales', 'tic'],
    }

    // Filtrado según subject/difficulty/topic
    let candidates = activeOnly.filter((q: any) => q.difficulty === difficulty)
    if (subject !== 'mixto') {
      if (AMBITO_MAP[subject]) {
        const subs = AMBITO_MAP[subject]
        candidates = candidates.filter((q: any) => subs.includes(q.subject))
      } else {
        // permitir subject:topic en formato 'lengua:comentario'
        let subjParam = subject
        let topicParam: string | undefined = undefined
        if (subject.includes(':')) {
          const parts = subject.split(':')
          subjParam = parts[0]
          topicParam = parts.slice(1).join(':')
        }
        candidates = candidates.filter((q: any) => q.subject === subjParam)
        if (topicParam) {
          const t = topicParam.toLowerCase()
          candidates = candidates.filter((q: any) => (q.topic || '').toLowerCase().includes(t))
        }
      }
    }

    // Si se proporciona un parámetro topic separado, aplicarlo también
    if (topic) {
      const t = topic.toLowerCase()
      candidates = candidates.filter((q: any) => (q.topic || '').toLowerCase().includes(t))
    }

    // Mezclar y recortar a 'count' sin repetir preguntas
    const final = shuffleArray(candidates).slice(0, Math.min(count, candidates.length))

    return NextResponse.json({ questions: final })
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}
