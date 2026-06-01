import { NextRequest, NextResponse } from "next/server"

import { getEduIAPlan } from "@/lib/eduia-plans"
import {
  buildExamQuestionsResponse,
  extractRequestedCount,
  fetchQuestionsForChat,
  getSubjectLabel,
  resolveQuestionSubject,
  wantsDatasetQuestionGeneration,
} from "@/lib/chat-dataset-questions"
import { attachExamQuestionsFromText } from "@/lib/exam-question-format"
import { buildChatSystemPrompt, buildQuestionFallbackMessage } from "@/lib/ai-prompts"
import { isFpLevel, type FpLevel } from "@/lib/fp-level"
import { promises as fs } from "fs"
import path from "path"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface IncomingUserProfile {
  name?: string
  itinerary?: string
  currentSituation?: string
  focus?: string
  selfAssessment?: string
  difficulty?: string
  mainUse?: string
  learningStyle?: string
  timeAvailable?: string
  levelTest?: string
  accompanimentStyle?: string
}

// --- Lightweight local dataset retrieval to ground answers ---
let DATASET_CACHE: any[] | null = null
let MATH_DATASET_CACHE: any[] | null = null
const DATASET_PATH = path.join(process.cwd(), "data", "W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json")
const MATH_DATASET_PATH = path.join(process.cwd(), "data", "asignaturas", "math_questions_from_dataset.json")

interface SubjectIndexEntry {
  label: string
  scope: string
  count: number
  indexFile: string
  topics: string[]
}
interface SubjectMasterIndex {
  generatedAt: string
  subjects: Record<string, SubjectIndexEntry>
}
let SUBJECT_INDEX_CACHE: SubjectMasterIndex | null = null
const SUBJECT_INDEX_PATH = path.join(process.cwd(), "data", "asignaturas", "index.json")

async function loadSubjectIndex(): Promise<SubjectMasterIndex | null> {
  if (SUBJECT_INDEX_CACHE) return SUBJECT_INDEX_CACHE
  try {
    const raw = await fs.readFile(SUBJECT_INDEX_PATH, "utf8")
    SUBJECT_INDEX_CACHE = JSON.parse(raw) as SubjectMasterIndex
    return SUBJECT_INDEX_CACHE
  } catch {
    return null
  }
}

function buildSubjectIndexContext(index: SubjectMasterIndex): string {
  const lines: string[] = [
    'Exámenes oficiales en PDF disponibles por asignatura (120 PDFs, histórico oficial):',
    '',
  ]
  for (const [, info] of Object.entries(index.subjects)) {
    lines.push(`- ${info.label}: ${info.count} PDFs`)
    if (info.topics.length > 0) {
      lines.push(`  Subtemas/ejercicios: ${info.topics.slice(0, 5).join(', ')}`)
    }
  }
  lines.push('')
  lines.push('Cuando el alumno pregunte por cualquiera de estas asignaturas, confirma que dispones de exámenes oficiales y guíale con el contenido real del histórico.')
  return lines.join('\n')
}

async function loadLocalDataset(): Promise<any[]> {
  if (DATASET_CACHE) return DATASET_CACHE
  try {
    const raw = await fs.readFile(DATASET_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      DATASET_CACHE = parsed
    } else if (Array.isArray(parsed?.dataset_preguntas)) {
      DATASET_CACHE = parsed.dataset_preguntas
    } else if (Array.isArray(parsed?.questions)) {
      DATASET_CACHE = parsed.questions
    } else if (Array.isArray(parsed?.items)) {
      DATASET_CACHE = parsed.items
    } else if (Array.isArray(parsed?.data)) {
      DATASET_CACHE = parsed.data
    } else {
      // fallback: try to extract array-like values
      DATASET_CACHE = Array.isArray(Object.values(parsed)) ? Object.values(parsed).flat() : []
    }
    return DATASET_CACHE || []
  } catch (e) {
    // file may be absent in some environments; silently continue
    return []
  }
}

async function loadMathDataset(): Promise<any[]> {
  if (MATH_DATASET_CACHE) return MATH_DATASET_CACHE
  try {
    const raw = await fs.readFile(MATH_DATASET_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      MATH_DATASET_CACHE = parsed
    } else if (Array.isArray(parsed?.items)) {
      MATH_DATASET_CACHE = parsed.items
    } else if (Array.isArray(parsed?.questions)) {
      MATH_DATASET_CACHE = parsed.questions
    } else {
      MATH_DATASET_CACHE = []
    }
    return MATH_DATASET_CACHE || []
  } catch (e) {
    return []
  }
}

