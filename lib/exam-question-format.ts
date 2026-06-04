export interface ExamQuestionItem {
  pregunta: string
  titulo?: string
  tipo?: string
  tema?: string
  opciones?: string
  tiempo_estimado?: string
  alias?: string
  sourceId?: string
  texto_referencia?: string
  respuesta_correcta?: string
  rubrica?: string
  pista?: string
  explicacion?: string
}

export function parseOptions(opciones?: string | null): string[] {
  if (!opciones) return []
  const trimmed = opciones.trim()
  if (!trimmed) return []

  if (trimmed.includes("|")) {
    return trimmed.split(/\s*\|\s*/).map((o) => o.trim()).filter(Boolean)
  }

  const letterParts = trimmed.split(/\s(?=[A-F]\)\s)/i).map((o) => o.trim()).filter(Boolean)
  if (letterParts.length >= 2) return letterParts

  return [trimmed]
}

export function normalizeExamQuestionItem(item: Record<string, unknown>): ExamQuestionItem {
  return {
    pregunta: String(item.pregunta || item.Pregunta || item.question || "Sin enunciado"),
    tipo: item.tipo ? String(item.tipo) : undefined,
    tema: item.tema ? String(item.tema) : undefined,
    opciones: item.opciones ? String(item.opciones) : undefined,
    tiempo_estimado: item.tiempo_estimado ? String(item.tiempo_estimado) : undefined,
    alias: item.alias ? String(item.alias) : undefined,
    respuesta_correcta: item.respuesta_correcta
      ? String(item.respuesta_correcta)
      : item.RESPUESTA_MODELO_EXCELENTE
        ? String(item.RESPUESTA_MODELO_EXCELENTE)
        : item.respuesta_modelo
          ? String(item.respuesta_modelo)
          : undefined,
    rubrica: item.rubrica
      ? String(item.rubrica)
      : item.RUBRICA_MODELO
        ? String(item.RUBRICA_MODELO)
        : undefined,
    pista: item.pista
      ? String(item.pista)
      : item.Pista
        ? String(item.Pista)
        : undefined,
    explicacion: item.explicacion
      ? String(item.explicacion)
      : item.Explicación
        ? String(item.Explicación)
        : item.Explicacion
          ? String(item.Explicacion)
          : undefined,
  }
}

export function formatExamQuestionsText(items: ExamQuestionItem[]): string {
  return items
    .map((item, index) => {
      const lines = [`Pregunta ${index + 1}. ${item.titulo || item.pregunta}`]
      if (item.titulo && item.titulo !== item.pregunta) {
        lines.push(`Enunciado: ${item.pregunta}`)
      }
      if (item.tipo) lines.push(`Tipo: ${item.tipo}`)
      if (item.tema) lines.push(`Tema: ${item.tema}`)
      if (item.opciones) lines.push(`Opciones: ${item.opciones}`)
      if (item.alias) lines.push(`Referencia: ${item.alias}`)

      const support: string[] = []
      if (item.respuesta_correcta) support.push(`Solución (modelo): ${item.respuesta_correcta}`)
      if (item.rubrica) support.push(`Rúbrica: ${item.rubrica}`)
      if (item.pista) support.push(`Pista: ${item.pista}`)
      if (item.explicacion) support.push(`Explicación: ${item.explicacion}`)

      if (support.length > 0) {
        lines.push("", "--- Solución y apoyo ---", ...support)
      }

      return lines.join("\n")
    })
    .join("\n\n")
}

/** @deprecated Use formatExamQuestionsText */
export const formatMathQuestionsText = formatExamQuestionsText

const FIELD_PATTERNS: Array<{ key: keyof ExamQuestionItem; regex: RegExp }> = [
  { key: "tipo", regex: /Tipo:\s*([^|\n]+?)(?=\s*(?:Tema:|Enunciado:|Opciones:|Tiempo estimado:|Referencia:|---|$))/i },
  { key: "tema", regex: /Tema:\s*([^|\n]+?)(?=\s*(?:Enunciado:|Opciones:|Tiempo estimado:|Referencia:|---|$))/i },
  { key: "pregunta", regex: /Enunciado:\s*([\s\S]+?)(?=\s*(?:Opciones:|Tiempo estimado:|Referencia:|---|$))/i },
  { key: "opciones", regex: /Opciones:\s*(.+?)(?=\s*(?:Tiempo estimado:|Referencia:|---|$))/i },
  { key: "tiempo_estimado", regex: /Tiempo estimado:\s*([^|\n]+?)(?=\s*(?:Referencia:|---|$))/i },
  { key: "alias", regex: /Referencia:\s*(.+?)(?=\s*(?:Pregunta\s+\d+[\.\:]|---|$))/i },
  { key: "respuesta_correcta", regex: /Solución \(modelo\):\s*(.+?)(?=\s*(?:Rúbrica:|Pista:|Explicación:|$))/i },
  { key: "rubrica", regex: /Rúbrica:\s*(.+?)(?=\s*(?:Pista:|Explicación:|$))/i },
  { key: "pista", regex: /Pista:\s*(.+?)(?=\s*(?:Explicación:|$))/i },
  { key: "explicacion", regex: /Explicación:\s*(.+?)$/i },
]

function extractFields(block: string): Partial<ExamQuestionItem> {
  const fields: Partial<ExamQuestionItem> = {}
  for (const { key, regex } of FIELD_PATTERNS) {
    const match = block.match(regex)
    if (match?.[1]) fields[key] = match[1].trim()
  }
  return fields
}

export function parseExamQuestionsFromText(content: string): ExamQuestionItem[] | null {
  if (!/Pregunta\s+\d+[\.\:]/i.test(content)) return null

  const sourceMatch = content.match(/(?:\n|^)Fuente:\s*(.+?)$/im)
  const body = sourceMatch ? content.slice(0, sourceMatch.index).trim() : content.trim()

  const blocks = body.split(/(?=Pregunta\s+\d+[\.\:])/i).filter(Boolean)
  if (blocks.length === 0) return null

  const questions = blocks.map((block) => {
    const headerMatch = block.match(/^Pregunta\s+(\d+)\.\s*([\s\S]+?)(?=\s*(?:Tipo:|Tema:|Enunciado:|Opciones:|Tiempo estimado:|Referencia:|---|$))/i)
    const titulo = headerMatch?.[2]?.trim() || ""
    const fields = extractFields(block)
    const supportBlock = block.includes("--- Solución y apoyo ---")
      ? block.split("--- Solución y apoyo ---")[1] || ""
      : ""

    const enunciado = fields.pregunta || titulo

    return {
      titulo: fields.pregunta ? titulo : undefined,
      pregunta: enunciado,
      ...fields,
      ...extractFields(supportBlock),
    } satisfies ExamQuestionItem
  })

  return questions.length > 0 ? questions : null
}

export function isExamQuestionMessage(content: string, examQuestions?: ExamQuestionItem[]): boolean {
  if (examQuestions && examQuestions.length > 0) return true
  const parsed = parseExamQuestionsFromText(content)
  return parsed !== null && parsed.length > 0
}

export function attachExamQuestionsFromText(message: string): {
  message: string
  examQuestions?: ExamQuestionItem[]
  source?: string
} {
  const parsed = parseExamQuestionsFromText(message)
  if (!parsed || parsed.length === 0) return { message }

  const sourceMatch = message.match(/(?:\n|^)Fuente:\s*(.+?)$/im)
  return {
    message,
    examQuestions: parsed,
    source: sourceMatch?.[1]?.trim(),
  }
}
