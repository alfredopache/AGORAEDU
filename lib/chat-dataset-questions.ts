import { enrichDatasetQuestion } from "@/lib/dataset-question-enrichment"
import { scoreItemForFpLevel, type FpLevel } from "@/lib/fp-level"
import {
  type ExamQuestionItem,
  formatExamQuestionsText,
} from "@/lib/exam-question-format"

export type ChatQuestionSubject =
  | "matematicas"
  | "lengua"
  | "sociales"
  | "ingles"
  | "tic"
  | "ciencias"
  | "general"

const QUESTION_KEYWORDS = [
  "pregunta", "preguntas", "ejercicio", "ejercicios",
  "simulacro", "simulacros", "test", "examen", "problema", "problemas",
  "práctica", "practica", "practicar", "repaso", "repasar", "entrenar",
  "cuestionario", "cuestionario", "desafio", "desafío", "reto",
]

const GENERATE_KEYWORDS = [
  "dame", "hazme", "genera", "crea", "ponme", "quiero",
  "necesito", "saca", "prepara", "haz",
]

const SUBJECT_PATTERNS: Array<{ subject: ChatQuestionSubject; pattern: RegExp }> = [
  { subject: "matematicas", pattern: /matem|ecuaci[oó]n|fracci[oó]n|porcentaje|[áa]rea|per[ií]metro|volumen|[áa]lgebra|geometr|[íi]stat/i },
  { subject: "lengua", pattern: /lengua(?!.*extranjera)|literatura|gram[áa]tica|ortograf|sinonim|figuras?\s+liter|comentario|redacci[oó]n|poema|texto\s+liter/i },
  { subject: "sociales", pattern: /sociales|historia|geograf|[íi]a\b|cronolog|revoluci|mapa\s+hist|acontecimiento|concepto\s+hist/i },
  { subject: "ingles", pattern: /ingl[eé]s|english|grammar|vocabulary|verb\s+tense|lengua extranjera/i },
  { subject: "tic", pattern: /\btic\b|tecnolog|inform[áa]tica|digital|hardware|software|internet/i },
  { subject: "ciencias", pattern: /ciencias?\s+naturales|biolog|f[ií]sica|qu[ií]mica|ecosistema|celula|c[eé]lula|naturales/i },
]

const PLACEHOLDER_OPTION = /soluci[oó]n correcta|error de signo|error de operaci[oó]n|resultado correcto|f[oó]rmula correcta|confunde|unidad incorrecta|opcion correcta|opción correcta|incorrecta plausible|claramente incorrecta/i

export function mapDatasetSubject(materia?: string): ChatQuestionSubject {
  if (!materia) return "general"
  const m = materia.toString().toLowerCase()
  if (m.includes("matem")) return "matematicas"
  if (m.includes("ingl")) return "ingles"
  if (m.includes("leng")) return "lengua"
  if (m.includes("hist") || m.includes("geogr") || m.includes("social") ||
      m.includes("opcion a") || m.includes("opción a") || m.includes("humanid")) return "sociales"
  if (m.includes("natur") || m.includes("biolog") || m.includes("quím") || m.includes("quim") ||
      m.includes("opcion c") || m.includes("opción c")) return "ciencias"
  if (m.includes("tic") || m.includes("tid") || m.includes("tecnolog") ||
      m.includes("opcion b") || m.includes("opción b")) return "tic"
  return "general"
}

export function detectQuestionSubject(query: string, scope?: string): ChatQuestionSubject | null {
  const normalized = (query || "").toLowerCase()
  if (!normalized) return null

  for (const { subject, pattern } of SUBJECT_PATTERNS) {
    if (pattern.test(normalized)) return subject
  }

  if (scope === "ambito_cientifico") return "matematicas"
  if (scope === "ambito_linguistico") return "lengua"

  return null
}

