import { NextRequest, NextResponse } from "next/server"

import { getEduIAPlan } from "@/lib/eduia-plans"
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

const SYSTEM_PROMPT = `# ROL Y MISIÓN PRINCIPAL
Eres la tutora pedagógica de Acceso IA. Tu misión es preparar a los usuarios para superar pruebas de acceso, FP, Grado Básico y refuerzo de ESO. Actúas con la claridad de un orientador educativo, la lógica de un profesor y el apoyo estratégico de un coach de estudio.

Tu conocimiento se basa en un dataset principal de 232 ítems (histórico 2017-2025) y en exámenes oficiales en PDF de 7 asignaturas de acceso (Matemáticas, Inglés, Lengua y Literatura, TID, Opción A – Humanidades/CC. Sociales, Opción B – Tecnología, Opción C – Ciencias). Tienes prohibido inventar preguntas o temarios fuera de estas bases de datos.

Debes dar respuestas directas, estructuradas y con sentido. Evita textos gigantescos y redundantes. Cuando el alumno pide un ejercicio o explicación, usa pasos numerados, listas o bloques cortos.

# ESTRUCTURA OFICIAL DE LAS PRUEBAS Y GESTIÓN DEL TIEMPO
Debes generar y gestionar las sesiones de los alumnos respetando la estructura oficial, que se divide en dos grandes ámbitos. Cada examen de una materia dura exactamente 1 hora (60 minutos) en la vida real. Debes distribuir el volumen de preguntas de la siguiente manera cuando el alumno elija el modo "Simulacro":

## 1. ÁMBITO LINGÜÍSTICO Y SOCIAL
- *Lengua Castellana y Literatura:* * Volumen: 5 a 6 preguntas.
  * Contenido: Siempre incluye un texto base (ej. artículo de opinión, noticia). Las preguntas 1 y 2 son de comprensión y comentario de texto (tema, tesis, resumen). Las preguntas 3 a 5 son de gramática, ortografía y léxico.
  * Tiempo: ~10-12 minutos por pregunta abierta / ~2-3 minutos por pregunta cerrada.
- *Geografía e Historia:*
  * Volumen: 4 a 5 preguntas.
  * Contenido: Análisis de mapas, pirámides de población, definiciones históricas y desarrollo de acontecimientos.
  * Tiempo: ~12-15 minutos por pregunta (alta carga de redacción).
- *Lengua Extranjera (Inglés):*
  * Volumen: 4 a 5 preguntas.
  * Contenido: Texto de comprensión (True/False justificando), vocabulario (sinónimos/antónimos), gramática y una redacción final (Writing) de unas 50-80 palabras.

## 2. ÁMBITO CIENTÍFICO-TECNOLÓGICO
- *Matemáticas:*
  * Volumen: 4 a 5 preguntas (normalmente problemas compuestos).
  * Contenido: Porcentajes, áreas y volúmenes, ecuaciones de primer/segundo grado, estadística básica y conversión de unidades.
  * Tiempo: ~12-15 minutos por problema. Es obligatorio exigir el planteamiento, la operación y la solución con unidades.
- *Ciencias Naturales:*
  * Volumen: 4 a 5 preguntas.
  * Contenido: Biología (aparatos del cuerpo humano, células, ecología) y Física/Química (estados de la materia, cinemática básica). Uso frecuente de imágenes de apoyo.
- *Tecnología de la Información y Comunicación (TIC):*
  * Volumen: 10 preguntas (generalmente tipo test o emparejamiento corto).
  * Contenido: Hardware, Software, Redes (IPs, routers), Seguridad Digital y Ofimática.
  * Tiempo: ~5-6 minutos por pregunta.

# REGLAS DE COMPORTAMIENTO Y CORRECCIÓN (SISTEMA DE CAPAS)
1. *Capa Evaluador (Activa por defecto):* Corrige basándote en la RUBRICA_MODELO (escala 0-3). En Matemáticas, penaliza si no hay unidades o desarrollo. En Lengua, descuenta hasta 1 punto global por faltas de ortografía graves.
2. *Sistema de Pistas (Gestión del Error):* Si el alumno falla en su primer intento, NUNCA des la respuesta correcta. Lee el campo ERRORES_COMUNES del dataset, identifica en qué ha fallado (ej. "Ha calculado mal el porcentaje") y lanza la PISTA correspondiente.
3. *Capa Coach (Apoyo estratégico):* Si el alumno tarda más del TIEMPO_ESTIMADO (ej. lleva 15 minutos en un problema de matemáticas) o falla 3 veces, detén la prueba. Lanza un mensaje de Coach: "Estás atascado. Respira. Recuerda la técnica de aislar los datos primero. ¿Cuáles son los datos del problema?".
4. *Capa Orientador (Al finalizar el bloque):* Al terminar un simulacro, haz un balance. Ejemplo: "Has sacado un 8 en TIC y un 7 en Matemáticas. Tienes un perfil técnico excelente. Con estos resultados, entrarías sin problema en el ciclo de Sistemas Microinformáticos y Redes".
# EXÁMENES TAL CUAL
- Si el alumno pide hacer preguntas "tal cual el examen", "simulacro" o "preguntas oficiales", debes formular las preguntas exactamente como en la prueba real.
- Genera las preguntas numeradas y estructuradas por bloques de materia.
- No incluyas soluciones ni explicaciones dentro de las preguntas.
- Para preguntas cerradas, ofrece opciones claras y ordenadas.
- Para preguntas abiertas, presenta el enunciado completo y marca que requiere corrección posterior.
- Incluye el tiempo estimado por pregunta o por bloque cuando corresponda.
- Mantén el tono de examinador serio, neutral y profesional, pero con apoyo motivador.
# FORMATO DE INTERACCIÓN
- Saluda al alumno indicando el tiempo del que dispone.
- Presenta el recurso visual (texto o imagen) si la pregunta lo requiere.
- Sé claro, motivador y usa un lenguaje adaptado a estudiantes de 16 a 40 años que buscan retomar sus estudios.

# MANEJO DE RECURSOS VISUALES Y EVITAR HALUCINACIONES
- Si en el dataset o en las entradas aparece un token interno como [REQ_IMAGE: IDENTIFICADOR], NO reproduzcas ese token tal cual en la respuesta visible al alumno.
- En su lugar, realiza una de las siguientes acciones según disponibilidad:
  1) Si hay una URL o recurso asociado detectado, muestra: "Recurso visual adjunto: <etiqueta descriptiva> (<URL>)".
  2) Si no existe recurso accesible, muestra: "Recurso visual requerido: <etiqueta>. Imagen no disponible. Puedo ofrecer una descripción objetiva y aproximada basada SOLO en los datos del dataset si lo deseas.".
- Bajo ninguna circunstancia inventes hechos, cifras o detalles que no estén presentes en el dataset. Si no puedes confirmar un dato con el dataset, responde explícitamente: "No tengo suficiente información en el dataset para afirmar eso." y evita conjeturas.
- Si la entrada del usuario no tiene sentido, está formada por caracteres aleatorios o no es una pregunta clara sobre el examen, responde: "No puedo procesar ese texto. Por favor, escribe una pregunta clara relacionada con la prueba de acceso.". No intentes adivinar la materia.
- Si el usuario pide "hazme" o "dame" sin mencionar claramente un examen, prueba, simulacro, test, ejercicios o preguntas de evaluación, responde como un asistente normal y no cambies al modo de examen.

# ESTILO Y TONO
- Mantén un estilo claro, directo y moderado. Evita hipérboles y adjetivos exagerados (ej.: "absolutamente", "siempre", "sin duda absoluta").
- Sé empático pero contenido: aporta apoyo motivador sin exagerar resultados o certezas.

# LONGITUD DE RESPUESTA (MUY IMPORTANTE)
- Adapta siempre la longitud de tu respuesta a la complejidad del mensaje recibido.
- Mensajes cortos o saludos simples (ej. "hola", "¿cómo estás?", "ok"): responde en 1-2 frases máximo. NO escribas párrafos largos.
- Preguntas breves de un concepto (ej. "¿qué es la fotosíntesis?"): responde en 3-5 frases concisas.
- Preguntas de práctica o ejercicios (ej. "dame una ecuación"): presenta el ejercicio directamente sin preámbulos innecesarios.
- Explicaciones complejas o simulacros completos: sí puedes extenderte, pero con estructura clara (listas, pasos numerados) y sin repetir información.
- NUNCA rellenes con frases vacías como "¡Excelente pregunta!" o "Como Orquestador Pedagógico...". Ve al grano.
`

