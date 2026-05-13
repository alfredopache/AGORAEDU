"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { MessageSquare, GraduationCap, Menu, X, ArrowUpRight, Shuffle } from "lucide-react"
import { motion as motionBase, AnimatePresence } from "framer-motion"

const motion = motionBase as any
import { cn } from "@/lib/utils"
import { ChatMode } from "./chat-mode"
import { ExamMode } from "./exam-mode"
import { ConversationSidebar } from "./conversation-sidebar"
import { StreakBadge } from "@/components/streak-badge"
import { DEFAULT_EDUIA_PLAN, EDUIA_PLAN_STORAGE_KEY, getEduIAPlan, type EduIAPlanId } from "@/lib/eduia-plans"

type Mode = "chat" | "exam"

export interface Conversation {
  _id: string
  title: string
  createdAt: string
  subject?: string
  messageCount: number
}

export function EduIAMainLayout() {
  const [mode, setMode] = useState<Mode>("chat")
  const [selectedPlanId, setSelectedPlanId] = useState<EduIAPlanId>(DEFAULT_EDUIA_PLAN)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; title?: string } | null>(null)

  // Generar session ID único
  useEffect(() => {
    const stored = localStorage.getItem("eduia-session-id")
    if (stored) {
      setSessionId(stored)
    } else {
      const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("eduia-session-id", newId)
      setSessionId(newId)
    }
  }, [])

  // Cargar conversaciones del usuario
  useEffect(() => {
    if (sessionId) {
      loadConversations(sessionId)
    }
  }, [sessionId])

  useEffect(() => {
    if (typeof window === "undefined") return
    const host = window.location.hostname
    setIsLocalhost(host === "localhost" || host === "127.0.0.1")

    const storedPlan = window.localStorage.getItem(EDUIA_PLAN_STORAGE_KEY)
    if (storedPlan === "education" || storedPlan === "university" || storedPlan === "master") {
      setSelectedPlanId(storedPlan)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== EDUIA_PLAN_STORAGE_KEY) return
      const nextPlan = event.newValue
      if (nextPlan === "education" || nextPlan === "university" || nextPlan === "master") {
        setSelectedPlanId(nextPlan)
      }
    }

    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const activePlan = getEduIAPlan(selectedPlanId)
  const planOrder: EduIAPlanId[] = ["education", "university", "master"]

  const cyclePlan = () => {
    if (typeof window === "undefined") return
    const host = window.location.hostname
    if (!(host === "localhost" || host === "127.0.0.1")) {
      try { alert('La selección de plan solo está disponible en localhost para pruebas.') } catch {}
      return
    }
    const idx = planOrder.indexOf(selectedPlanId)
    const next = planOrder[(idx + 1) % planOrder.length]
    try { localStorage.setItem(EDUIA_PLAN_STORAGE_KEY, next) } catch {}
    setSelectedPlanId(next)
  }

  const loadConversations = async (sid?: string) => {
    const id = sid || sessionId
    if (!id) return
    try {
      const response = await fetch(`/api/conversations?sessionId=${id}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      // silently ignore aborted requests (e.g. during HMR or component unmount)
    }
  }

  const handleNewChat = () => {
    setCurrentConversationId(null)
    setMode("chat")
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId)
    setMode("chat")
    setSidebarOpen(false)
  }

  const handleConversationSaved = async (conversationId?: string | null) => {
    await loadConversations()
    if (conversationId) {
      setCurrentConversationId(conversationId)
    }
  }

  const openDeleteConfirmation = (conversationId: string, title?: string) => {
    setDeleteCandidate({ id: conversationId, title })
  }

  const cancelDeleteConversation = () => {
    setDeleteCandidate(null)
  }

  const confirmDeleteConversation = async () => {
    if (!deleteCandidate) return
    const conversationId = deleteCandidate.id
    setDeleteCandidate(null)

    try {
      const response = await fetch(`/api/conversations?id=${conversationId}&sessionId=${sessionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null)
        }
        loadConversations()
      } else {
        const data = await response.json()
        alert(data?.error || 'Error borrando conversación')
      }
    } catch (err) {
      console.error('Error borrando conversación:', err)
      alert('Error borrando conversación')
    }
  }

  return (
    <div className="relative h-full bg-transparent overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar Desktop */}
        <aside 
          className={cn(
            "hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 overflow-y-auto",
            isSidebarCollapsed ? "w-0 border-none overflow-hidden" : "w-80"
          )}
        >
          {!isSidebarCollapsed && (
            <ConversationSidebar
              conversations={conversations}
              currentConversationId={currentConversationId}
              sessionId={sessionId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onRefresh={loadConversations}
              onDeleteConversation={openDeleteConfirmation}
            />
          )}
        </aside>

        {/* Botón para colapsar/expandir sidebar (Desktop) - MOVIDO ARRIBA */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute left-0 top-20 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-r-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          style={{ transform: isSidebarCollapsed ? 'translateX(0)' : 'translateX(320px)' }}
        >
          {isSidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>

        {/* Sidebar Mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-80 z-50 bg-white dark:bg-slate-900 shadow-2xl"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="font-bold text-lg">Historial</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ConversationSidebar
                  conversations={conversations}
                  currentConversationId={currentConversationId}
                  sessionId={sessionId}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  onRefresh={loadConversations}
                  onDeleteConversation={openDeleteConfirmation}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Header con modo selector */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>
                  <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                      <span className="text-2xl">🤖</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="font-bold text-xl text-slate-900 dark:text-white">Acceso IA</h1>
                          <span className={cn("inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white shadow-sm", activePlan.id === "university" ? "from-cyan-500 to-blue-600" : activePlan.id === "master" ? "from-amber-400 to-red-500" : "from-fuchsia-500 to-pink-500")}>{activePlan.name}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Asistente Educativo</p>
                      </div>

                      <button
                        onClick={cyclePlan}
                        disabled={!isLocalhost}
                        title={isLocalhost ? `Cambiar plan (actual: ${activePlan.name})` : "Cambio de plan: disponible solo en localhost para pruebas"}
                        className={cn(
                          "ml-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition",
                          isLocalhost ? "bg-white text-slate-700 hover:shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        <Shuffle className="w-4 h-4" />
                        <span className="hidden sm:inline">Alternar plan</span>
                      </button>
                    </div>
                  <Link
                    href="/eduia/mejorar"
                    className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
                  >
                    Mejorar
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Racha y Selector de Modo */}
              <div className="flex items-center gap-3">
              <StreakBadge />
              <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setMode("chat")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                    mode === "chat"
                      ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button
                  onClick={() => setMode("exam")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                    mode === "exam"
                      ? "bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Simulacro</span>
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-hidden pb-16 lg:pb-0">
            <AnimatePresence mode="wait">
              {mode === "chat" ? (
                <ChatMode
                  key="chat"
                  sessionId={sessionId}
                  conversationId={currentConversationId}
                  selectedPlanId={selectedPlanId}
                  onConversationSaved={handleConversationSaved}
                  onDeleteConversation={openDeleteConfirmation}
                />
              ) : (
                <ExamMode
                  key="exam"
                  sessionId={sessionId}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-2">
            <div className="flex items-center justify-around max-w-xs mx-auto">
              <button
                onClick={() => setMode("chat")}
                className={cn(
                  "flex flex-col items-center gap-1 px-8 py-2 rounded-2xl transition-all",
                  mode === "chat" ? "text-purple-600 dark:text-purple-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                <MessageSquare className={cn("w-5 h-5 transition-transform", mode === "chat" && "scale-110")} />
                <span className="text-[10px] font-semibold">Chat</span>
              </button>
              <button
                onClick={() => setMode("exam")}
                className={cn(
                  "flex flex-col items-center gap-1 px-8 py-2 rounded-2xl transition-all",
                  mode === "exam" ? "text-pink-600 dark:text-pink-400" : "text-slate-400 dark:text-slate-500"
                )}
              >
                <GraduationCap className={cn("w-5 h-5 transition-transform", mode === "exam" && "scale-110")} />
                <span className="text-[10px] font-semibold">Simulacro</span>
              </button>
            </div>
          </nav>
        </main>
      </div>

      <AnimatePresence>
        {deleteCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-950/95 border border-slate-800 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Confirmar eliminación</h3>
              <p className="text-sm text-slate-300 mb-4">Esta conversación se eliminará de forma permanente y no podrás recuperarla.</p>
              {deleteCandidate.title ? (
                <p className="text-sm text-slate-400 mb-4 truncate">"{deleteCandidate.title}"</p>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={cancelDeleteConversation}
                  className="w-full sm:w-auto rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteConversation}
                  className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 transition"
                >
                  Eliminar conversación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
