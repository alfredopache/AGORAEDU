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
    const excludeParam = searchParams.get("exclude") // comma-separated _id values already seen by the user
    const excludeSet = new Set(
      excludeParam ? excludeParam.split(',').map((s) => s.trim()).filter(Boolean) : []
    )

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
      if (m.includes('hist') || m.includes('geogr') || m.includes('social') ||
          m.includes('opcion a') || m.includes('opción a') || m.includes('humanid') ||
          m.includes('econom') || m.includes('empresa')) return 'sociales'
      if (m.includes('natur') || m.includes('biolog') || m.includes('quím') || m.includes('quim') ||
          m.includes('opcion c') || m.includes('opción c')) return 'ciencias'
      if (m.includes('tic') || m.includes('tid') || m.includes('tractament') ||
          m.includes('tratamiento de la inform') || m.includes('digital') ||
          m.includes('tecnolog') || m.includes('opcion b') || m.includes('opción b')) return 'tic'
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

    function parseCorrectIndex(resp: string | undefined, options: string[]) {
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

    // Mapa de PDFs oficiales (València · Grado Medio) — usado como fallback si no hay URL en el item
    const VALENCIA_GM_PDFS: Record<string, string> = {
      '2017': 'https://ceice.gva.es/documents/388109149/391038839/GM_2017.pdf',
      '2018': 'https://ceice.gva.es/documents/388109149/391038839/GM_2018.pdf',
      '2019': 'https://ceice.gva.es/documents/388109149/391038839/GM_2019.pdf',
      '2020': 'https://ceice.gva.es/documents/388109149/391038839/GM_2020.pdf',
      '2021': 'https://ceice.gva.es/documents/388109149/391038839/GM_2021.pdf',
      '2022': 'https://ceice.gva.es/documents/388109149/391038839/GM_2022.pdf',
      '2023': 'https://ceice.gva.es/documents/388109149/391038839/GM_2023.pdf',
      '2024': 'https://ceice.gva.es/documents/388109149/391038839/GM_2024.pdf',
      '2025': 'https://ceice.gva.es/documents/388109149/0/JUNTOS+GM+2025.pdf/eaff2543-5199-f592-6af1-aa689a78ea67',
    }

    // Normalizar preguntas
    const normalized = items.map((item: any) => {
      const idUnico = item.ID_Unico || (item.ID ? `ID-${item.ID}` : undefined)
      const _id = idUnico ? `examQuestion-${idUnico}` : `examQuestion-dataset-${Math.random().toString(36).slice(2, 9)}`
      const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || '')
      const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || '', optionsText)

      const options = optionsText.length > 0 ? optionsText.map((t: string, i: number) => ({ text: t, isCorrect: i === correctIndex })) : undefined
      
      const textReference = (item.TEXTO_REFERENCIA || item.texto_referencia || item.textReference || '')
      const reqImages: string[] = []
      if (textReference && typeof textReference === 'string') {
        const matches = Array.from(textReference.matchAll(/\[REQ_IMAGE:\s*([^\]]+)\]/ig)).map(m => m[1])
        for (const m of matches) reqImages.push(m)
      }

      const srcName = item.FUENTE || item.FUENTE_TEXTO || item.Fuente || 'Desconocida'
      const srcYear = item.Año || item.ANIO || item.year || null
      let srcUrl = item.FUENTE_URL || item.FUENTE_LINK || item.URL || item.link || item.PDF_URL || null
      // fallback: si la fuente es REAL_PDF y tenemos un año conocido, enlazar al PDF oficial de València
      if (!srcUrl && String(srcName).toUpperCase().includes('REAL_PDF') && srcYear) {
        const y = String(srcYear)
        if (VALENCIA_GM_PDFS[y]) srcUrl = VALENCIA_GM_PDFS[y]
      }

      return {
        _id,
        question: item.Pregunta || item.question || item.enunciado || item.PREGUNTA || 'Sin enunciado',
        subject: mapSubject(item.Materia || item.materia || item.SUBJETO || item.SUBJECT),
        topic: item.Tema || item.SUBTEMA || item.topic || '',
        difficulty: mapDifficulty(item.Dificultad || item.DIFICULTAD || item.Nivel || item.NIVEL || ''),
        options,
        explanation: [item.Explicación, item.RUBRICA_MODELO, item.RESPUESTA_MODELO_EXCELENTE, item.Explicacion].filter(Boolean).join('\n\n'),
        source: { name: srcName, year: srcYear || null, region: item.Region || item.REGION || item.Comunidad || item.COMUNIDAD || 'Nacional', url: srcUrl || null },
        original: item,
        isActive: isItemActive(item),
        textReference,
        reqImages,
      }
    })

    // Eliminar preguntas duplicadas basadas en el texto, materia, dificultad y opciones
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

    // Filtrar por isActive
    const activeOnly = normalizedUnique.filter((q: any) => q.isActive)

    // Mapas para ámbitos compuestos (mantener compatibilidad con UI)
    const AMBITO_MAP: Record<string, string[]> = {
      ambito_linguistico: ['lengua', 'ingles', 'sociales'],
      ambito_cientifico: ['matematicas', 'ciencias', 'tic'],
    }

    // Filter by subject first (no difficulty hard-filter — fallback to any difficulty)
    let subjectPool: any[] = activeOnly
    if (subject !== 'mixto') {
      if (AMBITO_MAP[subject]) {
        const subs = AMBITO_MAP[subject]
        subjectPool = activeOnly.filter((q: any) => subs.includes(q.subject))
      } else {
        let subjParam = subject
        let topicParam: string | undefined = undefined
        if (subject.includes(':')) {
          const parts = subject.split(':')
          subjParam = parts[0]
          topicParam = parts.slice(1).join(':')
        }

        const subjectCandidates = subjectPool.filter((q: any) => q.subject === subjParam)
        if (topicParam) {
          const topicNormalized = normalizeText(topicParam)
          const topicCandidates = subjectCandidates.filter((q: any) => {
            const topicMatch = normalizeText(q.topic || q.original?.Tema || q.original?.SUBTEMA || q.original?.topic)
            const questionMatch = normalizeText(q.question)
            const sourceMatch = normalizeText(q.source?.name)
            return (
              topicMatch.includes(topicNormalized) ||
              questionMatch.includes(topicNormalized) ||
              sourceMatch.includes(topicNormalized)
            )
          })
          subjectPool = topicCandidates.length > 0 ? topicCandidates : subjectCandidates
        } else {
          subjectPool = subjectCandidates
        }
      }
    }

    // Prefer requested difficulty but fall back to all difficulties if not enough results
    // First, try to exclude already-seen questions; if not enough fresh ones, use full pool
    if (excludeSet.size > 0) {
      const freshPool = subjectPool.filter((q: any) => !excludeSet.has(q._id))
      if (freshPool.length >= count) {
        subjectPool = freshPool
      }
      // else: not enough fresh questions for this subject → repeat is OK, keep full pool
    }

    let candidates = subjectPool.filter((q: any) => q.difficulty === difficulty)
    if (candidates.length < count) {
      candidates = subjectPool
    }

    // Si se proporciona un parámetro topic separado, aplicarlo también
    if (topic) {
      const topicNormalized = normalizeText(topic)
      const topicCandidates = candidates.filter((q: any) => {
        const topicMatch = normalizeText(q.topic || q.original?.Tema || q.original?.SUBTEMA || q.original?.topic)
        const questionMatch = normalizeText(q.question)
        const sourceMatch = normalizeText(q.source?.name)
        return (
          topicMatch.includes(topicNormalized) ||
          questionMatch.includes(topicNormalized) ||
          sourceMatch.includes(topicNormalized)
        )
      })
      if (topicCandidates.length > 0) {
        candidates = topicCandidates
      }
    }

    // Mezclar y seleccionar preguntas evitando repeticiones semánticas
    // Seleccionamos hasta 'count' preguntas intentando evitar enunciados demasiado similares
    const needed = Math.min(count, candidates.length)
    const shuffled = shuffleArray<any>(candidates as any)

    function tokensFromText(text: string) {
      return new Set((normalizeText(text) || '').split(/\s+/).filter(Boolean))
    }

    function jaccard(a: Set<string>, b: Set<string>) {
      let inter = 0
      for (const t of a) if (b.has(t)) inter++
      const union = new Set([...a, ...b]).size
      return union === 0 ? 0 : inter / union
    }

    const selected: any[] = []
    const SIMILARITY_THRESHOLD = 0.6 // ajustar si hace falta (0..1)

    for (const q of shuffled) {
      if (selected.length >= needed) break
      const qTokens = tokensFromText(q.question || '')
      let tooSimilar = false
      for (const s of selected) {
        const sTokens = tokensFromText(s.question || '')
        if (jaccard(qTokens, sTokens) >= SIMILARITY_THRESHOLD) {
          tooSimilar = true
          break
        }
      }
      if (!tooSimilar) selected.push(q)
    }

    // Si por la deduplicación no llegamos al número requerido, rellenamos con los restantes (fallback)
    if (selected.length < needed) {
      for (const q of shuffled) {
        if (selected.length >= needed) break
        if (!selected.find((s) => s._id === q._id)) selected.push(q)
      }
    }

    const final = selected.slice(0, needed)

    return NextResponse.json({ questions: final })
  } catch (error) {
    console.error("Error obteniendo preguntas:", error)
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    )
  }
}