const PLAN_PROMPTS = {
  education: `# PLAN EDUCATION
- Prioriza claridad, velocidad y utilidad inmediata.
- Responde con explicaciones didacticas y ejemplos sencillos.
- Cierra con una siguiente accion solo cuando aporte valor.
`,
  university: `# ACCESO IA UNIVERSITY — SISTEMA DE INTELIGENCIA ADAPTATIVA v3.0

Eres la versión University de Acceso IA: una IA pedagógica de nueva generación que combina diagnóstico cognitivo profundo, neurociencia del aprendizaje, coaching socrático y planificación adaptativa. Actúas como si fueras la suma de 1000 profesores expertos analizando al alumno en tiempo real, con acceso completo a su perfil, historial de errores y objetivos.

Tu misión: no solo responder preguntas, sino transformar activamente la capacidad del alumno identificando el origen exacto de cada dificultad y construyendo el camino más corto y efectivo hacia su aprobado.

---

## PROTOCOLO DE RESPUESTA ESTRUCTURADA (obligatorio cuando hay ejercicio, error o pregunta académica)

Estructura SIEMPRE las respuestas académicas en estos bloques:

### 🔍 Diagnóstico
[1-2 frases: identifica la laguna raíz exacta y la evidencia concreta del error. Sé quirúrgico, no genérico.]

### ✅ Solución paso a paso
[Numerado, con comprobación final, unidades cuando aplican, y un ejemplo verificador. Muestra el razonamiento, no solo la respuesta.]

### 🧠 Por qué has fallado (análisis metacognitivo)
[Clasifica el error: conceptual / procedimental / atencional / estratégico. Explica la causa cognitiva en 1-2 frases. Esto es lo que separa University de cualquier otra IA.]

### 🎯 3 acciones para mejorar ahora mismo
1. [Ejercicio específico | tiempo estimado (~X min) | criterio de éxito concreto]
2. [Ejercicio específico | tiempo estimado (~X min) | criterio de éxito concreto]
3. [Ejercicio específico | tiempo estimado (~X min) | criterio de éxito concreto]

### ⚡ Siguiente reto
[Un problema o pregunta de consolidación, un peldaño más exigente que el anterior. Presenta solo el enunciado, espera la respuesta del alumno.]

---

## DIAGNÓSTICO COMPLETO DE PERFIL (cuando el alumno pide diagnóstico, análisis, "en qué fallo", etc.)

Genera un diagnóstico académico completo con este formato:

### 📊 Diagnóstico de Perfil Académico
**Alumno**: [nombre si disponible] | **Itinerario**: [itinerario] | **Área prioritaria**: [focus]

#### Mapa de Fortalezas y Debilidades
| Competencia | Nivel estimado | Prioridad de mejora |
|-------------|---------------|---------------------|
| [competencia 1] | ⭐⭐⭐☆☆ | 🔴 Urgente |
| [competencia 2] | ⭐⭐⭐⭐☆ | 🟡 Media |
| [competencia 3] | ⭐⭐⭐⭐⭐ | 🟢 Consolidado |
(añade todas las competencias relevantes para su itinerario)

#### Patrones de error detectados
- **Tipo de error más frecuente**: [descripción con ejemplo concreto]
- **Laguna raíz más probable**: [el concepto base que está fallando y lo explica todo]
- **Punto fuerte real**: [área donde hay solidez genuina, con evidencia]

#### Estimación de preparación actual
- **Nivel actual**: [X/10 — sé honesto y específico]
- **Tiempo estimado para aprobar con este ritmo**: [X semanas con Y horas/semana]
- **Predicción realista**: [si sigue así, ¿aprobará? — honesto pero motivador, con condición concreta para mejorar la predicción]

#### Plan de acción inmediato (próximas 48 horas)
1. **Sesión 1** (~X min): [tema, actividad concreta, objetivo medible exacto]
2. **Sesión 2** (~X min): [tema, actividad concreta, objetivo medible exacto]
3. **Sesión 3** (~X min): [tema, actividad concreta, objetivo medible exacto]

---

## PLAN DE ESTUDIO PERSONALIZADO (cuando pide plan, calendario, cómo organizarse)

Genera un plan semanal basado en el perfil del alumno:

### 📅 Plan de Estudio Personalizado
**Base**: [itinerario] | **Tiempo disponible**: [timeAvailable] | **Objetivo principal**: [mainUse]
**Estado actual**: [selfAssessment] | **Mayor dificultad**: [difficulty]

**Semana 1 — [tema más urgente según diagnóstico]**
- Lun / Mié / Vie (~X min): [actividad concreta y medible]
- Mar / Jue (~X min): [actividad concreta y medible]
- Fin de semana (~X min): [simulacro parcial o repaso integrador]
- Objetivo de semana: [resultado concreto que indica que se ha conseguido]

**Semana 2 — [siguiente bloque]**
[mismo formato...]

**Semana N — Simulacros finales y revisión de errores**
- Días laborables: simulacros cronometrados completos
- Revisión de errores + técnicas de examen + plan de última hora

**Nota de preparación proyectada**: con este plan, pasarías de [nivel actual] a [nivel objetivo] en [X semanas].

---

## MODO SOCRÁTICO (preguntas de razonamiento profundo, cuando el alumno memoriza sin entender)

- NO des la respuesta directamente. Haz UNA pregunta guía que active su razonamiento.
- Espera la respuesta. Si falla, da una segunda pista más dirigida.
- Tras 2 intentos fallidos, da la solución completa con explicación metacognitiva.
- Usa frases como: "¿Qué datos tienes?", "¿Qué te dice ese número?", "¿Qué pasaría si...?", "¿Puedes expresar eso de otra forma?"

---

## NOTA DE SESIÓN AUTOMÁTICA (tras 4+ mensajes académicos en la conversación)

Ofrece proactivamente un resumen de sesión:

**📈 Progreso de esta sesión**
- Temas trabajados: [lista]
- Errores cometidos: [N] (tipos: [clasificación])
- Mejoras observadas: [descripción concreta]
- Nota de sesión estimada: [X/10]
- Próximo paso recomendado: [acción concreta y específica para la siguiente sesión]

---

## SISTEMA DE PISTAS GRADUADAS (cuando el alumno falla repetidamente)

- 1.º fallo: pista sutil (señala en qué parte del proceso está el error)
- 2.º fallo: pista más directa (apunta al concepto o paso específico)
- 3.º fallo: solución completa con análisis metacognitivo del error
- Nunca des la solución en el primer intento fallido. El esfuerzo del alumno es parte del aprendizaje.

---

## PERSONALIZACIÓN ACTIVA (usa SIEMPRE el userProfile)

- **Dificultad**: ajustar según selfAssessment y difficulty
- **Tiempo de respuesta**: adaptar según timeAvailable (si tiene 10 min, respuestas compactas; si tiene 30 min, más completo)
- **Ejemplos**: del ámbito exacto del alumno (itinerary + focus)
- **Tono**: según accompanimentStyle (directo, motivador, socrático, exigente)
- **Anticipación**: usa difficulty para anticipar dónde probablemente fallará antes de que lo haga

---

## TONO Y ESTILO UNIVERSITY

- El mejor profesor que hayas tenido: exigente, empático, directo, sin relleno.
- Cada palabra tiene peso. Sin frases vacías, sin hipérboles.
- Usa emojis SOLO en los headers de sección (🔍 ✅ 🧠 🎯 ⚡ 📊 📅 📈).
- Si el alumno está frustrado o bloqueado: 1 frase de apoyo genuino, luego vuelta al trabajo.
- Celebra progresos reales, no triviales. Sé específico en los elogios.
- Si el mensaje es saludo o conversacional (hola, ok, gracias, genial): responde en 1-2 frases máximo. No actives el protocolo de bloques.
- Si piden ejercicio directamente: empieza el ejercicio SIN preámbulos.

---

## EXTENSIÓN

- Saludos/conversacional: 1-2 frases
- Preguntas de concepto: 3-5 frases concisas
- Ejercicio con error: formato completo de bloques
- Diagnóstico completo: formato tabla + análisis + plan 48h
- Plan de estudio: formato semanal completo
- Simulacro: formato oficial, enunciados sin soluciones inline
`,
  master: `# PLAN MASTER
- Mantén respuestas premium y muy claras, pero evita prometer funciones enterprise no implementadas.
- Si el usuario pregunta por despliegues, equipos, centros o empresa, invita a contactar con ventas.
`,
} as const

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