function isMathRelatedQuery(query: string, scope?: string) {
  if (scope === "ambito_cientifico") return true
  const normalized = (query || "").toLowerCase()
  if (!normalized) return false
  const keywords = [
    // variations and colloquial forms
    "matem",
    "matemát",
    "matematic",
    "matemat",
    "matematicas",
    "matemáticas",
    "mate",
    "mates",
    // common math topics
    "ecuacion",
    "fraccion",
    "porcentaje",
    "area",
    "área",
    "perimetro",
    "perímetro",
    "volumen",
    "algebra",
    "álgebra",
    "geometr",
    "estadistic",
    "estadíst",
    "problema",
    "operacion",
    "operación",
    "resolver",
    "raiz",
    "raíz",
  ]

  return keywords.some((keyword) => normalized.includes(keyword))
}

function excerptFromItem(item: any, max = 300) {
  if (!item) return ""
  const label = [item.alias, item.ALIAS_PREGUNTA, item.id, item.ID].filter(Boolean).join(" | ")
  const keys = ["pregunta", "Pregunta", "enunciado", "Explicación", "Explicacion", "RUBRICA_MODELO", "texto", "question", "explanation", "answer"]
  for (const k of keys) {
    if (item[k]) return `${label ? `${label}: ` : ""}${String(item[k]).slice(0, max)}`
  }
  const joined = Object.values(item || {}).filter(Boolean).join(" ")
  return `${label ? `${label}: ` : ""}${String(joined).slice(0, max)}`
}

