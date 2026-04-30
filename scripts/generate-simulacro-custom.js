const fs = require('fs/promises')
const path = require('path')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function mapSubject(materia) {
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

function mapDifficulty(d) {
  const n = Number(d)
  if (isNaN(n)) return d === 'avanzado' ? 'avanzado' : d === 'basico' ? 'basico' : 'intermedio'
  if (n <= 1) return 'basico'
  if (n === 2) return 'intermedio'
  return 'avanzado'
}

function parseClosedOptions(raw) {
  if (!raw) return []
  const parts = raw.split(/\s*\|\s*|;|\r?\n/).map(s => s.trim()).filter(Boolean)
  const cleaned = parts.map(p => p.replace(/^[A-Z]\)\s*/i, '').replace(/^[A-Z]\.\s*/i, '').replace(/^\([A-Z]\)\s*/i, '').trim())
  return cleaned
}

function parseCorrectIndex(resp, options) {
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

function isItemActive(item) {
  if (typeof item.APTA_MOTOR === 'undefined' && typeof item.APTA_CHATBOT === 'undefined') return true
  const val = String(item.APTA_MOTOR || item.APTA_CHATBOT || '').toLowerCase()
  return val.startsWith('s') || val === 'true' || val === '1'
}

function normalizeText(text) {
  if (!text) return ''
  return text
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function tokensFromText(text) {
  return new Set((normalizeText(text) || '').split(/\s+/).filter(Boolean))
}

function jaccard(a, b) {
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = new Set([...a, ...b]).size
  return union === 0 ? 0 : inter / union
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWithRng(array, rng) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

async function generate() {
  const args = parseArgs()
  const preset = args.preset || 'gradoMedio'
  const timeTotal = Number(args.timeTotal || '45') // minutes
  const seed = Number(args.seed || String(Math.floor(Math.random() * 1e9)))
  const secondsPerQuestionArg = args.secondsPerQuestion ? Number(args.secondsPerQuestion) : undefined

  const presets = { gradoMedio: { lengua: 6, sociales: 9, ingles: 5, matematicas: 6, tic: 10 } }
  const distribution = presets[preset] || presets.gradoMedio
  const totalQuestions = Object.values(distribution).reduce((a, b) => a + b, 0)
  const secondsPerQuestion = secondsPerQuestionArg || Math.max(30, Math.floor((timeTotal * 60) / Math.max(1, totalQuestions)))

  const datasetFile = path.join(process.cwd(), 'data', 'W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json')
  const raw = await fs.readFile(datasetFile, 'utf-8')
  const json = JSON.parse(raw)
  const items = json.dataset_preguntas || json.dataset || json.items || []

  const normalized = items.map((item) => {
    const idUnico = item.ID_Unico || (item.ID ? `ID-${item.ID}` : undefined)
    const _id = idUnico ? `examQuestion-${idUnico}` : `examQuestion-dataset-${Math.random().toString(36).slice(2, 9)}`
    const optionsText = parseClosedOptions(item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || item.opciones_cerradas || '')
    const correctIndex = parseCorrectIndex(item.RESPUESTA_CORRECTA || item.RESPUESTA_MODELO || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA || item.respuesta_correcta || '', optionsText)
    const options = optionsText.length > 0 ? optionsText.map((t, i) => ({ text: t, isCorrect: i === correctIndex })) : undefined
    const textReference = (item.TEXTO_REFERENCIA || item.texto_referencia || item.TEXTO_REFERENCIA || '')
    const reqImages = []
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
      source: { name: item.FUENTE || item.FUENTE_TEXTO || item.Fuente || 'Desconocida', year: item.Año || item.ANIO || item.year || null },
      original: item,
      isActive: isItemActive(item),
      textReference,
      reqImages,
    }
  })

  const uniqueQuestions = new Map()
  const normalizedUnique = normalized.filter(q => {
    const questionText = normalizeText(q.question)
    const optionsText = Array.isArray(q.options) ? q.options.map(o => normalizeText(o.text)).join('|') : ''
    const dedupeKey = `${questionText}|${normalizeText(q.subject)}|${normalizeText(q.difficulty)}|${optionsText}`
    if (uniqueQuestions.has(dedupeKey)) return false
    uniqueQuestions.set(dedupeKey, true)
    return true
  })

  const activeOnly = normalizedUnique.filter(q => q.isActive)

  const SIMILARITY_THRESHOLD = 0.6
  const rng = mulberry32(seed)
  const selectedById = new Set()
  const selectedQuestions = []

  for (const [subject, needed] of Object.entries(distribution)) {
    let candidates = activeOnly.filter(q => q.subject === subject && q.difficulty === 'intermedio')
    if (candidates.length < needed) {
      const more = activeOnly.filter(q => q.subject === subject)
      candidates = [...candidates, ...more]
    }
    const shuffled = shuffleWithRng(candidates, rng)
    for (const q of shuffled) {
      if (selectedQuestions.length >= totalQuestions) break
      if (selectedById.has(q._id)) continue
      const qTokens = tokensFromText(q.question || '')
      let tooSimilar = false
      for (const s of selectedQuestions) {
        const sTokens = tokensFromText(s.question || '')
        if (jaccard(qTokens, sTokens) >= SIMILARITY_THRESHOLD) { tooSimilar = true; break }
      }
      if (tooSimilar) continue
      selectedById.add(q._id)
      selectedQuestions.push(q)
      if (selectedQuestions.filter(s => s.subject === subject).length >= needed) break
    }
  }

  if (selectedQuestions.length < totalQuestions) {
    const remaining = shuffleWithRng(activeOnly.filter(q => !selectedById.has(q._id)), rng)
    for (const q of remaining) {
      if (selectedQuestions.length >= totalQuestions) break
      selectedById.add(q._id)
      selectedQuestions.push(q)
    }
  }

  const blocks = []
  for (const [subject, count] of Object.entries(distribution)) {
    const questionsForSubject = selectedQuestions.filter(q => q.subject === subject).slice(0, count)
    blocks.push({ subject, count: questionsForSubject.length, questions: questionsForSubject })
  }

  const simulacro = {
    id: `sim-custom-${Date.now()}`,
    seed,
    preset,
    timeTotalMinutes: timeTotal,
    secondsPerQuestion,
    totalQuestions: selectedQuestions.length,
    distribution,
    blocks,
    questions: selectedQuestions,
  }

  console.log(JSON.stringify(simulacro, null, 2))
}

generate().catch(err => { console.error(err); process.exit(1) })