export function wantsDatasetQuestionGeneration(query: string, scope?: string): boolean {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return false

  const asksForQuestions = QUESTION_KEYWORDS.some((k) => normalized.includes(k))
  const asksToGenerate = GENERATE_KEYWORDS.some((k) => normalized.includes(k))
  const shortSubjectSwitch = /^(ahora|vamos|sigue|continua|continúa|m[aá]s)\s+(con\s+)?/i.test(normalized)
  const subjectMentioned = detectQuestionSubject(query, scope) !== null

  if (asksForQuestions) return true
  if (shortSubjectSwitch && subjectMentioned) return true
  if (asksToGenerate && /\d+\s*(preguntas?|ejercicios?)/i.test(normalized)) return true
  if (asksToGenerate && subjectMentioned) return true

  return false
}

export function resolveQuestionSubject(query: string, scope?: string): ChatQuestionSubject {
  return detectQuestionSubject(query, scope)
    || (scope === "ambito_cientifico" ? "matematicas" : "lengua")
}

function getItemSourceId(item: Record<string, unknown>): string {
  return String(item.ID_Unico || item.id || item.ID || "").trim()
}

export function extractRequestedCount(query: string, fpLevel: FpLevel = "gm"): number {
  const defaultCount = fpLevel === "gs" ? 7 : 5
  const maxCount = fpLevel === "gs" ? 12 : 10
  const minCount = fpLevel === "gs" ? 6 : 5
  const normalized = (query || "").toLowerCase()

  const explicit =
    normalized.match(/(?:^|\s)(\d{1,2})\s*(?:preguntas?|ejercicios?)\b/i) ||
    normalized.match(/(?:dame|hazme|genera|quiero|ponme|necesito|saca|prepara)\s*(\d{1,2})/i)

  if (explicit) {
    const count = Number(explicit[1])
    if (!Number.isNaN(count)) {
      return Math.max(minCount, Math.min(maxCount, count))
    }
  }

  return defaultCount
}

function parseClosedOptions(raw?: string): string[] {
  if (!raw) return []
  const parts = raw.split(/\s*\|\s*|;|\r?\n/).map((s) => s.trim()).filter(Boolean)
  return parts.map((p) =>
    p.replace(/^[A-Z]\)\s*/i, "").replace(/^[A-Z]\.\s*/i, "").replace(/^\([A-Z]\)\s*/i, "").trim()
  )
}

function hasPlaceholderOptions(options: string[]): boolean {
  if (options.length === 0) return false
  return options.every((opt) => PLACEHOLDER_OPTION.test(opt))
}

function cleanReferenceText(raw?: string): string {
  if (!raw) return ""
  return raw
    .replace(/\[REQ_IMAGE:[^\]]+\]/gi, "")
    .replace(/^Texto base real[^:]*:\s*/i, "")
    .replace(/^Referencia visual[^:]*:\s*/i, "")
    .replace(/^«|»$/g, "")
    .trim()
}

function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const TASK_START = /^(identificar|analizar|resolver|calcular|explicar|definir|ordenar|completar|redactar|comparar|localizar|expresar|elegir|señalar|clasificar|interpretar|relacionar|describir|evaluar|demostrar|aplicar|buscar|indicar|encontrar|reconocer|distinguir|comentar|leer|escribir|traducir|choose|complete|write|read|answer|find|explain|describe|calculate|solve|identify)/i

function isGenericTaskTitle(title: string): boolean {
  const trimmed = title.trim()
  return trimmed.length > 0 && trimmed.length < 90 && TASK_START.test(trimmed)
}