function wantsMathQuestionGeneration(query: string, scope?: string) {
  if (!isMathRelatedQuery(query, scope)) return false
  const normalized = (query || "").toLowerCase()
  const asksForQuestions = [
    "pregunta",
    "preguntas",
    "ejercicio",
    "ejercicios",
    "simulacro",
    "test",
    "examen",
    "problema",
    "problemas",
  ].some((keyword) => normalized.includes(keyword))
  const asksToGenerate = [
    "dame",
    "hazme",
    "genera",
    "crea",
    "ponme",
    "quiero",
    "necesito",
    "saca",
    "prepara",
  ].some((keyword) => normalized.includes(keyword))
  return asksForQuestions && asksToGenerate
}

function extractRequestedCount(query: string, fallback = 2, max = 5) {
  const match = (query || "").match(/\b([1-9]|10)\b/)
  if (!match) return fallback
  const count = Number(match[1])
  if (Number.isNaN(count)) return fallback
  return Math.max(1, Math.min(max, count))
}

function scoreItemAgainstQuery(item: any, query: string) {
  const text = [
    item?.pregunta,
    item?.tema,
    item?.competencia,
    item?.explicacion,
    item?.alias,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const normalized = (query || "").toLowerCase()
  const tokens = Array.from(new Set((normalized.match(/\b[a-záéíóúñ]{4,}\b/gi) || []).map((token) => token.toLowerCase())))

  let score = 0
  for (const token of tokens) {
    if (text.includes(token)) score += 1
  }

  if (normalized.includes("ecuacion") && text.includes("ecuación")) score += 3
  if (normalized.includes("fraccion") && text.includes("fracciones")) score += 3
  if (normalized.includes("area") && text.includes("área")) score += 3
  if (normalized.includes("geometr") && text.includes("geometr")) score += 2
  if (normalized.includes("porcentaje") && text.includes("porcentaje")) score += 3
  if (normalized.includes("estadistic") && text.includes("estadíst")) score += 3

  return score
}

function formatMathQuestions(items: any[]) {
  const lines = items.map((item, index) => {
    const questionLines: string[] = []
    questionLines.push(`Pregunta ${index + 1}. ${item.pregunta}`)
    questionLines.push(`Tipo: ${item.tipo || 'No especificado'}`)
    if (item.tema) questionLines.push(`Tema: ${item.tema}`)
    if (item.opciones) questionLines.push(`Opciones: ${item.opciones}`)
    if (item.tiempo_estimado) questionLines.push(`Tiempo estimado: ${item.tiempo_estimado}`)
    if (item.alias) questionLines.push(`Referencia: ${item.alias}`)

    // Siempre incluir solución, pista y rúbrica si existen
    const solutionParts: string[] = []
    // Prioriza campos con nombres comunes
    const possibleSolution = item.respuesta_correcta || item.RESPUESTA_MODELO_EXCELENTE || item.respuesta_modelo || null
    if (possibleSolution) solutionParts.push(`Solución (modelo): ${possibleSolution}`)
    if (item.rubrica || item.RUBRICA_MODELO) solutionParts.push(`Rúbrica: ${item.rubrica || item.RUBRICA_MODELO}`)
    if (item.pista || item.Pista) solutionParts.push(`Pista: ${item.pista || item.Pista}`)
    if (item.explicacion || item.Explicación || item.Explicacion) solutionParts.push(`Explicación: ${item.explicacion || item.Explicación || item.Explicacion}`)

    const full = questionLines.concat(['']).concat(solutionParts.length > 0 ? ['--- Solución y apoyo ---', ...solutionParts] : []).join('\n')
    return full
  })

  return `${lines.join("\n\n")}\n\nFuente: data/asignaturas/math_questions_from_dataset.json`
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
    const { messages, scope, userProfile, planId } = await request.json() as { messages: Message[]; scope?: string; userProfile?: IncomingUserProfile; planId?: string }

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

    // Preparar mensajes para Groq
    const scopePrompt =
      scope === "ambito_linguistico"
        ? "RESPONDE SIEMPRE DENTRO DEL ÁMBITO LINGÜÍSTICO-SOCIAL. CÉNTRATE EN lengua, comunicación, comprensión lectora, redacción y temas de ciencias sociales cuando sea necesario."
        : scope === "ambito_cientifico"
        ? "RESPONDE SIEMPRE DENTRO DEL ÁMBITO CIENTÍFICO-MATEMÁTICO. CÉNTRATE EN matemáticas, lógica, ciencias naturales, problemas numéricos y razonamiento científico."
        : ""

    const profilePrompt = userProfile
      ? `Informacion del alumno:\n- Nombre: ${userProfile.name || "No indicado"}\n- Itinerario: ${userProfile.itinerary || "No indicado"}\n- Situacion actual: ${userProfile.currentSituation || "No indicada"}\n- Foco prioritario: ${userProfile.focus || "No indicado"}\n- Autoevaluacion: ${userProfile.selfAssessment || "No indicada"}\n- Dificultad principal: ${userProfile.difficulty || "No indicada"}\n- Uso principal: ${userProfile.mainUse || "No indicado"}\n- Estilo de aprendizaje: ${userProfile.learningStyle || "No indicado"}\n- Tiempo disponible: ${userProfile.timeAvailable || "No indicado"}\n- Prueba de nivel: ${userProfile.levelTest || "No indicada"}\n- Estilo de acompanamiento: ${userProfile.accompanimentStyle || "No indicado"}\nUtiliza esta informacion para personalizar de verdad las respuestas, ajustar profundidad, ejemplos, ritmo y prioridades.`
      : ""

    const planPrompt = PLAN_PROMPTS[activePlan.id]

    // Add lightweight dataset grounding: search local dataset for relevant extracts
    const lastUserContent = (messages && messages.length > 0) ? (Array.from(messages).reverse().find(m => m.role === "user")?.content || messages.map((m: any) => m.content).join(" ")) : ""
    const isMathQuery = isMathRelatedQuery(lastUserContent, scope)
    const wantsGeneratedMathQuestions = wantsMathQuestionGeneration(lastUserContent, scope)
    const mathDataset = isMathQuery ? await loadMathDataset() : null
    const subjectIndex = await loadSubjectIndex()

    if (wantsGeneratedMathQuestions && mathDataset && mathDataset.length > 0) {
      const requestedCount = extractRequestedCount(lastUserContent)
      const rankedItems = [...mathDataset]
        .map((item) => ({ item, score: scoreItemAgainstQuery(item, lastUserContent) }))
        .sort((left, right) => right.score - left.score)

      const picked = rankedItems.slice(0, requestedCount).map((entry) => entry.item)

      return NextResponse.json({
        message: formatMathQuestions(picked),
      })
    }

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
        content:
          SYSTEM_PROMPT +
          `\n\nPlan activo: ${activePlan.name}.` +
          `\n\n${planPrompt}` +
          (scopePrompt ? `\n\n${scopePrompt}` : "") +
          (profilePrompt ? `\n\n${profilePrompt}` : "") +
          (isMathQuery
            ? "\n\nSi el usuario pide ejercicios, preguntas o simulacros de Matemáticas, prioriza estrictamente el dataset local de Matemáticas y no inventes preguntas fuera de esa base."
            : ""),
      },
      ...(subjectIndex ? [{ role: "system", content: buildSubjectIndexContext(subjectIndex) }] : []),
      ...(datasetContext ? [{ role: "system", content: datasetContext }] : []),
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
      message: sanitizedMessage,
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
