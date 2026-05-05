"use client"

import { useState, useEffect } from "react"
import { MessageSquare, GraduationCap, Menu, X } from "lucide-react"
import { motion as motionBase, AnimatePresence } from "framer-motion"

const motion = motionBase as any
import { cn } from "@/lib/utils"
import { ChatMode } from "./chat-mode"
import { ExamMode } from "./exam-mode"
import { ConversationSidebar } from "./conversation-sidebar"
import { StreakBadge } from "@/components/streak-badge"

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
    <div className="relative min-h-screen bg-transparent">
      <div className="min-h-screen flex">
        {/* Sidebar Desktop */}
        <aside 
          className={cn(
            "hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 relative",
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
        <main className="flex-1 min-h-0 flex flex-col">
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
                  <div>
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white">Acceso IA</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Asistente Educativo</p>
                  </div>
                </div>
              </div>

              {/* Racha y Selector de Modo */}
              <div className="flex items-center gap-3">
              <StreakBadge />
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {mode === "chat" ? (
                <ChatMode
                  key="chat"
                  sessionId={sessionId}
                  conversationId={currentConversationId}
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
