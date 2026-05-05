import type { PracticeExamPack, PracticeExamQuestion } from "@/lib/practice-exam-generator"

const SUBJECT_LABELS: Record<PracticeExamQuestion["subject"], string> = {
  lengua: "Lengua y Literatura",
  ingles: "Ingles",
  sociales: "Ciencias Sociales",
  matematicas: "Matematicas",
  naturales: "Ciencias Naturales",
  tic: "TIC",
}

function buildFileName(pack: PracticeExamPack) {
  const subject = pack.subjectLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return `agoraedu-practica-${subject}-${pack.seed}.pdf`
}

export async function downloadPracticeExamPdf(pack: PracticeExamPack) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const margin = 44
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addPageHeader = () => {
    const pageNumber = doc.getNumberOfPages()
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(`AgoraEdu - Examen de práctica acceso a Grado Medio`, margin, 28)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, 28, { align: "right" })
    y = margin
  }

  addPageHeader()

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - margin) {
      return
    }
    doc.addPage()
    addPageHeader()
  }

  const addWrappedText = (text: string, fontSize = 12, lineHeight = 16, extraGap = 8, indent = 0) => {
    doc.setFontSize(fontSize)
    const lines = doc.splitTextToSize(text, contentWidth - indent)
    ensureSpace(lines.length * lineHeight + extraGap)
    doc.text(lines, margin + indent, y)
    y += lines.length * lineHeight + extraGap
  }

  const estimateBlockHeight = (question: PracticeExamQuestion, includeAnswers: boolean) => {
    const promptLines = doc.splitTextToSize(`${question.prompt}`, contentWidth).length
    const optionLines = question.options.reduce((sum, option) => sum + doc.splitTextToSize(option.text, contentWidth - 18).length, 0)
    const writingLines = question.type === "redaccion" ? 10 : 0
    const explanationLines = includeAnswers ? doc.splitTextToSize(question.explanation, contentWidth - 14).length : 0
    return (
      promptLines * 16 +
      optionLines * 14 +
      writingLines * 18 +
      36 +
      (includeAnswers ? 20 + explanationLines * 14 + 10 : 0)
    )
  }

  const addQuestionBlock = (question: PracticeExamQuestion, index: number, includeAnswers: boolean) => {
    const blockHeight = estimateBlockHeight(question, includeAnswers)
    ensureSpace(blockHeight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    addWrappedText(`${index + 1}. [${SUBJECT_LABELS[question.subject]}] ${question.prompt}`, 13, 18, 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)

    if (question.type === "multiple-choice") {
      question.options.forEach((option, optionIndex) => {
        const optionLabel = String.fromCharCode(65 + optionIndex)
        addWrappedText(`${optionLabel}. ${option.text}`, 11, 16, 6, 14)
      })
    } else {
      addWrappedText("Escribe tu redaccion en el espacio siguiente:", 11, 16, 10, 14)
      for (let i = 0; i < 8; i += 1) {
        ensureSpace(18)
        doc.text("______________________________________________________________", margin + 14, y)
        y += 18
      }
    }

    doc.setFontSize(10)
    doc.setTextColor(90, 90, 90)
    addWrappedText(`Tema: ${question.topic}`, 10, 14, 10, 14)
    doc.setTextColor(0, 0, 0)

    if (includeAnswers) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      addWrappedText(question.type === "multiple-choice" ? "Respuesta correcta:" : "Respuesta sugerida:", 11, 16, 4, 14)
      doc.setFont("helvetica", "normal")
      addWrappedText(question.answerText, 11, 16, 8, 30)
      addWrappedText(`Explicacion: ${question.explanation}`, 10, 14, 12, 14)
    }
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("AgoraEdu - Examen de práctica acceso a Grado Medio", margin, y)
  y += 36

  doc.setFont("helvetica", "normal")
  addWrappedText("Asignaturas: Lengua y Literatura, Inglés, Ciencias Sociales, Matemáticas, Ciencias Naturales y TIC.", 11, 18, 16)
  addWrappedText(`Modalidad: ${pack.subjectLabel} | Dificultad: ${pack.difficulty} | Preguntas: ${pack.questions.length}`, 11, 16, 18)
  addWrappedText("Documento generado automáticamente para práctica de acceso. Incluye examen y solucionario al final.", 11, 16, 20)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("Nombre: ________________________________   Fecha: ____________________", margin, y)
  y += 28

  if (pack.passage) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(pack.passage.title, margin, y)
    y += 18
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    if (pack.passage.source || pack.passage.date) {
      const sourceParts = []
      if (pack.passage.source) sourceParts.push(`Fuente: ${pack.passage.source}`)
      if (pack.passage.date) sourceParts.push(`Fecha: ${pack.passage.date}`)
      addWrappedText(sourceParts.join(" | "), 10, 14, 14)
    }
    addWrappedText("Lee atentamente el siguiente texto. Todas las preguntas de Lengua se basan en este pasaje.", 11, 16, 14)
    addWrappedText(pack.passage.text, 11, 16, 18)
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("Examen", margin, y)
  y += 22

  doc.setFont("helvetica", "normal")
  addWrappedText("Instrucciones: responde primero sin mirar el solucionario. Al final del PDF tienes las respuestas correctas y una breve explicacion para cada pregunta.", 11, 15, 10)

  pack.questions.forEach((question, index) => {
    addQuestionBlock(question, index, false)
  })

  doc.addPage()
  y = margin
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Solucionario y explicaciones", margin, y)
  y += 28
  doc.setFont("helvetica", "normal")
  addWrappedText("Utiliza este bloque para corregirte y detectar patrones de error antes de generar otro examen.", 11, 15, 12)

  pack.questions.forEach((question, index) => {
    addQuestionBlock(question, index, true)
  })

  doc.save(buildFileName(pack))
}