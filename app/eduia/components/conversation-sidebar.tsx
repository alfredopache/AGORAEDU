"use client"

import { Plus, MessageSquare, Trash2, RefreshCw } from "lucide-react"
import { motion as motionBase } from "framer-motion"
import { cn } from "@/lib/utils"

const motion = motionBase as any
import { Conversation } from "./main-layout"

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onRefresh: () => void
}

const SUBJECT_COLORS = {
  lengua: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  matematicas: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  ingles: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sociales: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
}

const SUBJECT_EMOJI = {
  lengua: "📝",
  matematicas: "🔢",
  ingles: "🌍",
  sociales: "🌐",
  general: "💬",
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onRefresh,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl p-3 flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Nuevo Chat
        </button>
      </div>

      {/* Lista de Conversaciones */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay conversaciones aún</p>
            <p className="text-xs mt-1">Inicia un nuevo chat</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <motion.button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation._id)}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all border",
                currentConversationId === conversation._id
                  ? "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-500/50 shadow-sm"
                  : "bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">
                  {SUBJECT_EMOJI[conversation.subject as keyof typeof SUBJECT_EMOJI] || "💬"}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {conversation.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {conversation.subject && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          SUBJECT_COLORS[conversation.subject as keyof typeof SUBJECT_COLORS] || SUBJECT_COLORS.general
                        )}
                      >
                        {conversation.subject}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(conversation.createdAt).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>
    </div>
  )
}
