"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Loader2, Bot, User, Sparkles, BookOpen, Lightbulb } from "lucide-react"
import { motion as motionBase, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const motion = motionBase as any
import { MarkdownRenderer } from "./markdown-renderer"
import { InteractiveExam, ExamResultsView } from "./interactive-exam"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatModeProps {
  sessionId: string
  conversationId: string | null
  onConversationSaved: (conversationId?: string | null) => void
  onDeleteConversation?: (conversationId: string) => Promise<boolean>
}

type ChatScope = "ambito_linguistico" | "ambito_cientifico"

const SCOPE_OPTIONS: Array<{ value: ChatScope; label: string; emoji: string; description: string }> = [
  {
    value: "ambito_linguistico",
    label: "Ámbito lingüístico-social",
    emoji: "🗣️",
    description: "Lengua, comunicación y ciencias sociales",
  },
  {
    value: "ambito_cientifico",
    label: "Ámbito científico-matemático",
    emoji: "🔬",
    description: "Matemáticas, lógica y ciencias naturales",
  },
]

const EXAMPLE_QUESTIONS = [
  { text: "Explícame las ecuaciones de segundo grado paso a paso", emoji: "🔢", subject: "matematicas" },
  { text: "¿Cuáles son las reglas de acentuación en español?", emoji: "📝", subject: "lengua" },
  { text: "¿Cómo se usa el Present Perfect en inglés?", emoji: "🌍", subject: "ingles" },
  { text: "Hazme un examen de 10 preguntas de matemáticas", emoji: "📝", subject: "exam" },
  { text: "Dame 10 ejercicios de fracciones con soluciones", emoji: "🔢", subject: "matematicas" },
  { text: "Quiero hacer una prueba de inglés de nivel intermedio", emoji: "🎯", subject: "exam" },
]

const QUICK_ACTIONS = [
  { label: "Generar ejercicios", prompt: "Dame 10 ejercicios de práctica sobre ", icon: BookOpen },
  { label: "Explicar concepto", prompt: "Explícame de forma clara y con ejemplos: ", icon: Lightbulb },
  { label: "Resumir tema", prompt: "Hazme un resumen completo sobre: ", icon: Sparkles },
]

export function ChatMode({ sessionId, conversationId, onConversationSaved, onDeleteConversation }: ChatModeProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [selectedScope, setSelectedScope] = useState<ChatScope>("ambito_linguistico")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Estados para examen interactivo
  const [examMode, setExamMode] = useState<'none' | 'active' | 'results'>('none')
  const [examConfig, setExamConfig] = useState<any>(null)
  const [examResults, setExamResults] = useState<any>(null)

  const userLabel = session?.user?.name ? session.user.name : "Google"
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cargar conversación existente
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else {
      setMessages([])
    }
  }, [conversationId])

  const loadConversation = async (id: string) => {
    setIsLoadingConversation(true)
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const data = await response.json()
        const loadedMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error("Error cargando conversación:", error)
    } finally {
      setIsLoadingConversation(false)
    }
  }

  const saveConversation = async (updatedMessages: Message[]) => {
    if (updatedMessages.length === 0) return

    try {
      // Generar título del primer mensaje del usuario
      const firstUserMessage = updatedMessages.find(m => m.role === "user")
      const title = firstUserMessage?.content.substring(0, 50) || "Nueva conversación"

      // Detectar materia principal
      const content = updatedMessages.map(m => m.content.toLowerCase()).join(" ")
      let subject = "general"
      if (content.includes("ecuación") || content.includes("matemática") || content.includes("número")) {
        subject = "matematicas"
      } else if (content.includes("inglés") || content.includes("english")) {
        subject = "ingles"
      } else if (content.includes("lengua") || content.includes("gramática") || content.includes("ortografía")) {
        subject = "lengua"
      } else if (content.includes("historia") || content.includes("geografía") || content.includes("social")) {
        subject = "sociales"
      }

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          sessionId,
          title,
          subject,
          messages: updatedMessages,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onConversationSaved(data.conversationId || null)
      }
    } catch (error) {
      console.error("Error guardando conversación:", error)
    }
  }

  const detectExamRequest = (text: string): { isExam: boolean; config?: any } => {
    const lowerText = text.toLowerCase()

    // Detectar si el usuario pide un examen/prueba/ejercicio
    const isExamRequest = /\b(examen|prueba|test|ejercicio|ejercicios|pregunta|preguntas|dame|hazme|quiero)\b/i.test(lowerText)
    if (!isExamRequest) return { isExam: false }

    // Detección de ámbito/sujeto
    let subject = 'mixto'
    let topic: string | undefined = undefined

    // Si el usuario menciona explícitamente un ámbito
    if (/ambit?o|ámbito/.test(lowerText)) {
      if (/(lingu[ií]stic|lingü|comunic)/i.test(lowerText) || /linguistico|lingüistico|comunicativo|comunicacion/.test(lowerText)) {
        subject = 'ambito_linguistico'
      } else if (/(cientific|matem|tic|ciencias)/i.test(lowerText)) {
        subject = 'ambito_cientifico'
      }
    }

    // Detectar tema específico de la solicitud, p.e. "sobre fracciones" o "tema de historia"
    const topicMatch = lowerText.match(/(?:sobre|tema de|acerca de|referente a)\s+(?:el |la |los |las )?([a-záéíóúñ0-9\s]+?)(?=(?:[,.]|$| por | con | para | y | de \d| preguntas?))/i)
    if (topicMatch) {
      const rawTopic = topicMatch[1].trim()
      if (!/(examen|prueba|preguntas?|ejercicio|ejercicios|quiero|dame|hazme|te|me|que|sobre|tema)/i.test(rawTopic)) {
        topic = rawTopic.replace(/\s{2,}/g, ' ')
      }
    }

    // Si no se detectó ámbito, buscar materia específica y mapearla a uno de los dos ámbitos
    if (subject === 'mixto') {
      if (/(matem|mate|cientific|cienci|tic|física|fisica|química|quimica|naturaleza|númer|numero|álgebra|algebra|geometr|problema)/i.test(lowerText)) {
        subject = 'ambito_cientifico'
      } else if (/(lengua|gram[áa]tica|ortograf|comentario|historia|geograf|sociales|cultura|ingl[eé]s|english|comunic)/i.test(lowerText)) {
        subject = 'ambito_linguistico'
      }
    }

    // Detección de dificultad
    let difficulty = 'intermedio'
    if (/(b[aá]sico|f[aá]cil|facil)/i.test(lowerText)) difficulty = 'basico'
    if (/(avanzad|dif[ií]cil|dificil)/i.test(lowerText)) difficulty = 'avanzado'

    // Detección robusta de la cantidad de preguntas
    const defaultCount = 10
    const numbers = Array.from(text.matchAll(/\d+/g)).map((m) => ({ value: parseInt(m[0], 10), index: m.index ?? 0 }))

    let count = defaultCount
    if (numbers.length > 0) {
      // Preferir números cerca de palabras tipo 'pregunta', 'ejercicio', 'examen'
      const questionWords = /\b(pregunta|preguntas|ejercicio|ejercicios|problema|problemas|test|examen|ejercicios)\b/i
      const optionWords = /\b(opcion|opciones|respuesta|respuestas)\b/i

      const nearQuestion = numbers.find((n) => {
        const start = Math.max(0, n.index - 30)
        const ctx = text.slice(start, n.index + 30)
        return questionWords.test(ctx) && !optionWords.test(ctx)
      })

      if (nearQuestion) {
        count = nearQuestion.value
      } else {
        // Si no hay número claramente ligado a preguntas, tomar el primer número que no esté ligado a 'opciones'
        const nonOption = numbers.find((n) => {
          const start = Math.max(0, n.index - 30)
          const ctx = text.slice(start, n.index + 30)
          return !optionWords.test(ctx)
        })
        if (nonOption) count = nonOption.value
        else count = Math.max(...numbers.map((n) => n.value))
      }
    }

    // Limitar rango razonable
    count = Math.min(Math.max(Number(count) || defaultCount, 5), 30)

    return {
      isExam: true,
      config: { subject, difficulty, count, topic },
    }
  }

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    // Detectar si es una solicitud de examen
    const examDetection = detectExamRequest(textToSend)
    if (examDetection.isExam) {
      // Agregar mensaje del usuario
      const userMessage: Message = {
        role: "user",
        content: textToSend,
        timestamp: new Date(),
      }
      setMessages([...messages, userMessage])
      setInput("")
      
      // Activar modo examen
      setExamConfig(examDetection.config)
      setExamMode('active')
      return
    }

    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          scope: selectedScope,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener respuesta")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      
      // Guardar conversación después de cada intercambio
      await saveConversation(finalMessages)
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleExampleClick = (question: string) => {
    sendMessage(question)
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleDeleteCurrentConversation = async () => {
    if (!conversationId || !onDeleteConversation) return
    const deleted = await onDeleteConversation(conversationId)
    if (deleted) {
      setMessages([])
      onConversationSaved()
    }
  }

  const handleExamComplete = (results: any) => {
    setExamResults(results)
    setExamMode('results')
    
    // Agregar resumen al chat
    // Calcular correctas solamente entre preguntas autocorregibles
    let correctCount = 0
    let gradedCount = 0
    results.questions.forEach((q: any, idx: number) => {
      const ans = results.userAnswers[idx]
      if (q.options && q.options.length > 0) {
        gradedCount++
        if (typeof ans === 'number' && q.options[ans]?.isCorrect) correctCount++
      }
    })

    const summaryMessage: Message = {
      role: "assistant",
      content: `✅ **Examen completado!**\n\n**Puntuación:** ${results.score}% (${results.score >= 50 ? 'Aprobado' : 'No aprobado'})\n**Nota de Media:** ${((results.score / 100) * 10).toFixed(2)} / 10\n\nHas respondido correctamente ${correctCount} de ${gradedCount} preguntas autocorregibles (y ${results.questions.length - gradedCount} preguntas abiertas pendientes de corrección).\n\n¿Quieres repasar algún concepto específico?`,
      timestamp: new Date(),
    }
    
    const updatedMessages = [...messages, summaryMessage]
    setMessages(updatedMessages)
    saveConversation(updatedMessages)
  }

  const handleBackToChat = () => {
    setExamMode('none')
    setExamConfig(null)
    setExamResults(null)
    onConversationSaved()
  }

  const handleNewExam = () => {
    setExamMode('none')
    setExamResults(null)
    setExamConfig(null)
  }

  // Renderizar examen si está activo
  if (examMode === 'active' && examConfig) {
    return (
      <InteractiveExam
        config={examConfig}
        onComplete={handleExamComplete}
        onCancel={handleBackToChat}
      />
    )
  }

  // Renderizar resultados si está en modo resultados
  if (examMode === 'results' && examResults) {
    return (
      <ExamResultsView
        results={examResults}
        onNewExam={handleNewExam}
        onBackToChat={handleBackToChat}
      />
    )
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
      {isLoadingConversation ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Área de Mensajes */}
            <div className="flex-1 min-h-0 p-6 space-y-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                  Selecciona un ámbito para Acceso IA:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SCOPE_OPTIONS.map((scope) => (
                    <button
                      key={scope.value}
                      onClick={() => setSelectedScope(scope.value)}
                      className={cn(
                        "rounded-2xl p-4 text-left border transition-all pointer-events-auto",
                        selectedScope === scope.value
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{scope.emoji}</span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{scope.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{scope.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {conversationId && onDeleteConversation && (
              <div className="max-w-4xl mx-auto flex justify-end">
                <button
                  onClick={handleDeleteCurrentConversation}
                  className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-500 transition-colors"
                >
                  Eliminar chat actual
                </button>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-12 rounded-3xl mb-8 max-w-2xl">
                  <Bot className="w-20 h-20 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                    ¡Hola! Soy Acceso IA 👋
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center text-lg">
                    Tu tutor personal para preparar la prueba de acceso a Grado Medio.
                    Elige un ámbito y pregúntame dentro de él: lingüístico-social o científico-matemático.
                  </p>
                </div>

                {/* Acciones Rápidas */}
                <div className="w-full max-w-3xl mb-6">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    ⚡ Acciones rápidas:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all group"
                      >
                        <action.icon className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preguntas de ejemplo */}
                <div className="w-full max-w-3xl">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    💡 Preguntas de ejemplo:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EXAMPLE_QUESTIONS.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(question.text)}
                        className="text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 rounded-xl border border-purple-200/50 dark:border-purple-500/20 transition-all group"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{question.emoji}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                            {question.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {message.role === "assistant" && (
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl h-fit flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700",
                        message.role === "user"
                          ? "bg-slate-900 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] font-semibold">
                        <span className={message.role === "user" ? "text-blue-200" : "text-purple-600 dark:text-purple-300"}>
                          {message.role === "user" ? userLabel : "AccesoIA"}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">
                          {message.timestamp.toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2.5 rounded-xl h-fit flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                </div>
                ))}
              </AnimatePresence>
            )}

            {isLoading && (
              <div className="flex gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl h-fit">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Pensando...
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input del Chat */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta aquí... (Shift + Enter para nueva línea)"
                  className="flex-1 resize-none rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white placeholder:text-slate-400 min-h-[60px] max-h-[200px]"
                  rows={1}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg flex items-center gap-2 font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      <span className="hidden sm:inline">Enviar</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Acceso IA usa IA y puede cometer errores. Verifica información importante. Las conversaciones se guardan automáticamente.
              </p>
            </div>
          </div>
        </>
      )}
      </motion.div>
    </div>
  )
}
