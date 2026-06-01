"use client"

import { useState, useEffect } from "react"
import { motion as motionBase, AnimatePresence } from "framer-motion"
import {
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  TrendingUp, 
  BookOpen,
  Loader2,
  RotateCcw,
  ChevronRight,
  Award,
  GraduationCap,
  Lightbulb,
  FileDown,
  SlidersHorizontal,
} from "lucide-react"
import { cn, clampRedactionText, getWordCount, getLineCount, MAX_REDACTION_LINES, MAX_REDACTION_WORDS, formatExamSource } from "@/lib/utils"
import { CableMatch, isMatchingQuestion, extractMatchPairsFromOptions } from "./cable-match"
import { PdfReferenceImage } from "./pdf-reference-image"
import { downloadPracticeExamPdf } from "@/lib/practice-exam-pdf"
import { getPreferredDifficulty, type FpLevel } from "@/lib/fp-level"

const motion = motionBase as any

interface ExamQuestion {
  _id: string
  question: string
  subject: string
  topic?: string
  difficulty: string
  options?: Array<{
    text: string
    isCorrect: boolean
  }>
  explanation?: string
  source?: {
    name: string
    year: number
    region: string
    url?: string
  }
  textReference?: string
  reqImages?: string[]
}

interface UserAnswer {
  questionId: string
  selectedOption?: number | string
  isCorrect?: boolean
  timeSpent: number
}

interface ExamModeProps {
  sessionId: string
  fpLevel?: FpLevel
}

type ExamState = "setup" | "taking" | "results"

const SUBJECT_OPTIONS = [
  { value: "lengua",      label: "Lengua y Literatura",            emoji: "📝", color: "from-indigo-500 to-purple-500" },
  { value: "ingles",     label: "Inglés",                         emoji: "🌍", color: "from-emerald-500 to-green-600" },
  { value: "sociales",   label: "Geografía e Historia",           emoji: "🏛️", color: "from-yellow-500 to-orange-500" },
  { value: "matematicas",label: "Matemáticas",                    emoji: "🔢", color: "from-blue-600 to-indigo-600" },
  { value: "ciencias",   label: "Ciencias Naturales",             emoji: "🔬", color: "from-teal-500 to-cyan-500" },
  { value: "tic",        label: "TIC",                            emoji: "💻", color: "from-green-400 to-teal-500" },
]

const DEFAULT_DATASET_FILE = "W5_dataset_ACCESO_IA_examenes_2017_2025_v3_GOLD_INFRA_READY.json"
const QUESTIONS_PER_SUBJECT = 5