function humanizeTaskInstruction(task: string, tema: string, refText: string): string {
  const trimmed = task.trim().replace(/\.$/, "")
  const replacements: Array<[RegExp, string]> = [
    [/^identificar/i, "Identifica"],
    [/^analizar/i, "Analiza"],
    [/^resolver/i, "Resuelve"],
    [/^calcular/i, "Calcula"],
    [/^explicar/i, "Explica"],
    [/^definir/i, "Define"],
    [/^ordenar/i, "Ordena"],
    [/^completar/i, "Completa"],
    [/^redactar/i, "Redacta"],
    [/^comparar/i, "Compara"],
    [/^localizar/i, "Localiza"],
    [/^expresar/i, "Expresa"],
    [/^elegir/i, "Elige"],
    [/^señalar/i, "Señala"],
    [/^clasificar/i, "Clasifica"],
    [/^interpretar/i, "Interpreta"],
    [/^relacionar/i, "Relaciona"],
    [/^describir/i, "Describe"],
    [/^evaluar/i, "Evalúa"],
    [/^demostrar/i, "Demuestra"],
    [/^aplicar/i, "Aplica"],
    [/^comentar/i, "Comenta"],
    [/^leer/i, "Lee"],
    [/^escribir/i, "Escribe"],
    [/^traducir/i, "Traduce"],
  ]

  let instruction = trimmed
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(instruction)) {
      instruction = instruction.replace(pattern, replacement)
      break
    }
  }

  if (refText.length > 40) {
    return `${instruction} a partir del texto siguiente.`
  }
  if (tema) {
    return `${instruction} en relación con ${tema}.`
  }
  return `${instruction}.`
}

function buildEnunciado(item: Record<string, unknown>, enrichment: ReturnType<typeof enrichDatasetQuestion>): string {
  if (enrichment?.question) return enrichment.question

  const task = String(item.Pregunta || item.pregunta || "").trim()
  const purpose = String(item.PROPOSITO_PEDAGOGICO || "").trim()
  const refText = cleanReferenceText(String(item.TEXTO_REFERENCIA || item.texto_referencia || ""))
  const tema = String(item.Tema || item.SUBTEMA || item.tema || "").trim()
  const feedback = String(item.FEEDBACK_SEMILLA || item.pista || item.Pista || "").trim()

  if (refText.length > 40) {
    const excerpt = refText.length > 480 ? `${refText.slice(0, 480)}…` : refText
    const instruction = isGenericTaskTitle(task)
      ? humanizeTaskInstruction(task, tema, refText)
      : capitalizeFirst((task || purpose || `Responde sobre ${tema || "el tema indicado"}`).replace(/\.$/, ""))
    return `${instruction}\n\n«${excerpt}»`
  }

  if (isGenericTaskTitle(task)) {
    return humanizeTaskInstruction(task, tema, refText)
  }

  if (purpose && purpose.length > task.length + 15) {
    return capitalizeFirst(purpose.endsWith(".") ? purpose : `${purpose}.`)
  }

  if (task) {
    const withContext = tema && !task.toLowerCase().includes(tema.toLowerCase())
      ? `${task.replace(/\.$/, "")} (${tema})`
      : task
    return capitalizeFirst(withContext.endsWith(".") ? withContext : `${withContext}.`)
  }

  if (feedback.length > 20) {
    return capitalizeFirst(feedback.endsWith(".") ? feedback : `${feedback}.`)
  }

  return "Responde a la pregunta indicada."
}

