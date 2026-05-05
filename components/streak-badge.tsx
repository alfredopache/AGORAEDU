"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"

interface StreakData {
  streak: number
  longestStreak: number
  totalPracticeDays: number
  loggedIn: boolean
  streakIncreased?: boolean
}

export function StreakBadge() {
  const { data: session } = useSession()
  const [data, setData] = useState<StreakData | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (!session?.user?.email) return

    // Llamar al POST para actualizar la racha al entrar
    const update = async () => {
      try {
        const res = await fetch('/api/streak', { method: 'POST' })
        if (!res.ok) return
        const json: StreakData = await res.json()
        setData(json)
        if (json.streakIncreased && json.streak > 1) {
          setShowPopup(true)
          setTimeout(() => setShowPopup(false), 3500)
        }
      } catch (e) {
        console.error('[StreakBadge]', e)
      }
    }

    update()
  }, [session?.user?.email])

  if (!data || !data.loggedIn) return null

  const streak = data.streak ?? 0
  const isHot = streak >= 3

  return (
    <div className="relative flex items-center">
      {/* Badge principal */}
      <button
        onClick={() => setShowTooltip((v) => !v)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-600/40 hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-all select-none"
        aria-label={`Racha de ${streak} días`}
      >
        <motion.span
          animate={isHot ? { scale: [1, 1.18, 1], rotate: [-5, 5, -5, 0] } : {}}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="text-lg leading-none"
        >
          🔥
        </motion.span>
        <span className="font-bold text-orange-700 dark:text-orange-300 text-sm tabular-nums">
          {streak}
        </span>
      </button>

      {/* Tooltip con detalles */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 z-50 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4"
          >
            <p className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Tu racha de práctica</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">🔥 Racha actual</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{streak} días</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">🏆 Mejor racha</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400 text-sm">{data.longestStreak} días</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600 dark:text-slate-400">📅 Total días</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">{data.totalPracticeDays} días</span>
              </div>
            </div>
            {streak === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Practica hoy para empezar tu racha 💪
              </p>
            )}
            {streak >= 7 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 font-medium">
                ¡Increíble! Llevas {streak} días seguidos 🔥
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup de racha aumentada */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
          >
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-bold text-lg leading-tight">¡Racha de {data.streak} días!</p>
              <p className="text-sm text-orange-100">Sigue así, ¡lo estás petando!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
