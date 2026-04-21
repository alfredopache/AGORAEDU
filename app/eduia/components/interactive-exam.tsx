"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Trophy, Clock, TrendingUp, Award, BookOpen, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExamQuestion {
  _id: string
  question: string
  subject: string
  topic: string
  difficulty: "basico" | "intermedio" | "avanzado"
  options: Array<{
    text: string
    isCorrect: boolean
  }>
  explanation: string
  source: {
    name: string
    year: string
    region: string
  }
}

interface InteractiveExamProps {
  config: {
    subject: string
    difficulty: string
    count: number
    topic?: string
  }
  onComplete: (results: ExamResults) => void
  onCancel: () => void
}

interface ExamResults {
  questions: ExamQuestion[]
  userAnswers: number[]
  score: number
  timeSpent: number
  totalTime: number
}

export function InteractiveExam({ config, onComplete, onCancel }: InteractiveExamProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [startTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showingResults, setShowingResults] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({
        subject: config.subject,
        difficulty: config.difficulty,
        count: config.count.toString(),
      })
      if (config.topic) params.set('topic', config.topic)
      
      const response = await fetch(`/api/exam/questions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || data)
      }
    } catch (error) {
      console.error("Error cargando preguntas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return // Ya seleccionó una respuesta
    
    setSelectedOption(optionIndex)
    const newAnswers = [...userAnswers, optionIndex]
    setUserAnswers(newAnswers)

    // Esperar 1 segundo antes de avanzar
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedOption(null)
        setQuestionStartTime(Date.now())
      } else {
        // Examen completado
        finishExam(newAnswers)
      }
    }, 1500)
  }

  const finishExam = (answers: number[]) => {
    const totalTime = Date.now() - startTime
    let correctCount = 0

    questions.forEach((q, index) => {
      const userAnswer = answers[index]
      if (q.options[userAnswer]?.isCorrect) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.length) * 100)

    onComplete({
      questions,
      userAnswers: answers,
      score,
      timeSpent: totalTime,
      totalTime,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando preguntas del examen...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            No se encontraron preguntas para esta configuración
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Volver al chat
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header con Progreso */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm opacity-90">Pregunta {currentQuestionIndex + 1} de {questions.length}</p>
              <p className="text-2xl font-bold">{config.subject === "mixto" ? "Examen Completo" : currentQuestion.subject}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Tiempo</p>
              <p className="text-xl font-bold">
                {Math.floor((Date.now() - startTime) / 1000 / 60)}:
                {String(Math.floor((Date.now() - startTime) / 1000) % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Contenido de la Pregunta */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  📚 {currentQuestion.subject}
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                  🏷️ {currentQuestion.topic}
                </span>
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                  {currentQuestion.difficulty === "basico" ? "⭐ Básico" : 
                   currentQuestion.difficulty === "intermedio" ? "⭐⭐ Intermedio" : 
                   "⭐⭐⭐ Avanzado"}
                </span>
                {currentQuestion.source && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                    🏆 Oficial
                  </span>
                )}
              </div>

              {/* Pregunta */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white leading-relaxed">
                      {currentQuestion.question}
                    </h3>
                  </div>
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index
                    const isCorrect = option.isCorrect
                    const showResult = selectedOption !== null

                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={selectedOption !== null}
                        whileHover={selectedOption === null ? { scale: 1.02 } : {}}
                        whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                        className={cn(
                          "w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4",
                          selectedOption === null && "hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer",
                          !showResult && "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600",
                          showResult && isSelected && isCorrect && "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400",
                          showResult && isSelected && !isCorrect && "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-400",
                          showResult && !isSelected && isCorrect && "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400",
                          showResult && !isSelected && !isCorrect && "opacity-40",
                          selectedOption !== null && "cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          !showResult && "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
                          showResult && isSelected && isCorrect && "bg-green-500 text-white",
                          showResult && isSelected && !isCorrect && "bg-red-500 text-white",
                          showResult && !isSelected && isCorrect && "bg-green-500 text-white",
                        )}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        
                        <span className={cn(
                          "flex-1 text-base",
                          !showResult && "text-slate-700 dark:text-slate-300",
                          showResult && isSelected && isCorrect && "text-green-900 dark:text-green-100 font-semibold",
                          showResult && isSelected && !isCorrect && "text-red-900 dark:text-red-100 font-semibold",
                          showResult && !isSelected && isCorrect && "text-green-900 dark:text-green-100 font-semibold",
                        )}>
                          {option.text}
                        </span>

                        {showResult && isSelected && isCorrect && (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        {showResult && !isSelected && isCorrect && (
                          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Fuente */}
                {currentQuestion.source && (
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      <span>
                        <strong>Fuente:</strong> {currentQuestion.source.name} - {currentQuestion.source.region} ({currentQuestion.source.year})
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Mensaje de transición */}
              {selectedOption !== null && currentQuestionIndex < questions.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full">
                    <ChevronRight className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">Siguiente pregunta...</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

interface ExamResultsViewProps {
  results: ExamResults
  onNewExam: () => void
  onBackToChat: () => void
}

export function ExamResultsView({ results, onNewExam, onBackToChat }: ExamResultsViewProps) {
  const correctCount = results.userAnswers.filter((answer, index) => 
    results.questions[index].options[answer]?.isCorrect
  ).length
  
  const incorrectCount = results.questions.length - correctCount
  const averageTime = Math.round(results.timeSpent / results.questions.length / 1000)
  const score = results.score

  // Calcular nota de media
  const notaMedia = (score / 100) * 10

  // Análisis por materia
  const subjectStats: Record<string, { correct: number; total: number; subject: string }> = {}
  
  results.questions.forEach((q, index) => {
    if (!subjectStats[q.subject]) {
      subjectStats[q.subject] = { correct: 0, total: 0, subject: q.subject }
    }
    subjectStats[q.subject].total++
    if (q.options[results.userAnswers[index]]?.isCorrect) {
      subjectStats[q.subject].correct++
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "¡Excelente! 🎉"
    if (score >= 80) return "¡Muy bien! 👏"
    if (score >= 70) return "¡Buen trabajo! 👍"
    if (score >= 60) return "Aprobado ✅"
    return "Sigue practicando 💪"
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Resultado Principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 mb-6"
        >
          <div className="text-center mb-6">
            <Trophy className="w-20 h-20 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              ¡Examen Completado!
            </h2>
            <p className={cn("text-6xl font-black mb-2", getScoreColor(score))}>
              {score}%
            </p>
            <p className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
              Nota de Media: {notaMedia.toFixed(2)} / 10
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
              {getScoreMessage(score)}
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Correctas</p>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{correctCount}</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-900 dark:text-red-100">Incorrectas</p>
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Tiempo Total</p>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.floor(results.timeSpent / 1000 / 60)}:{String(Math.floor(results.timeSpent / 1000) % 60).padStart(2, '0')}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Promedio</p>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageTime}s</p>
            </div>
          </div>

          {/* Desglose por Materia */}
          {Object.keys(subjectStats).length > 1 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Puntuación por Materia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(subjectStats).map((stat) => {
                  const percentage = Math.round((stat.correct / stat.total) * 100)
                  return (
                    <div
                      key={stat.subject}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {stat.subject}
                        </span>
                        <span className={cn("font-bold", getScoreColor(percentage))}>
                          {stat.correct}/{stat.total}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            percentage >= 80 ? "bg-green-500" :
                            percentage >= 60 ? "bg-yellow-500" :
                            "bg-red-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Nota: {((percentage / 100) * 10).toFixed(2)} / 10
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={onNewExam}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              🔄 Hacer Otro Examen
            </button>
            <button
              onClick={onBackToChat}
              className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold py-4 px-6 rounded-xl transition-all"
            >
              💬 Volver al Chat
            </button>
          </div>
        </motion.div>

        {/* Revisión Detallada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            Revisión Completa
          </h3>

          <div className="space-y-6">
            {results.questions.map((question, index) => {
              const userAnswer = results.userAnswers[index]
              const isCorrect = question.options[userAnswer]?.isCorrect
              const correctIndex = question.options.findIndex(opt => opt.isCorrect)

              return (
                <div
                  key={index}
                  className={cn(
                    "border-l-4 pl-6 pr-4 py-4 rounded-r-xl",
                    isCorrect 
                      ? "border-green-500 bg-green-50/50 dark:bg-green-900/10" 
                      : "border-red-500 bg-red-50/50 dark:bg-red-900/10"
                  )}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Pregunta {index + 1}
                      </p>
                      <p className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                        {question.question}
                      </p>
                      
                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={cn(
                              "text-sm p-3 rounded-lg",
                              optIndex === userAnswer && isCorrect && "bg-green-100 dark:bg-green-900/30 font-semibold text-green-900 dark:text-green-100",
                              optIndex === userAnswer && !isCorrect && "bg-red-100 dark:bg-red-900/30 font-semibold text-red-900 dark:text-red-100",
                              optIndex === correctIndex && optIndex !== userAnswer && "bg-green-100 dark:bg-green-900/30 font-semibold text-green-900 dark:text-green-100",
                              optIndex !== userAnswer && optIndex !== correctIndex && "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400"
                            )}
                          >
                            <strong>{String.fromCharCode(65 + optIndex)})</strong> {option.text}
                            {optIndex === correctIndex && (
                              <span className="ml-2 text-green-600 dark:text-green-400">✓ Correcta</span>
                            )}
                            {optIndex === userAnswer && !isCorrect && (
                              <span className="ml-2 text-red-600 dark:text-red-400">✗ Tu respuesta</span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          💡 Explicación:
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>

                      {question.source && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          📚 <strong>Fuente:</strong> {question.source.name} ({question.source.year})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
