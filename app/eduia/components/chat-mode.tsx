"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, User, Sparkles, BookOpen, Lightbulb } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
  onConversationSaved: () => void
}

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

export function ChatMode({ sessionId, conversationId, onConversationSaved }: ChatModeProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Estados para examen interactivo
  const [examMode, setExamMode] = useState<'none' | 'active' | 'results'>('none')
  const [examConfig, setExamConfig] = useState<any>(null)
  const [examResults, setExamResults] = useState<any>(null)

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
        onConversationSaved()
      }
    } catch (error) {
      console.error("Error guardando conversación:", error)
    }
  }

  const detectExamRequest = (text: string): { isExam: boolean; config?: any } => {
    const lowerText = text.toLowerCase()
    
    // Palabras clave para detectar examen
    const examKeywords = ['examen', 'prueba', 'test', 'evalua', 'evalúa', 'evaluame', 'hazme un examen', 'quiero un examen']
    const isExamRequest = examKeywords.some(keyword => lowerText.includes(keyword))
    
    if (!isExamRequest) return { isExam: false }

    // Detectar materia
    let subject = 'mixto'
    if (lowerText.includes('matemática') || lowerText.includes('mate') || lowerText.includes('número')) {
      subject = 'matematicas'
    } else if (lowerText.includes('lengua') || lowerText.includes('gramática') || lowerText.includes('ortografía')) {
      subject = 'lengua'
    } else if (lowerText.includes('inglés') || lowerText.includes('ingles') || lowerText.includes('english')) {
      subject = 'ingles'
    } else if (lowerText.includes('sociales') || lowerText.includes('historia') || lowerText.includes('geografía')) {
      subject = 'sociales'
    }

    // Detectar dificultad
    let difficulty = 'intermedio'
    if (lowerText.includes('básico') || lowerText.includes('basico') || lowerText.includes('fácil') || lowerText.includes('facil')) {
      difficulty = 'basico'
    } else if (lowerText.includes('avanzado') || lowerText.includes('difícil') || lowerText.includes('dificil')) {
      difficulty = 'avanzado'
    }

    // Detectar cantidad (buscar números)
    const numberMatch = text.match(/\d+/)
    const count = numberMatch ? Math.min(Math.max(parseInt(numberMatch[0]), 5), 30) : 10

    return {
      isExam: true,
      config: { subject, difficulty, count }
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

  const handleExamComplete = (results: any) => {
    setExamResults(results)
    setExamMode('results')
    
    // Agregar resumen al chat
    const summaryMessage: Message = {
      role: "assistant",
      content: `✅ **Examen completado!**\n\n**Puntuación:** ${results.score}% (${results.score >= 50 ? 'Aprobado' : 'No aprobado'})\n**Nota de Media:** ${((results.score / 100) * 10).toFixed(2)} / 10\n\nHas respondido correctamente ${results.userAnswers.filter((ans: number, idx: number) => results.questions[idx].options[ans]?.isCorrect).length} de ${results.questions.length} preguntas.\n\n¿Quieres repasar algún concepto específico?`,
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {isLoadingConversation ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 p-12 rounded-3xl mb-8 max-w-2xl">
                  <Bot className="w-20 h-20 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                    ¡Hola! Soy Acceso IA 👋
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-center text-lg">
                    Tu tutor personal para preparar la prueba de acceso a Grado Medio.
                    Pregúntame sobre Lengua, Matemáticas, Inglés o Ciencias Sociales.
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
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl h-fit flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl p-4 shadow-lg",
                        message.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={cn(
                          "text-xs mt-2 opacity-60",
                          message.role === "user" ? "text-white" : "text-slate-500"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-2.5 rounded-xl h-fit flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
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
  )
}