export function ExamMode({ sessionId, fpLevel = "gm" }: ExamModeProps) {
  const [examState, setExamState] = useState<ExamState>("setup")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedCustomSubjects, setSelectedCustomSubjects] = useState<string[]>(SUBJECT_OPTIONS.map((subject) => subject.value))
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const GM_PDFS: Record<string, string> = {
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

  const resolveImage = (img: string):
    | { type: 'image'; url: string }
    | { type: 'pdf-proxy'; url: string; label: string }
    | { type: 'text'; value: string } => {
    if (/^https?:\/\//.test(img) && /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?.*)?$/i.test(img)) {
      return { type: 'image', url: img }
    }
    const yearMatch = img.match(/GM_(\d{4})/)
    if (img.includes('GM_')) {
      const year = yearMatch?.[1]
      const sourceUrl = year && GM_PDFS[year] ? GM_PDFS[year] : null
      const proxyUrl = sourceUrl ? `/api/pdf-proxy?url=${encodeURIComponent(sourceUrl)}` : `/api/pdf-proxy?url=${encodeURIComponent(`https://ceice.gva.es/documents/388109149/391038839/GM_${year}.pdf`)}`
      return {
        type: 'pdf-proxy',
        url: proxyUrl,
        label: year ? `Mostrar examen oficial GM ${year}` : 'Mostrar examen oficial',
      }
    }
    if (/^https?:\/\//.test(img)) {
      return { type: 'pdf-proxy', url: `/api/pdf-proxy?url=${encodeURIComponent(img)}`, label: 'Abrir recurso PDF' }
    }
    return { type: 'text', value: img }
  }
  const selectedDifficulty = getPreferredDifficulty(fpLevel)
  const questionCount = QUESTIONS_PER_SUBJECT
  const [secondsPerQuestion] = useState<number>(90)
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [openAnswer, setOpenAnswer] = useState<string>("")
  const openAnswerWordCount = getWordCount(openAnswer)
  const openAnswerLineCount = getLineCount(openAnswer)
  const isOpenAnswerValid =
    openAnswer.trim().length > 0 &&
    openAnswerWordCount <= MAX_REDACTION_WORDS &&
    openAnswerLineCount <= MAX_REDACTION_LINES
  const [startTime, setStartTime] = useState<number>(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(secondsPerQuestion)
  const [totalTime, setTotalTime] = useState<number>(0)
  
  const [isLoading, setIsLoading] = useState(false)
  const [score, setScore] = useState<number>(0)
  const [analysis, setAnalysis] = useState<any>(null)

  // --- localStorage helpers for anti-repeat ---
  const seenKey = (subject: string) => `eduia_seen_v1_${subject}`

  const getSeenIds = (subject: string): string[] => {
    try {
      const raw = localStorage.getItem(seenKey(subject))
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const addSeenIds = (subject: string, ids: string[]) => {
    try {
      const existing = getSeenIds(subject)
      const merged = [...new Set([...existing, ...ids])]
      localStorage.setItem(seenKey(subject), JSON.stringify(merged))
    } catch {}
  }

  const selectedCustomQuestionCount = selectedCustomSubjects.length * QUESTIONS_PER_SUBJECT

  const shuffleQuestions = <T,>(items: T[]) => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const fetchQuestionsForSubject = async (subjectName: string, count: number) => {
    const seenIds = getSeenIds(subjectName)
    const params = new URLSearchParams({
      subject: subjectName,
      difficulty: selectedDifficulty,
      count: String(count),
    })
    if (seenIds.length > 0) {
      params.set("exclude", seenIds.join(","))
    }

    const response = await fetch(`/api/exam/questions?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Error obteniendo preguntas de ${subjectName}`)
    }

    const data = await response.json()
    const fetchedQuestions = Array.isArray(data?.questions) ? data.questions : []
    if (fetchedQuestions.length > 0) {
      addSeenIds(subjectName, fetchedQuestions.map((question: ExamQuestion) => question._id))
    }
    return fetchedQuestions as ExamQuestion[]
  }

  useEffect(() => {
    if (examState === "taking" && questionStartTime === 0) {
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestionIndex, examState])

  const startExam = async (subjectArg?: string) => {
    const subjectToUse = subjectArg ?? selectedSubject
    if (!subjectToUse) return

    setSelectedSubject(subjectToUse)
    setIsLoading(true)
    try {
      const seenIds = getSeenIds(subjectToUse)
      const params = new URLSearchParams({
        subject: subjectToUse,
        difficulty: selectedDifficulty,
        count: questionCount.toString(),
      })
      if (seenIds.length > 0) {
        params.set('exclude', seenIds.join(','))
      }

      const response = await fetch(`/api/exam/questions?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Error obteniendo preguntas")
      }

      const data = await response.json()
      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        alert("No hay preguntas disponibles para esta materia. Intenta con otra.")
        setIsLoading(false)
        return
      }

      addSeenIds(subjectToUse, (data.questions as ExamQuestion[]).map((q) => q._id))
      setQuestions(data.questions)
      setExamState("taking")
      setStartTime(Date.now())
      setQuestionStartTime(Date.now())
      setTimeLeft(secondsPerQuestion)
      setUserAnswers([])
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar el examen. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const startCustomExam = async (subjectsArg?: string[]) => {
    const subjectsToUse = (subjectsArg ?? selectedCustomSubjects).filter(Boolean)
    if (subjectsToUse.length === 0) {
      alert("Selecciona al menos una asignatura.")
      return
    }

    setSelectedSubject("todo")
    setIsLoading(true)
    try {
      const resultSets = await Promise.all(
        subjectsToUse.map((subjectName) => fetchQuestionsForSubject(subjectName, QUESTIONS_PER_SUBJECT)),
      )

      const combined = shuffleQuestions(resultSets.flat())
      if (combined.length === 0) {
        alert("No hay preguntas disponibles para esta configuración.")
        return
      }

      setQuestions(combined)
      setExamState("taking")
      setStartTime(Date.now())
      setQuestionStartTime(Date.now())
      setTimeLeft(secondsPerQuestion)
      setUserAnswers([])
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar el simulacro completo. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCustomSubject = (subjectName: string) => {
    setSelectedCustomSubjects((current) => {
      if (current.includes(subjectName)) {
        if (current.length === 1) return current
        return current.filter((value) => value !== subjectName)
      }
      return [...current, subjectName]
    })
  }

  const downloadCustomExamPdf = async () => {
    if (selectedCustomSubjects.length === 0) {
      alert("Selecciona al menos una asignatura.")
      return
    }

    setIsDownloadingPdf(true)
    try {
      const params = new URLSearchParams({
        difficulty: selectedDifficulty,
        subject: "todo",
        subjects: selectedCustomSubjects.join(","),
        perSubjectCount: String(QUESTIONS_PER_SUBJECT),
        questionCount: String(selectedCustomQuestionCount),
        dataset: DEFAULT_DATASET_FILE,
        seed: String(Math.floor(Math.random() * 1e9)),
      })
      const response = await fetch(`/api/exam/practice-pack?${params.toString()}`)
      if (!response.ok) {
        throw new Error("No se pudo generar el PDF del simulacro")
      }
      const data = await response.json()
      await downloadPracticeExamPdf(data.pack)
    } catch (error) {
      console.error(error)
      alert("No se pudo generar el PDF del simulacro.")
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const handleAnswer = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    const isCorrect = Array.isArray(currentQuestion.options) ? currentQuestion.options[optionIndex]?.isCorrect : undefined

    const answer: UserAnswer = {
      questionId: currentQuestion._id,
      selectedOption: optionIndex,
      isCorrect,
      timeSpent,
    }

    const newAnswers = [...userAnswers, answer]
    setUserAnswers(newAnswers)

    // Si es la última pregunta, finalizar examen
    if (currentQuestionIndex === questions.length - 1) {
      finishExam(newAnswers)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleTimeout = () => {
    const currentQuestion = questions[currentQuestionIndex]
    const timeSpent = secondsPerQuestion
    const answer: UserAnswer = {
      questionId: currentQuestion._id,
      selectedOption: 'TIMEOUT',
      isCorrect: false,
      timeSpent,
    }

    const newAnswers = [...userAnswers, answer]
    setUserAnswers(newAnswers)

    if (currentQuestionIndex === questions.length - 1) {
      finishExam(newAnswers)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
      setTimeLeft(secondsPerQuestion)
    }
  }

  // Temporizador por pregunta durante el examen
  useEffect(() => {
    if (examState !== 'taking' || questions.length === 0) return

    setTimeLeft(secondsPerQuestion)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          // si no se ha respondido, forzar timeout
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState, currentQuestionIndex, questions, secondsPerQuestion])

  const handleOpenSubmit = (text: string) => {
    if (!isOpenAnswerValid) return

    const currentQuestion = questions[currentQuestionIndex]
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)

    const answer: UserAnswer = {
      questionId: currentQuestion._id,
      selectedOption: text,
      // isCorrect stays undefined for open questions (manual grading)
      timeSpent,
    }

    const newAnswers = [...userAnswers, answer]
    setUserAnswers(newAnswers)
    setOpenAnswer("")

    if (currentQuestionIndex === questions.length - 1) {
      finishExam(newAnswers)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const finishExam = async (answers: UserAnswer[]) => {
    const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000)
    setTotalTime(totalTimeSpent)

    const correctCount = answers.filter((a) => a.isCorrect).length
    const gradedCount = answers.filter((a) => typeof a.isCorrect !== 'undefined').length
    const scorePercentage = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0
    const clampedScore = Math.max(0, Math.min(100, scorePercentage))
    setScore(clampedScore)

    // Guardar intento en la base de datos
    try {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          subject: selectedSubject,
          difficulty: selectedDifficulty,
          questions: questions.map((q, idx) => ({
            questionId: q._id,
            userAnswer: answers[idx]?.selectedOption,
            isCorrect: answers[idx]?.isCorrect,
            timeSpent: answers[idx]?.timeSpent,
            // enviar snapshot para que el servidor pueda persistir la pregunta si es generada
            snapshot: {
              question: q.question,
              subject: q.subject,
              topic: q.topic,
              difficulty: q.difficulty,
              options: q.options,
              explanation: q.explanation,
              source: q.source,
            },
          })),
          score: clampedScore,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          totalTime: totalTimeSpent,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
      }
    } catch (error) {
      console.error("Error guardando simulacro:", error)
    }

    setExamState("results")
  }

  const resetExam = () => {
    setExamState("setup")
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setQuestions([])
    setScore(0)
    setAnalysis(null)
    setStartTime(0)
    setQuestionStartTime(0)
    // Do not reset selectedSubject so user can restart same subject quickly
  }

  // SETUP VIEW — simple subject picker
  if (examState === "setup") {
    // Calcular aquí para evitar error de scope
    const customQuestionCount = selectedCustomSubjects.length * QUESTIONS_PER_SUBJECT
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-5 rounded-2xl inline-block mb-4">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Elige una asignatura</h2>
            <p className="text-slate-500 dark:text-slate-400">5 preguntas oficiales · responde y ve tu resultado al instante</p>
          </div>

          {/* Descargas oficiales antes del simulacro */}
          <div className="mb-10">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Descargas — AccesoIA (Valencia · Grado Medio y Superior)</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Enlaces útiles y PDFs de pruebas de acceso oficiales (València, Grado Mitjà y Grado Superior). Puedes descargar los exámenes de ambas modalidades.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <h4 className="font-semibold mb-2 text-purple-700 dark:text-purple-300">Grado Medio</h4>
                  <ul className="space-y-2">
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2017.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2017 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2018.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2018 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2019.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2019 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2020.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2020 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2021.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2021 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2022.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2022 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2023.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2023 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038839/GM_2024.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2024 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/0/JUNTOS+GM+2025.pdf/eaff2543-5199-f592-6af1-aa689a78ea67" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2025 — Prueba de Acceso</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-pink-700 dark:text-pink-300">Grado Superior</h4>
                  <ul className="space-y-2">
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2017.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2017 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2019.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2019 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2020.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2020 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2021.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2021 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2022.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2022 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2023.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2023 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/391038844/GS_2024.pdf" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2024 — Prueba de Acceso</a></li>
                    <li><a href="https://ceice.gva.es/documents/388109149/0/JUNTOS+GS+2025.pdf/5ea55736-65de-bb7b-f6be-3fd240962af0" target="_blank" rel="noreferrer" className="text-pink-600 dark:text-pink-300 font-medium">GS 2025 — Prueba de Acceso</a></li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <aside className="w-full max-w-xl rounded-2xl border border-pink-300/40 bg-pink-50/80 p-5 text-sm text-pink-950 shadow-sm dark:border-pink-500/20 dark:bg-pink-950/20 dark:text-pink-100">
                  <p className="font-semibold text-pink-700 dark:text-pink-300">Cuadro explicativo: bloques A, B y C en GS</p>
                  <ul className="mt-3 list-disc pl-5 space-y-2">
                    <li><strong>Bloque A:</strong> Parte común. Incluye Lengua Castellana y Literatura, Valenciano y Lengua Extranjera (Inglés o Francés).</li>
                    <li><strong>Bloque B:</strong> Parte específica. El aspirante elige una de estas tres opciones, y debe seleccionar 2 de las 3 materias posibles:
                      <ul className="mt-2 list-decimal pl-5 space-y-1 text-sm">
                        <li><strong>Opción A. Humanidades y Ciencias Sociales:</strong> Historia del mundo contemporáneo, Economía y Geografía. Accede a familias profesionales como Administración y Gestión, Comercio y Marketing, Hostelería y Turismo, Servicios Socioculturales y a la Comunidad.</li>
                        <li><strong>Opción B. Tecnología:</strong> Dibujo Técnico, Tecnología Industrial y Física y Química. Accede a familias profesionales como Artes Gráficas, Artes y Artesanías, Edificación y Obra Civil, Electricidad y Electrónica, Energía y Agua, Fabricación Mecánica, Imagen y Sonido, Industrias Extractivas, Informática y Comunicaciones, Instalación y Mantenimiento, Madera, Mueble y Corcho.</li>
                        <li><strong>Opción C. Ciencias:</strong> Materias vinculadas a otras ramas científicas o técnicas según convocatoria.</li>
                      </ul>
                    </li>
                    <li><strong>Bloque C:</strong> Parte de opción. Permite elegir una materia adicional relacionada con la opción profesional o académica del alumno.</li>
                  </ul>
                  <p className="mt-3 font-medium text-pink-700 dark:text-pink-200">Exención de la parte específica</p>
                  <p className="mt-1 text-xs text-pink-900 dark:text-pink-100">Sí, puedes eximirte de la parte específica del acceso a ciclos formativos de Grado Superior si acreditas al menos un año de experiencia laboral relacionada con la familia profesional del ciclo al que quieres acceder. Debes presentar la vida laboral y un certificado de empresa, o una declaración de actividades si eres autónomo.</p>
                  <p className="mt-2 text-xs text-pink-900 dark:text-pink-100">Más información oficial: <a href="https://ceice.gva.es/es/web/formacion-profesional/pruebas-de-acceso-a-ciclos-formativos" target="_blank" rel="noreferrer" className="underline underline-offset-2">ceice.gva.es</a></p>
                </aside>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando preguntas…</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUBJECT_OPTIONS.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => startExam(sub.value)}
                    className={cn(
                      "group relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                      selectedSubject === sub.value
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-600"
                    )}
                  >
                    <span className="text-4xl">{sub.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{sub.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">5 preguntas</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors flex-shrink-0" />
                  </button>
                ))}
                <button
                  onClick={() => setSelectedSubject("todo")}
                  className={cn(
                    "group relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2",
                    selectedSubject === "todo"
                      ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 shadow-md"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-fuchsia-300 dark:hover:border-fuchsia-600"
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/20">
                    <SlidersHorizontal className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">Todo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configura un simulacro aleatorio con 5 preguntas por asignatura</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-fuchsia-600 transition-colors flex-shrink-0" />
                </button>
              </div>

              {selectedSubject === "todo" && (
                <div className="rounded-3xl border border-fuchsia-200/70 dark:border-fuchsia-800/40 bg-white/90 dark:bg-slate-900/80 p-6 shadow-xl">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Simulacro personalizado</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Cada examen mezcla 5 preguntas aleatorias por asignatura seleccionada. Puedes hacerlo online o descargar el PDF para imprimirlo en casa.</p>
                    </div>
                    <div className="rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-950/30 px-4 py-3 text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                      {customQuestionCount} preguntas totales
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUBJECT_OPTIONS.map((subject) => {
                      const active = selectedCustomSubjects.includes(subject.value)
                      return (
                        <button
                          key={subject.value}
                          type="button"
                          onClick={() => toggleCustomSubject(subject.value)}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                            active
                              ? "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{subject.emoji}</span>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm">{subject.label}</p>
                              <p className="text-xs opacity-75">5 preguntas aleatorias</p>
                            </div>
                          </div>
                          <span className={cn("text-xs font-bold uppercase tracking-wide", active ? "text-fuchsia-600 dark:text-fuchsia-300" : "text-slate-400 dark:text-slate-500")}>{active ? "Activa" : "Inactiva"}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => startCustomExam()}
                      disabled={selectedCustomSubjects.length === 0}
                      className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 text-white font-bold shadow-lg shadow-fuchsia-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Empezar simulacro aleatorio
                    </button>
                    <button
                      type="button"
                      onClick={downloadCustomExamPdf}
                      disabled={selectedCustomSubjects.length === 0 || isDownloadingPdf}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 text-slate-800 dark:text-slate-100 font-semibold transition hover:border-fuchsia-300 dark:hover:border-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDownloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      Descargar PDF imprimible
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // TAKING EXAM VIEW
  if (examState === "taking" && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full min-h-0 flex flex-col"
      >
        {/* Progress Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-semibold">
                    {currentQuestion.subject}
                  </span>
                  {currentQuestion.topic && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                      {currentQuestion.topic}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs font-semibold">
                    {currentQuestion.difficulty === "basico" ? "⭐ Básico" : 
                     currentQuestion.difficulty === "intermedio" ? "⭐⭐ Intermedio" : 
                     "⭐⭐⭐ Avanzado"}
                  </span>
                  {currentQuestion.source && (() => {
                    const srcInfo = formatExamSource(currentQuestion.source)
                    return srcInfo.url ? (
                      <a href={srcInfo.url} target="_blank" rel="noreferrer" className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1 hover:underline">
                        <Award className="w-3 h-3" />
                        {srcInfo.label}
                      </a>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {srcInfo.label}
                      </span>
                    )
                  })()}
                </div>

                {/* Question */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                  {currentQuestion.textReference && (
                    <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      <strong>Referencia:</strong>
                      <div className="mt-2">{currentQuestion.textReference.replace(/\[REQ_IMAGE:[^\]]+\]/gi, '').trim()}</div>
                      {Array.isArray(currentQuestion.reqImages) && currentQuestion.reqImages.length > 0 && (
                        <div className="mt-4">
                          <strong className="text-sm text-slate-800 dark:text-slate-200">Imágenes de apoyo:</strong>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {currentQuestion.reqImages.map((img, i) => {
                              const resolved = resolveImage(img)
                              return (
                                <div key={i}>
                                      {resolved.type === 'image' ? (
                                    <img src={resolved.url} alt={`Imagen de referencia ${i + 1}`} className="w-full h-auto object-contain max-h-[500px] rounded-2xl border border-slate-200 dark:border-slate-700" />
                                  ) : resolved.type === 'pdf-proxy' ? (
                                    <PdfReferenceImage
                                      pdfUrl={resolved.url}
                                      token={img}
                                      questionText={currentQuestion.question}
                                      textReference={currentQuestion.textReference}
                                      alt={`Imagen de referencia ${i + 1}`}
                                    />
                                  ) : (
                                    <span className="text-xs text-slate-400">{resolved.value}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion.source && (() => {
                    const srcInfo = formatExamSource(currentQuestion.source)
                    return (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <strong>Fuente:</strong>{' '}
                        {srcInfo.url ? (
                          <a href={srcInfo.url} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 hover:underline">{srcInfo.label}</a>
                        ) : (
                          <>{srcInfo.label}</>
                        )}
                      </p>
                    )
                  })()}

                  {/* Options */}
                  <div className="space-y-3">
                    {(() => {
                      // Detect cable-match (visual matching) questions
                      const matchPairs = Array.isArray(currentQuestion.options) && currentQuestion.options.length >= 2
                        ? extractMatchPairsFromOptions(currentQuestion.options)
                        : null
                      const useMatchUI = matchPairs && isMatchingQuestion(currentQuestion.question, currentQuestion.topic)

                      if (useMatchUI && matchPairs) {
                        return (
                          <CableMatch
                            pairs={matchPairs}
                            onComplete={(allCorrect) => {
                              const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
                              const answer: UserAnswer = {
                                questionId: currentQuestion._id,
                                selectedOption: allCorrect ? 0 : -1,
                                isCorrect: allCorrect,
                                timeSpent,
                              }
                              const newAnswers = [...userAnswers, answer]
                              setUserAnswers(newAnswers)
                            }}
                            onNextQuestion={() => {
                              if (currentQuestionIndex === questions.length - 1) {
                                finishExam(userAnswers)
                              } else {
                                setCurrentQuestionIndex(currentQuestionIndex + 1)
                                setQuestionStartTime(Date.now())
                              }
                            }}
                          />
                        )
                      }

                      if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
                        return currentQuestion.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAnswer(index)}
                            className="w-full text-left p-5 bg-slate-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 group-hover:border-purple-500 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1 text-base text-slate-800 dark:text-slate-200 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                                {option.text}
                              </span>
                              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </button>
                        ))
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold">✏️ Pregunta abierta — escribe tu respuesta</span>
                          </div>
                          <textarea
                            value={openAnswer}
                            onChange={(e) => setOpenAnswer(clampRedactionText(e.target.value, MAX_REDACTION_WORDS, MAX_REDACTION_LINES))}
                            placeholder="Desarrolla tu respuesta aquí..."
                            rows={8}
                            className="w-full min-h-[160px] p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 resize-y"
                          />
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {openAnswerWordCount}/{MAX_REDACTION_WORDS} palabras · {openAnswerLineCount}/{MAX_REDACTION_LINES} líneas
                            </p>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleOpenSubmit(openAnswer)}
                                disabled={!isOpenAnswerValid}
                                className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 transition-colors"
                              >
                                Enviar respuesta
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Source Info */}
                {currentQuestion.source && (() => {
                  const srcInfo = formatExamSource(currentQuestion.source)
                  return (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <Award className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-green-900 dark:text-green-300 mb-1">Fuente Certificada</p>
                          <p className="text-green-700 dark:text-green-400">
                            {srcInfo.url ? (
                              <a href={srcInfo.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:underline">
                                <span className="font-medium text-green-700 dark:text-green-300">{srcInfo.label}</span>
                                {currentQuestion.source.region || currentQuestion.source.year ? (
                                  <span className="text-green-700 dark:text-green-400 text-xs">{currentQuestion.source.region ? ` · ${currentQuestion.source.region}` : ''}{currentQuestion.source.year ? ` (${currentQuestion.source.year})` : ''}</span>
                                ) : null}
                                <span className="text-xs text-green-600 dark:text-green-400 ml-1">Ver examen →</span>
                              </a>
                            ) : (
                              <>{srcInfo.label}{currentQuestion.source.region ? ` · ${currentQuestion.source.region}` : ''}{currentQuestion.source.year ? ` (${currentQuestion.source.year})` : ''}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )
  }

  // RESULTS VIEW
  if (examState === "results") {
    const correctCount = userAnswers.filter((a) => a.isCorrect).length
    const gradedCount = userAnswers.filter((a) => typeof a.isCorrect === "boolean").length
    const incorrectCount = Math.max(0, gradedCount - correctCount)
    const pendingReviewCount = userAnswers.filter((a) => typeof a.isCorrect === "undefined").length
    const avgTime = Math.round(totalTime / Math.max(questions.length, 1))

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full overflow-y-auto p-8"
      >
        <div className="max-w-5xl mx-auto">
          {/* Score Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className={cn(
                "inline-block p-8 rounded-full mb-6",
                gradedCount === 0 && pendingReviewCount > 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                score >= 80 ? "bg-gradient-to-br from-green-400 to-emerald-500" :
                score >= 60 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                "bg-gradient-to-br from-red-400 to-pink-500"
              )}
            >
              <Trophy className="w-20 h-20 text-white" />
            </motion.div>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">
              {gradedCount === 0 && pendingReviewCount > 0 ? "Pendiente" : `${score}%`}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {gradedCount === 0 && pendingReviewCount > 0 ? "Tus respuestas requieren corrección manual." :
               score >= 80 ? "¡Excelente trabajo! 🎉" :
               score >= 60 ? "¡Buen intento! 👍" :
               "Sigue practicando 💪"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="text-green-600 dark:text-green-400 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{correctCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Correctas</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{incorrectCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Incorrectas</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="text-amber-600 dark:text-amber-400 mb-2">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingReviewCount}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pendientes de revisión</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="text-blue-600 dark:text-blue-400 mb-2">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, "0")}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tiempo Total</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="text-purple-600 dark:text-purple-400 mb-2">
                <TrendingUp className="w-8 h-8" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgTime}s</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Por Pregunta</p>
            </div>
          </div>

          {/* Análisis de Rendimiento */}
          {analysis && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-8">
              <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Análisis de Rendimiento
              </h3>

              {analysis.strengths && analysis.strengths.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Fortalezas:
                  </h4>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-green-600">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Áreas de mejora:
                  </h4>
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((weakness: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <span className="text-red-600">•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.recommendations && (
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recomendaciones:
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysis.recommendations}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Review Answers */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-8">
            <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" />
              Revisar Respuestas
            </h3>

            <div className="space-y-6">
              {questions.map((question, qIndex) => {
                const userAnswer = userAnswers[qIndex]
                const isCorrect = userAnswer?.isCorrect
                const answeredManually = typeof userAnswer?.selectedOption === "string" && typeof userAnswer?.isCorrect === "undefined"

                return (
                  <div
                    key={qIndex}
                    className={cn(
                      "p-6 rounded-2xl border-2",
                      answeredManually
                        ? "bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-500/30"
                        : isCorrect
                        ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-500/30"
                        : "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-500/30"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {answeredManually ? (
                        <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
                      ) : isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white mb-3">
                          {qIndex + 1}. {question.question}
                        </p>

                        {/* Opciones */}
                        <div className="space-y-2">
                          {answeredManually ? (
                            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-100/60 dark:bg-amber-900/20">
                              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">Tu respuesta escrita</p>
                              <p className="mt-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{String(userAnswer?.selectedOption ?? "— Sin respuesta")}</p>
                              <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">Pendiente de corrección manual.</p>
                            </div>
                          ) : Array.isArray(question.options) && question.options.length > 0 ? (
                            question.options.map((option, oIndex) => {
                              const wasSelected = userAnswer?.selectedOption === oIndex
                              const isCorrectOption = option.isCorrect

                              return (
                                <div
                                  key={oIndex}
                                  className={cn(
                                    "p-3 rounded-xl border-2 flex items-center gap-3",
                                    isCorrectOption
                                      ? "bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-500"
                                      : wasSelected
                                      ? "bg-red-100 dark:bg-red-900/20 border-red-400 dark:border-red-500"
                                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                  )}
                                >
                                  <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {String.fromCharCode(65 + oIndex)}.
                                  </span>
                                  <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">
                                    {option.text}
                                  </span>
                                  {isCorrectOption && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  )}
                                  {wasSelected && !isCorrectOption && (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/30">
                              <p className="text-sm font-medium">Respuesta abierta del alumno:</p>
                              <p className="mt-2 text-sm">{String(userAnswer?.selectedOption ?? '— Sin respuesta')}</p>
                            </div>
                          )}
                        </div>

                        {/* Explicación */}
                        {question.explanation && (
                          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                              💡 Explicación:
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                              {question.explanation}
                            </p>
                          </div>
                        )}

                        {/* Source */}
                        {question.source && (
                          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Award className="w-3 h-3" />
                            <span>
                              Fuente: {question.source.name} - {question.source.region} ({question.source.year})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          {/* Descargas oficiales (AccesoIA - Valencia, Grado Medio) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Descargas — AccesoIA (Valencia · Grado Medio)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Enlaces útiles y PDFs de pruebas de acceso (València, Grado Mitjà). Puedo recopilar y añadir aquí todos los PDFs oficiales si me das permiso para buscarlos.</p>
            <ul className="space-y-2">
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2017.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2017 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2017 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2018.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2018 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2018 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2019.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2019 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2019 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2020.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2020 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2020 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2021.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2021 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2021 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2022.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2022 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2022 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2023.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2023 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2023 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/391038839/GM_2024.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">GM 2024 — Prueba de Acceso (parte común)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/0/JUNTOS+GM+2025.pdf/eaff2543-5199-f592-6af1-aa689a78ea67" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">JUNTOS GM 2025 — Documentación / partes (GM 2025)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2025 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/392974777/OrientacionesGMGS_va.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Orientaciones Admisión GM/GS 2024-25 (valencià)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/392974777/OrientacionesGMGS_es.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Orientaciones Admisión GM/GS 2024-25 (español)</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://ceice.gva.es/documents/388109149/392974777/Prioridades_GM.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Criterios de Prioridad en la Admisión - CFGM</a>
                <div className="text-xs text-slate-500">ceice.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/iesbenissa/wp-content/uploads/sites/309/2024/02/InformacioPAC_CFGM_24.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Informació PAC CFGM 2024 (IES Benissa)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/ieslavalldigna/wp-content/uploads/sites/512/2024/02/Prova-acces-cicle-mitja.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Prova d'accés Cicle Mitjà 2024 (IES La Valldigna)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2024 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/46020480/wp-content/uploads/sites/468/2025/03/Proves-dacces-FP-2025.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Proves d'accés FP 2025 — recopilación (Portal Educatiu)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2025 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/iesalcasser/wp-content/uploads/sites/303/2025/02/PROVA-ACCES-GRAU-MITJA.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Prova Accés Grau Mitjà 2025 (IES Alcasser)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2025 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/iesisabel-clarasimo/wp-content/uploads/sites/1636/2025/02/Proves-acces-CF2025.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Proves d'accés Cicles Formatius 2025 (IES Isabel Clara Simó)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2025 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/iesabastos/wp-content/uploads/sites/617/2025/03/25PACFGM-v-Informacio-proves-dacces-de-grau-mitja.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Proves d'accés CFGM 2025 - Informació (IES Abastos)</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2025 · PDF verificado</div>
              </li>
              <li>
                <a href="https://portal.edu.gva.es/46020480/wp-content/uploads/sites/468/2024/02/Proves-dacces-cicles.pdf" target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 font-medium">Proves d'accés a Cicles — recopilación 2024</a>
                <div className="text-xs text-slate-500">portal.edu.gva.es · 2024 · enlace no verificado</div>
              </li>
            </ul>
          </motion.div>
          <div className="flex gap-4">
            <button
              onClick={resetExam}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl p-5 transition-all shadow-xl hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Hacer otro simulacro
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}
