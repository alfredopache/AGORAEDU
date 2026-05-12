"use client"

import { useState, useEffect } from "react"
import { motion as motionBase, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, Trophy, Clock, TrendingUp, Award, BookOpen, ChevronRight } from "lucide-react"
import { PdfReferenceImage } from "./pdf-reference-image"

const motion = motionBase as any
import { cn, clampRedactionText, getWordCount, getLineCount, MAX_REDACTION_LINES, MAX_REDACTION_WORDS, formatExamSource } from "@/lib/utils"

interface ExamQuestion {
  _id: string;
  question: string;
  subject: string;
  topic: string;
  difficulty: "basico" | "intermedio" | "avanzado";
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  source: {
    name: string;
    year?: string | number | null;
    region?: string;
    url?: string | null;
  };
  textReference?: string;
  reqImages?: string[];
}

interface InteractiveExamProps {
  config: {
    subject: string;
    difficulty: string;
    count: number;
    topic?: string;
    timePerQuestion?: number;
  };
  onComplete: (results: ExamResults) => void;
  onCancel: () => void;
}

interface ExamResults {
  questions: ExamQuestion[];
  userAnswers: Array<number | string>;
  score: number;
  timeSpent: number;
  totalTime: number;
}

export function InteractiveExam({ config, onComplete, onCancel }: InteractiveExamProps) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Array<number | string>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [openAnswer, setOpenAnswer] = useState<string>("")
  const [forceOpenMode, setForceOpenMode] = useState<boolean>(false)

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
  const [startTime] = useState(Date.now())
  const [timeLeft, setTimeLeft] = useState<number>(config.timePerQuestion || 60)
  const openAnswerWordCount = getWordCount(openAnswer)
  const openAnswerLineCount = getLineCount(openAnswer)
  const isOpenAnswerValid =
    openAnswer.trim().length > 0 &&
    openAnswerWordCount <= MAX_REDACTION_WORDS &&
    openAnswerLineCount <= MAX_REDACTION_LINES
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showingResults, setShowingResults] = useState(false)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true)
        setQuestions([])
        setCurrentQuestionIndex(0)
        setUserAnswers([])
        setSelectedOption(null)
        setOpenAnswer("")

        // Activar por defecto el modo de respuesta abierta para Matemáticas
        setForceOpenMode(Boolean(config.subject && /matem/i.test(config.subject)))

        const params = new URLSearchParams({
          subject: config.subject,
          difficulty: config.difficulty,
          count: config.count.toString(),
        })
        if (config.topic) params.set('topic', config.topic)
        
        const response = await fetch(`/api/exam/questions?${params}`)
        if (response.ok) {
            const data = await response.json()
            const loaded = data.questions || data
            setQuestions(loaded)
            // inicializar tiempo por pregunta
            setTimeLeft(config.timePerQuestion || 60)
            setQuestionStartTime(Date.now())
        }
      } catch (error) {
        console.error("Error cargando preguntas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [config])

  // Temporizador por pregunta: decrementa y avanza si llega a 0
  useEffect(() => {
    if (questions.length === 0) return

    // resetear contador para la pregunta actual
    setTimeLeft(config.timePerQuestion || 60)
    setQuestionStartTime(Date.now())
    // Forzar respuesta abierta si la configuración o la pregunta actual son de Matemáticas
    const currentQ = questions && questions.length > 0 ? questions[currentQuestionIndex] : null
    const isConfigMath = Boolean(config.subject && /matem/i.test(String(config.subject)))
    const isQuestionMath = Boolean(currentQ && currentQ.subject && /matem/i.test(String(currentQ.subject)))
    setForceOpenMode(isConfigMath || isQuestionMath)
    setOpenAnswer("")
    setSelectedOption(null)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          // Si todavía no se ha respondido, marcar timeout y avanzar
          if (selectedOption === null) {
            handleTimeout()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions, config.subject])

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return // Ya seleccionó una respuesta

    const newAnswers = [...userAnswers, optionIndex]
    setSelectedOption(optionIndex)
    setUserAnswers(newAnswers)

    // Si estamos en la última pregunta, finalizar inmediatamente para evitar demoras
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setSelectedOption(null)
        setOpenAnswer("")
        setQuestionStartTime(Date.now())
      }, 1500)
    } else {
      finishExam(newAnswers)
    }
  }

  const handleTimeout = () => {
    // Registrar como respuesta por tiempo agotado
    const newAnswers = [...userAnswers, 'TIMEOUT']
    setUserAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedOption(null)
      setOpenAnswer("")
      setQuestionStartTime(Date.now())
      setTimeLeft(config.timePerQuestion || 60)
    } else {
      finishExam(newAnswers)
    }
  }

  const handleOpenSubmit = (text: string) => {
    if (selectedOption !== null || !text.trim()) return

    const newAnswers = [...userAnswers, text]
    // marcar con un valor numérico distinto para indicar respuesta abierta (no coincidente con índices de opciones)
    setSelectedOption(-1)
    setUserAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setSelectedOption(null)
        setOpenAnswer("")
        setQuestionStartTime(Date.now())
      }, 1000)
    } else {
      finishExam(newAnswers)
    }
  }

  const finishExam = (answers: Array<number | string>) => {
    const totalTime = Date.now() - startTime
    let correctCount = 0
    let gradedCount = 0

    questions.forEach((q, index) => {
      const userAnswer = answers[index]
      if (q.options && q.options.length > 0) {
        gradedCount++
        if (typeof userAnswer === 'number' && q.options[userAnswer]?.isCorrect) {
          correctCount++
        }
      }
    })

    let score = gradedCount > 0 ? Math.round((correctCount / gradedCount) * 100) : 0
    score = Math.max(0, Math.min(100, score))

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
          <p className="text-slate-600 dark:text-slate-400">Cargando preguntas del simulacro...</p>
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
              <p className="text-2xl font-bold">{config.subject === "mixto" ? "Simulacro completo" : currentQuestion.subject}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Tiempo restante (pregunta)</p>
              <p className="text-xl font-bold">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
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
      <div className="flex-1 p-6 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20">
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
                    {currentQuestion.source && (() => {
                      const srcInfo = formatExamSource(currentQuestion.source)
                      return (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          <strong>Fuente:</strong>{' '}
                          {srcInfo.url ? (
                            <a href={srcInfo.url} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 hover:underline">{srcInfo.label}</a>
                          ) : (
                            <>{srcInfo.label}</>
                          )}
                        </p>
                      )
                    })()}
                    {currentQuestion.textReference && (
                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
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
                  </div>
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  {(!currentQuestion.options || currentQuestion.options.length === 0) ? (
                    /* Pregunta abierta: mostrar textarea y botón */
                    <div className="space-y-3">
                      <textarea
                        value={openAnswer}
                        onChange={(e) => setOpenAnswer(clampRedactionText(e.target.value, MAX_REDACTION_WORDS, MAX_REDACTION_LINES))}
                        placeholder="Escribe tu respuesta aquí..."
                        rows={8}
                        className="w-full min-h-[120px] p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {openAnswerWordCount}/{MAX_REDACTION_WORDS} palabras · {openAnswerLineCount}/{MAX_REDACTION_LINES} líneas
                        </p>
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleOpenSubmit(openAnswer)}
                            disabled={!isOpenAnswerValid}
                            className="px-6 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                          >
                            Enviar respuesta
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Pregunta cerrada con opciones: permitir modo opcional de "escribir respuesta"
                    <div className="space-y-3">
                      {!forceOpenMode ? (
                        <>
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
                                  "w-full text-left p-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 pointer-events-auto",
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

                          <div className="flex justify-end mt-2">
                            <button type="button" onClick={() => setForceOpenMode(true)} className="text-sm text-slate-600 hover:underline">Escribir mi respuesta</button>
                          </div>
                        </>
                      ) : (
                        // Modo abierto forzado para preguntas cerradas
                        <div className="space-y-3">
                          <textarea
                            value={openAnswer}
                            onChange={(e) => setOpenAnswer(clampRedactionText(e.target.value, MAX_REDACTION_WORDS, MAX_REDACTION_LINES))}
                            placeholder="Escribe tu respuesta aquí..."
                            rows={8}
                            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500 dark:text-slate-400">{openAnswerWordCount}/{MAX_REDACTION_WORDS} palabras</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setForceOpenMode(false)} className="px-4 py-2 rounded-lg border">Volver a opciones</button>
                              <button
                                onClick={() => { handleOpenSubmit(openAnswer); }}
                                disabled={!isOpenAnswerValid}
                                className="px-6 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"
                              >
                                Enviar respuesta
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fuente (detalle) */}
                {currentQuestion.source && (() => {
                  const srcInfo = formatExamSource(currentQuestion.source)
                  return (
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        <span>
                          <strong>Fuente:</strong>{' '}
                          {srcInfo.url ? (
                            <a href={srcInfo.url} target="_blank" rel="noreferrer" className="text-purple-600 dark:text-purple-300 hover:underline">{srcInfo.label}</a>
                          ) : (
                            <>{srcInfo.label}</>
                          )}
                          {currentQuestion.source.region ? ` · ${currentQuestion.source.region}` : ''}
                          {currentQuestion.source.year ? ` (${currentQuestion.source.year})` : ''}
                        </span>
                      </p>
                    </div>
                  )
                })()}
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
  let correctCount = 0
  const gradedCount = results.questions.filter((q) => q.options && q.options.length > 0).length
  let openCount = 0

  results.questions.forEach((q, index) => {
    const ans = results.userAnswers[index]
    if (q.options && q.options.length > 0) {
      if (typeof ans === 'number' && q.options[ans]?.isCorrect) correctCount++
    } else {
      openCount++
    }
  })

  const incorrectCount = Math.max(0, gradedCount - correctCount)
  const averageTime = Math.round(results.timeSpent / Math.max(results.questions.length, 1) / 1000)
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
    const ans = results.userAnswers[index]
    if (q.options && typeof ans === 'number' && q.options[ans]?.isCorrect) {
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
    <div className="h-full hide-scrollbar bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20 p-6">
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
              ¡Simulacro completado!
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

          {/* Fuentes utilizadas en el simulacro */}
          {results.questions && results.questions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fuentes del simulacro</h4>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Map(
                    results.questions
                      .map((q) => q.source)
                      .filter(Boolean)
                      .map((s: any) => [`${s.name || 'Desconocida'}|${s.year || ''}`, s])
                  ).values()
                ).map((s: any, i) => (
                  <div key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-200">
                    {s.name}{s.year ? ` — ${s.year}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

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
              🔄 Hacer otro simulacro
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
              const hasOptions = Array.isArray(question.options) && question.options.length > 0
              const correctIndex = hasOptions ? question.options!.findIndex(opt => opt.isCorrect) : -1
              const isCorrect = hasOptions && typeof userAnswer === 'number' ? question.options![userAnswer]?.isCorrect : false

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
                        {hasOptions ? (
                          question.options!.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={cn(
                                "text-sm p-3 rounded-lg",
                                typeof userAnswer === 'number' && optIndex === userAnswer && isCorrect && "bg-green-100 dark:bg-green-900/30 font-semibold text-green-900 dark:text-green-100",
                                typeof userAnswer === 'number' && optIndex === userAnswer && !isCorrect && "bg-red-100 dark:bg-red-900/30 font-semibold text-red-900 dark:text-red-100",
                                optIndex === correctIndex && optIndex !== userAnswer && "bg-green-100 dark:bg-green-900/30 font-semibold text-green-900 dark:text-green-100",
                                (typeof userAnswer !== 'number' || (optIndex !== userAnswer && optIndex !== correctIndex)) && "bg-slate-100 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              <strong>{String.fromCharCode(65 + optIndex)})</strong> {option.text}
                              {optIndex === correctIndex && (
                                <span className="ml-2 text-green-600 dark:text-green-400">✓ Correcta</span>
                              )}
                              {typeof userAnswer === 'number' && optIndex === userAnswer && !isCorrect && (
                                <span className="ml-2 text-red-600 dark:text-red-400">✗ Tu respuesta</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/30">
                            <p className="text-sm font-medium">Respuesta abierta del alumno:</p>
                            <p className="mt-2 text-sm">{String(userAnswer ?? '— Sin respuesta')}</p>
                          </div>
                        )}
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
        {/* Descargas oficiales (AccesoIA - Valencia, Grado Medio) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Descargas — AccesoIA (Valencia · Grado Medio)</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Enlaces oficiales y PDFs de pruebas de acceso. Si quieres que busque y añada todos los PDFs oficiales de Valencia, dímelo y los extraigo y agrego aquí.</p>
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
      </div>
    </div>
  )
}
