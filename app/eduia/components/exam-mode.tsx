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
  PlayCircle,
  RotateCcw,
  ChevronRight,
  Award,
  GraduationCap,
  Lightbulb
} from "lucide-react"
import { cn } from "@/lib/utils"

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
}

interface UserAnswer {
  questionId: string
  selectedOption?: number | string
  isCorrect?: boolean
  timeSpent: number
}

interface ExamModeProps {
  sessionId: string
}

type ExamState = "setup" | "taking" | "results"

const SUBJECT_OPTIONS = [
  { value: "mixto", label: "Mixto (todas)", emoji: "🧠", color: "from-indigo-500 to-purple-500" },
  { value: "matematicas", label: "Matemáticas", emoji: "🔢", color: "from-blue-600 to-indigo-600" },
  { value: "lengua", label: "Lengua y Comunicación", emoji: "📝", color: "from-indigo-500 to-purple-500" },
  { value: "lengua:comentario", label: "Comentario de texto", emoji: "📚", color: "from-pink-500 to-pink-600" },
  { value: "ingles", label: "Inglés", emoji: "🌍", color: "from-emerald-500 to-green-600" },
  { value: "sociales", label: "Ciencias Sociales", emoji: "🏛️", color: "from-yellow-500 to-orange-500" },
  { value: "sociales:historia", label: "Historia", emoji: "🏺", color: "from-yellow-600 to-orange-600" },
  { value: "tic", label: "TIC", emoji: "💻", color: "from-green-400 to-teal-500" },
]

const DIFFICULTY_OPTIONS = [
  { value: "basico", label: "Básico", stars: "⭐" },
  { value: "intermedio", label: "Intermedio", stars: "⭐⭐" },
  { value: "avanzado", label: "Avanzado", stars: "⭐⭐⭐" },
]

export function ExamMode({ sessionId }: ExamModeProps) {
  const [examState, setExamState] = useState<ExamState>("setup")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(10)
  
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [openAnswer, setOpenAnswer] = useState<string>("")
  const [startTime, setStartTime] = useState<number>(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [totalTime, setTotalTime] = useState<number>(0)
  
  const [isLoading, setIsLoading] = useState(false)
  const [score, setScore] = useState<number>(0)
  const [analysis, setAnalysis] = useState<any>(null)

  useEffect(() => {
    if (examState === "taking" && questionStartTime === 0) {
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestionIndex, examState])

  const startExam = async () => {
    if (!selectedSubject || !selectedDifficulty) return

    setIsLoading(true)
    try {
      // soportar subject con topic: e.g. 'lengua:comentario'
      let subjectParam = selectedSubject
      let topicParam: string | undefined = undefined
      if (selectedSubject.includes(':')) {
        const parts = selectedSubject.split(':')
        subjectParam = parts[0]
        topicParam = parts.slice(1).join(':')
      }

      const params = new URLSearchParams({
        subject: subjectParam,
        difficulty: selectedDifficulty,
        count: questionCount.toString(),
      })
      if (topicParam) params.set('topic', topicParam)

      const response = await fetch(`/api/exam/questions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Error obteniendo preguntas")
      }

        const data = await response.json()

        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          alert("No hay preguntas disponibles para esta configuración. Intenta con otra materia o dificultad.")
          setIsLoading(false)
          return
        }

      setQuestions(data.questions)
      setExamState("taking")
      setStartTime(Date.now())
      setQuestionStartTime(Date.now())
      setUserAnswers([])
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar el examen. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
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

  const handleOpenSubmit = (text: string) => {
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
      console.error("Error guardando examen:", error)
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
  }

  // SETUP VIEW
  if (examState === "setup") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full p-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="bg-gradient-to-br from-pink-500 to-purple-500 p-6 rounded-3xl inline-block mb-4">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Modo Examen
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Practica con preguntas de exámenes oficiales certificadas
            </p>
          </div>

          {/* Configuración del Examen */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
              Configura tu examen
            </h3>

            {/* Selección de Materia */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                📚 Selecciona el ámbito:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {SUBJECT_OPTIONS.map((subject) => (
                  <button
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left group pointer-events-auto",
                      selectedSubject === subject.value
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105"
                        : "border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{subject.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{subject.label}</p>
                        {selectedSubject === subject.value && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600 mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de Dificultad */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                📈 Nivel de dificultad:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all pointer-events-auto",
                      selectedDifficulty === difficulty.value
                        ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-lg scale-105"
                        : "border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600"
                    )}
                  >
                    <p className="font-bold text-slate-900 dark:text-white mb-1">{difficulty.label}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{difficulty.stars}</p>
                    {selectedDifficulty === difficulty.value && (
                      <CheckCircle2 className="w-4 h-4 text-pink-600 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad de Preguntas */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                🔢 Número de preguntas:
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="flex-1 pointer-events-auto"
                />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!isNaN(v)) setQuestionCount(Math.max(1, Math.min(30, Math.floor(v))))
                  }}
                  className="w-20 text-center rounded-md border px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  aria-label="Número de preguntas"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">preguntas</span>
              </div>
            </div>

            {/* Botón Iniciar */}
            <button
              onClick={startExam}
              disabled={!selectedSubject || !selectedDifficulty || isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl p-6 transition-all shadow-xl hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Cargando preguntas...
                </>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6" />
                  Iniciar Examen
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
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
        className="h-full flex flex-col"
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
        <div className="flex-1 p-8">
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
                  {currentQuestion.source && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Certificada {currentQuestion.source.year}
                    </span>
                  )}
                </div>

                {/* Question */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
                    {currentQuestion.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                      currentQuestion.options.map((option, index) => (
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
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={openAnswer}
                          onChange={(e) => setOpenAnswer(e.target.value)}
                          placeholder="Escribe tu respuesta aquí..."
                          className="w-full min-h-[120px] p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleOpenSubmit(openAnswer)}
                            disabled={!openAnswer.trim()}
                            className="px-6 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                          >
                            Enviar respuesta
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source Info */}
                {currentQuestion.source && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Award className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                          Fuente Certificada
                        </p>
                        <p className="text-green-700 dark:text-green-400">
                          {currentQuestion.source.name} - {currentQuestion.source.region} ({currentQuestion.source.year})
                        </p>
                        {currentQuestion.source.url && (
                          <a
                            href={currentQuestion.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 dark:text-green-400 hover:underline text-xs mt-1 inline-block"
                          >
                            Ver fuente original →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
    const gradedCount = userAnswers.filter((a) => typeof a.isCorrect !== 'undefined').length
    const incorrectCount = gradedCount - correctCount
    const avgTime = Math.round(totalTime / Math.max(questions.length, 1))

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full p-8"
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
                score >= 80 ? "bg-gradient-to-br from-green-400 to-emerald-500" :
                score >= 60 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                "bg-gradient-to-br from-red-400 to-pink-500"
              )}
            >
              <Trophy className="w-20 h-20 text-white" />
            </motion.div>
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-3">
              {score}%
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              {score >= 80 ? "¡Excelente trabajo! 🎉" :
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

                return (
                  <div
                    key={qIndex}
                    className={cn(
                      "p-6 rounded-2xl border-2",
                      isCorrect
                        ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-500/30"
                        : "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-500/30"
                    )}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      {isCorrect ? (
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
                          {Array.isArray(question.options) && question.options.length > 0 ? (
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
          <div className="flex gap-4">
            <button
              onClick={resetExam}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl p-5 transition-all shadow-xl hover:shadow-2xl font-bold text-lg flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              Hacer Otro Examen
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}
