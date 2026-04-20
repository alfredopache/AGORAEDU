"use client"

import { useState, useEffect } from "react"
import { MessageSquare, GraduationCap, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChatMode } from "./chat-mode"
import { ExamMode } from "./exam-mode"
import { ConversationSidebar } from "./conversation-sidebar"

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
  const [sessionId, setSessionId] = useState<string>("")

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
      loadConversations()
    }
  }, [sessionId])

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Error cargando conversaciones:", error)
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

  const handleConversationSaved = () => {
    loadConversations()
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 pt-20">
      <div className="h-full flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onRefresh={loadConversations}
          />
        </aside>

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
                  onSelectConversation={handleSelectConversation}
                  onNewChat={handleNewChat}
                  onRefresh={loadConversations}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
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
                    <h1 className="font-bold text-xl text-slate-900 dark:text-white">EduIA</h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Asistente Educativo</p>
                  </div>
                </div>
              </div>

              {/* Selector de Modo */}
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
                  <span className="hidden sm:inline">Examen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {mode === "chat" ? (
                <ChatMode
                  key="chat"
                  sessionId={sessionId}
                  conversationId={currentConversationId}
                  onConversationSaved={handleConversationSaved}
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
    </div>
  )
}