async function findRelevantDatasetExtracts(query: string, limit = 5, maxExcerptLength = 360, preferredDataset?: any[]) {
  if (!query || query.trim().length === 0) return []
  const ds = preferredDataset || await loadLocalDataset()
  if (!ds || ds.length === 0) return []
  const q = query.toLowerCase()
  const tokens = Array.from(new Set((q.match(/\b[a-záéíóúñ]{4,}\b/gi) || []).map(t => t.toLowerCase())))
  const scored = ds.map((it: any, idx: number) => {
    const text = (typeof it === "string" ? it : Object.values(it || {}).filter(Boolean).join(" ")).toLowerCase()
    let score = 0
    if (text.includes(q)) score += 3
    for (const t of tokens) if (text.includes(t)) score += 1
    return { item: it, score, idx }
  })
  scored.sort((a, b) => b.score - a.score)
  const picks = scored.filter(s => s.score > 0).slice(0, limit)
  return picks.map(p => ({ score: p.score, excerpt: excerptFromItem(p.item, maxExcerptLength) }))
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

async function callGroqWithRetries(groqApiKey: string, payload: any, maxAttempts = 4) {
  const url = "https://api.groq.com/openai/v1/chat/completions"
  let attempt = 0
  let lastErr: any = null

  while (attempt < maxAttempts) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (resp.ok) {
        return await resp.json()
      }

      const text = await resp.text()
      console.error("Error de Groq API:", text)

      // Retry on rate limit or server errors
      if (resp.status === 429 || resp.status >= 500) {
        const ra = resp.headers.get("retry-after")
        let wait = 1000 * Math.pow(2, attempt) // exponential backoff base
        if (ra) {
          const parsed = parseFloat(ra)
          if (!isNaN(parsed)) wait = Math.max(wait, parsed * 1000)
        }
        lastErr = text
        attempt++
        await sleep(wait)
        continue
      }

      // Non-retryable error
      throw new Error(`Groq API ${resp.status}: ${text}`)
    } catch (err) {
      lastErr = err
      attempt++
      const wait = 500 * Math.pow(2, attempt)
      await sleep(wait)
    }
  }

  throw new Error(`Groq API retries exhausted: ${String(lastErr).slice(0, 200)}`)
}
export async function POST(request: NextRequest) {
  try {
    const { messages, scope, userProfile, planId, fpLevel: rawFpLevel, excludeQuestionIds } = await request.json() as {
      messages: Message[]
      scope?: string
      userProfile?: IncomingUserProfile
      planId?: string
      fpLevel?: string
      excludeQuestionIds?: string[]
    }
    const fpLevel: FpLevel = isFpLevel(rawFpLevel) ? rawFpLevel : "gm"

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 }
      )
    }

    // Verificar que la API key de Groq esté configurada
    const groqApiKey = process.env.GROQ_API_KEY

    if (!groqApiKey) {
      console.error("GROQ_API_KEY no está configurada")
      return NextResponse.json(
        { 
          message: "⚠️ El servicio de IA aún no está configurado. \n\nPara activar Acceso IA:\n\n1. Ve a https://console.groq.com/keys\n2. Crea una cuenta gratuita\n3. Genera una API key\n4. Agrégala al archivo .env.local como GROQ_API_KEY\n\n¡Es completamente GRATIS! 🎉" 
        },
        { status: 200 }
      )
    }

    const activePlan = getEduIAPlan(planId)

    const profilePrompt = userProfile
      ? `Informacion del alumno:\n- Nombre: ${userProfile.name || "No indicado"}\n- Itinerario: ${userProfile.itinerary || "No indicado"}\n- Situacion actual: ${userProfile.currentSituation || "No indicada"}\n- Foco prioritario: ${userProfile.focus || "No indicado"}\n- Autoevaluacion: ${userProfile.selfAssessment || "No indicada"}\n- Dificultad principal: ${userProfile.difficulty || "No indicada"}\n- Uso principal: ${userProfile.mainUse || "No indicado"}\n- Estilo de aprendizaje: ${userProfile.learningStyle || "No indicado"}\n- Tiempo disponible: ${userProfile.timeAvailable || "No indicado"}\n- Prueba de nivel: ${userProfile.levelTest || "No indicada"}\n- Estilo de acompanamiento: ${userProfile.accompanimentStyle || "No indicado"}\nUtiliza esta informacion para personalizar de verdad las respuestas, ajustar profundidad, ejemplos, ritmo y prioridades.`
      : ""

    const lastUserContent = (messages && messages.length > 0)
      ? (Array.from(messages).reverse().find(m => m.role === "user")?.content || messages.map((m: Message) => m.content).join(" "))
      : ""
    const isMathQuery = isMathRelatedQuery(lastUserContent, scope)
    const wantsGeneratedQuestions = wantsDatasetQuestionGeneration(lastUserContent, scope)
    const subjectIndex = await loadSubjectIndex()

    if (wantsGeneratedQuestions) {
      const subject = resolveQuestionSubject(lastUserContent, scope)
      const requestedCount = extractRequestedCount(lastUserContent, fpLevel)
      const excludeIds = Array.isArray(excludeQuestionIds)
        ? excludeQuestionIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        : []

      const { items, source } = await fetchQuestionsForChat({
        query: lastUserContent,
        subject,
        fpLevel,
        count: requestedCount,
        excludeIds,
        loadMathDataset,
        loadMainDataset: loadLocalDataset,
      })

      if (items.length > 0) {
        return NextResponse.json(buildExamQuestionsResponse(items, source))
      }

      return NextResponse.json({
        message: buildQuestionFallbackMessage(getSubjectLabel(subject)),
      })
    }

    const mathDataset = isMathQuery ? await loadMathDataset() : null

    const dsLimit = activePlan.id === "university" ? 3 : activePlan.id === "master" ? 2 : 1
    const excerptLen = activePlan.id === "university" ? 240 : activePlan.id === "master" ? 180 : 120
    const relevantExtracts = await findRelevantDatasetExtracts(lastUserContent, dsLimit, excerptLen, mathDataset || undefined)
    const datasetContext = relevantExtracts && relevantExtracts.length > 0
      ? [
          isMathQuery
            ? "Contexto del dataset de Matemáticas (usa estas preguntas como fuente prioritaria):"
            : "Contexto del dataset (extractos relevantes):",
          "",
        ].concat(relevantExtracts.map((r: any, i: number) => `${i + 1}. ${r.excerpt}`)).join("\n\n")
      : null

    const formattedMessages = [
      {
        role: "system",
        content: buildChatSystemPrompt({
          planId: activePlan.id,
          planName: activePlan.name,
          fpLevel,
          scope,
          profilePrompt: profilePrompt || undefined,
          subjectIndexContext: subjectIndex ? buildSubjectIndexContext(subjectIndex) : undefined,
          datasetContext: datasetContext || undefined,
          isMathQuery,
        }),
      },
      ...messages.map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Llamar a la API de Groq con reintentos en caso de rate limit / errores 5xx
    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      temperature: activePlan.id === "university" ? 0.18 : 0.22,
      max_tokens: activePlan.id === "university" ? 1000 : 700,
      top_p: 1,
      stream: false,
    }

    let data: any
    try {
      data = await callGroqWithRetries(groqApiKey, payload, 4)
    } catch (err) {
      console.error("Error de Groq API (reintentos):", err)
      throw err
    }

    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      throw new Error("No se recibió respuesta del modelo")
    }

    // Sanitizar tokens internos [REQ_IMAGE: ...] para que no se muestren crudos al usuario
    const sanitizedMessage = assistantMessage.replace(/\[REQ_IMAGE:\s*([^\]]+)\]/ig, (_m: string, id: string) => {
      return `Recurso visual requerido: ${id}. (Si la imagen no está disponible, puedo describirla brevemente bajo petición.)`
    })

    return NextResponse.json({
      ...attachExamQuestionsFromText(sanitizedMessage),
    })
  } catch (error) {
    console.error("Error en chat API:", error)
    return NextResponse.json(
      { 
        message: "Lo siento, ha ocurrido un error al procesar tu pregunta. Por favor, inténtalo de nuevo en unos momentos." 
      },
      { status: 200 }
    )
  }
}