function formatOptionsList(options: string[]): string {
  return options
    .slice(0, 6)
    .map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`)
    .join(" | ")
}

function scoreItemAgainstQuery(item: Record<string, unknown>, query: string, fpLevel: FpLevel = "gm"): number {
  const text = [
    item.Pregunta, item.pregunta, item.Tema, item.tema, item.SUBTEMA,
    item.Competencia, item.competencia, item.Explicación, item.explicacion,
    item.ALIAS_PREGUNTA, item.alias, item.PROPOSITO_PEDAGOGICO,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const normalized = (query || "").toLowerCase()
  const tokens = Array.from(new Set((normalized.match(/\b[a-záéíóúñ]{4,}\b/gi) || []).map((t) => t.toLowerCase())))

  let score = 0
  for (const token of tokens) {
    if (text.includes(token)) score += 1
  }

  if (normalized.includes("ecuacion") && text.includes("ecuación")) score += 3
  if (normalized.includes("fraccion") && text.includes("fracciones")) score += 3
  if (normalized.includes("literatura") && text.includes("literatura")) score += 3
  if (normalized.includes("historia") && text.includes("historia")) score += 3
  if (normalized.includes("figura") && text.includes("figura")) score += 3

  const apta = String(item.APTA_CHATBOT || item.APTA_MOTOR || "").toLowerCase()
  if (apta.startsWith("s") || apta === "true" || apta === "1") score += 1

  const refText = cleanReferenceText(String(item.TEXTO_REFERENCIA || item.texto_referencia || ""))
  if (refText.length > 60) score += 2
  if (enrichDatasetQuestion(item, [], 0)) score += 3
  if (String(item.PROPOSITO_PEDAGOGICO || "").length > 30) score += 1

  score += scoreItemForFpLevel(item, fpLevel)

  return score
}

export function datasetItemToExamQuestion(
  item: Record<string, unknown>,
  index: number,
): ExamQuestionItem {
  const rawOptions = parseClosedOptions(
    String(item.opciones || item.OPCIONES_CERRADAS || item.OPCIONES || item.OPTIONS || "")
  )
  const enrichment = enrichDatasetQuestion(item, rawOptions, index)

  let finalOptions = enrichment?.options || rawOptions
  if (hasPlaceholderOptions(finalOptions) && !enrichment?.options) {
    finalOptions = []
  }

  const taskTitle = String(item.Pregunta || item.pregunta || item.competencia || item.Competencia || "").trim()
  const enunciado = buildEnunciado(item, enrichment)
  const tipo = String(item.tipo || item.Tipo || "").trim()
  const isOpen = tipo.toLowerCase().includes("abierta") || finalOptions.length === 0

  const explanation = [
    enrichment?.explanation,
    item.Explicación, item.Explicacion, item.explicacion,
  ].filter(Boolean).map(String).find((v) => v.length >= 10)

  const pista = String(item.pista || item.Pista || item.FEEDBACK_SEMILLA || "").trim() || undefined

  const respuestaModelo = String(
    item.respuesta_correcta || item.RESPUESTA_MODELO_EXCELENTE || item.RESPUESTA_CORRECTA || ""
  ).trim()

  return {
    pregunta: enunciado,
    titulo: taskTitle && taskTitle !== enunciado && !isGenericTaskTitle(taskTitle) ? taskTitle : undefined,
    tipo: isOpen ? "Abierta" : (tipo || "Cerrada"),
    tema: String(enrichment?.topic || item.tema || item.Tema || item.SUBTEMA || "").trim() || undefined,
    opciones: finalOptions.length > 0 ? formatOptionsList(finalOptions) : undefined,
    alias: String(item.alias || item.ALIAS_PREGUNTA || "").trim() || undefined,
    sourceId: getItemSourceId(item) || undefined,
    texto_referencia: cleanReferenceText(String(item.TEXTO_REFERENCIA || item.texto_referencia || "")) || undefined,
    respuesta_correcta:
      respuestaModelo && !/^(\[ABIERTA|ver respuesta)/i.test(respuestaModelo)
        ? respuestaModelo
        : undefined,
    rubrica: String(item.rubrica || item.RUBRICA_MODELO || "").trim() || undefined,
    pista,
    explicacion: explanation,
  }
}

function getItemTopicKey(item: Record<string, unknown>): string {
  return String(item.Tema || item.tema || item.SUBTEMA || item.competencia || item.Competencia || item.ID_Unico || item.id || "")
    .toLowerCase()
    .trim()
}

function pickDiverseItems(
  ranked: Array<{ item: Record<string, unknown>; score: number }>,
  count: number,
): Record<string, unknown>[] {
  const picked: Record<string, unknown>[] = []
  const usedTopics = new Set<string>()
  const usedIds = new Set<string>()

  for (const { item } of ranked) {
    if (picked.length >= count) break
    const topic = getItemTopicKey(item)
    const id = String(item.ID_Unico || item.id || item.ID || "")
    if (topic && usedTopics.has(topic)) continue
    picked.push(item)
    if (topic) usedTopics.add(topic)
    if (id) usedIds.add(id)
  }

  for (const { item } of ranked) {
    if (picked.length >= count) break
    const id = String(item.ID_Unico || item.id || item.ID || "")
    if (id && usedIds.has(id)) continue
    if (picked.includes(item)) continue
    picked.push(item)
    if (id) usedIds.add(id)
  }

  return picked
}

export function pickRankedQuestions(
  items: Record<string, unknown>[],
  query: string,
  subject: ChatQuestionSubject,
  count: number,
  fpLevel: FpLevel = "gm",
  excludeIds: string[] = [],
): Record<string, unknown>[] {
  const exclude = new Set(excludeIds.filter(Boolean))
  const filtered = items.filter((item) => {
    const itemSubject = mapDatasetSubject(String(item.Materia || item.materia || ""))
    if (subject === "matematicas") {
      return itemSubject === "matematicas" || item.materia === "Matemáticas"
    }
    return itemSubject === subject
  })

  const pool = (filtered.length > 0 ? filtered : items.filter((item) => mapDatasetSubject(String(item.Materia || item.materia || "")) === subject))
    .filter((item) => {
      const id = getItemSourceId(item)
      return !id || !exclude.has(id)
    })

  const ranked = [...pool]
    .map((item) => ({ item, score: scoreItemAgainstQuery(item, query, fpLevel) }))
    .sort((a, b) => b.score - a.score)

  return pickDiverseItems(ranked, count)
}

const SUBJECT_LABELS: Record<ChatQuestionSubject, string> = {
  matematicas: "Matemáticas",
  lengua: "Lengua y Literatura",
  sociales: "Geografía e Historia",
  ingles: "Inglés",
  tic: "TIC",
  ciencias: "Ciencias Naturales",
  general: "la materia indicada",
}

export function getSubjectLabel(subject: ChatQuestionSubject): string {
  return SUBJECT_LABELS[subject] || SUBJECT_LABELS.general
}

export async function fetchQuestionsForChat(params: {
  query: string
  subject: ChatQuestionSubject
  fpLevel: FpLevel
  count: number
  excludeIds?: string[]
  loadMathDataset: () => Promise<Record<string, unknown>[]>
  loadMainDataset: () => Promise<Record<string, unknown>[]>
}): Promise<{ items: Record<string, unknown>[]; source: string }> {
  const { query, subject, fpLevel, count, excludeIds = [], loadMathDataset, loadMainDataset } = params
  let picked: Record<string, unknown>[] = []
  let source = "data/W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json"

  if (subject === "matematicas") {
    const mathDataset = await loadMathDataset()
    if (mathDataset.length > 0) {
      picked = pickRankedQuestions(mathDataset, query, "matematicas", count, fpLevel, excludeIds)
      source = "data/asignaturas/math_questions_from_dataset.json"
    }
  }

  if (picked.length < count) {
    const mainDataset = await loadMainDataset()
    const stillNeeded = count - picked.length
    const more = pickRankedQuestions(mainDataset, query, subject, stillNeeded, fpLevel, [
      ...excludeIds,
      ...picked.map(getItemSourceId).filter(Boolean),
    ])
    picked = [...picked, ...more]
  }

  return { items: picked.slice(0, count), source }
}

export function buildExamQuestionsResponse(
  items: Record<string, unknown>[],
  source: string,
): { message: string; examQuestions: ExamQuestionItem[]; source: string } {
  const examQuestions = items.map((item, index) => datasetItemToExamQuestion(item, index))
  return {
    message: `${formatExamQuestionsText(examQuestions)}\n\nFuente: ${source}`,
    examQuestions,
    source,
  }
}

export { formatExamQuestionsText }
