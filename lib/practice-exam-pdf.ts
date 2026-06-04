import type { PracticeExamPack, PracticeExamQuestion } from "@/lib/practice-exam-generator"

const SUBJECT_LABELS: Record<PracticeExamQuestion["subject"], string> = {
  lengua: "Lengua y Literatura",
  ingles: "Ingles",
  sociales: "Ciencias Sociales",
  matematicas: "Matematicas",
  naturales: "Ciencias Naturales",
  tic: "TIC",
}

const SUBJECT_ORDER: PracticeExamQuestion["subject"][] = [
  "lengua",
  "ingles",
  "sociales",
  "matematicas",
  "naturales",
  "tic",
]

type QuestionTopicGroup = {
  topic: string
  questions: Array<{
    question: PracticeExamQuestion
    originalIndex: number
  }>
}

type QuestionSubjectGroup = {
  subject: PracticeExamQuestion["subject"]
  label: string
  topics: QuestionTopicGroup[]
}

function normalizeTopicLabel(topic: string) {
  const cleanTopic = (topic || "").trim()
  return cleanTopic.length > 0 ? cleanTopic : "Tema general"
}

function buildQuestionGroups(pack: PracticeExamPack): QuestionSubjectGroup[] {
  const indexedQuestions = pack.questions.map((question, originalIndex) => ({ question, originalIndex }))

  return SUBJECT_ORDER
    .map((subject) => {
      const subjectQuestions = indexedQuestions.filter((entry) => entry.question.subject === subject)
      if (subjectQuestions.length === 0) return null

      const topicMap = new Map<string, QuestionTopicGroup>()
      for (const entry of subjectQuestions) {
        const topic = normalizeTopicLabel(entry.question.topic)
        if (!topicMap.has(topic)) {
          topicMap.set(topic, { topic, questions: [] })
        }
        topicMap.get(topic)?.questions.push(entry)
      }

      return {
        subject,
        label: SUBJECT_LABELS[subject],
        topics: [...topicMap.values()],
      }
    })
    .filter((group): group is QuestionSubjectGroup => group !== null)
}

function buildFileName(pack: PracticeExamPack) {
  const subject = pack.subjectLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return `agoraedu-practica-${subject}-${pack.seed}.pdf`
}

export async function downloadPracticeExamPdf(pack: PracticeExamPack) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const margin = 64
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - margin * 2
  const groupedQuestions = buildQuestionGroups(pack)
  const subjectSummary = groupedQuestions.map((group) => group.label).join(", ")
  let y = margin

  // Load AgoraEdu logo for embedding in the PDF
  let logoDataUrl: string | null = null
  try {
    const logoResponse = await fetch("/images/logo.png")
    const logoBlob = await logoResponse.blob()
    logoDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(logoBlob)
    })
  } catch {
    logoDataUrl = null
  }

  // Pre-compute logo dimensions (maintain aspect ratio)
  let logoHeaderW = 0, logoHeaderH = 0, logoCoverW = 0, logoCoverH = 0
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl)
      // Header: fixed height 22pt, width proportional
      logoHeaderH = 22
      logoHeaderW = Math.round((props.width * logoHeaderH) / props.height)
      // Cover: fixed width 180pt, height proportional
      logoCoverW = 180
      logoCoverH = Math.round((props.height * logoCoverW) / props.width)
    } catch {
      logoDataUrl = null
    }
  }

  const addPageHeader = () => {
    const pageNumber = doc.getNumberOfPages()
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 10, logoHeaderW, logoHeaderH)
    } else {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("AgoraEdu - Examen de práctica acceso a Grado Medio", margin, 28)
    }
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    doc.text(`Página ${pageNumber}`, pageWidth - margin, 26, { align: "right" })
    doc.setTextColor(0, 0, 0)
    // Thin separator line below header
    doc.setDrawColor(210, 210, 210)
    doc.setLineWidth(0.5)
    doc.line(margin, 38, pageWidth - margin, 38)
    doc.setDrawColor(0, 0, 0)
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

  const addSectionHeading = (title: string, subtitle?: string, startOnNewPage: boolean = false) => {
    if (startOnNewPage) {
      doc.addPage()
      addPageHeader()
    } else {
      ensureSpace(subtitle ? 52 : 34)
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text(title, margin, y)
    y += 20

    if (subtitle) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(90, 90, 90)
      addWrappedText(subtitle, 10, 14, 10)
      doc.setTextColor(0, 0, 0)
    } else {
      y += 8
    }
  }

  const addTopicHeading = (topic: string) => {
    ensureSpace(30)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(`Tema: ${topic}`, margin, y)
    y += 18
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

  const addQuestionBlock = (question: PracticeExamQuestion, questionNumber: number, includeAnswers: boolean) => {
    const blockHeight = estimateBlockHeight(question, includeAnswers)
    ensureSpace(blockHeight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    addWrappedText(`${questionNumber}. ${question.prompt}`, 13, 18, 12)

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
    if (includeAnswers) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      addWrappedText(question.type === "multiple-choice" ? "Respuesta correcta:" : "Respuesta sugerida:", 11, 16, 4, 14)
      doc.setFont("helvetica", "normal")
      addWrappedText(question.answerText, 11, 16, 8, 30)
      addWrappedText(`Explicacion: ${question.explanation}`, 10, 14, 12, 14)
    }
  }

  // Cover: prominent logo centered above the main title
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", (pageWidth - logoCoverW) / 2, y, logoCoverW, logoCoverH)
    y += logoCoverH + 18
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.text("AgoraEdu - Examen de práctica acceso a Grado Medio", margin, y)
  y += 36

  doc.setFont("helvetica", "normal")
  addWrappedText(`Asignaturas: ${subjectSummary || "Sin asignaturas disponibles"}.`, 11, 18, 16)
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

  let questionNumber = 1
  groupedQuestions.forEach((subjectGroup, subjectIndex) => {
    addSectionHeading(subjectGroup.label, `${subjectGroup.topics.length} tema(s) en este bloque.`, false)
    subjectGroup.topics.forEach((topicGroup) => {
      addTopicHeading(topicGroup.topic)
      topicGroup.questions.forEach(({ question }) => {
        addQuestionBlock(question, questionNumber, false)
        questionNumber += 1
      })
    })
    if (subjectIndex < groupedQuestions.length - 1) {
      ensureSpace(12)
      y += 6
    }
  })

  doc.addPage()
  y = margin
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Solucionario y explicaciones", margin, y)
  y += 28
  doc.setFont("helvetica", "normal")
  addWrappedText("Utiliza este bloque para corregirte y detectar patrones de error antes de generar otro examen.", 11, 15, 12)

  questionNumber = 1
  groupedQuestions.forEach((subjectGroup, subjectIndex) => {
    addSectionHeading(subjectGroup.label, `Soluciones organizadas por tema.`, subjectIndex > 0)
    subjectGroup.topics.forEach((topicGroup) => {
      addTopicHeading(topicGroup.topic)
      topicGroup.questions.forEach(({ question }) => {
        addQuestionBlock(question, questionNumber, true)
        questionNumber += 1
      })
    })
  })

  doc.save(buildFileName(pack))
}