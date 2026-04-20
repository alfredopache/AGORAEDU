"use client"

import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import { useMemo, useEffect, useState } from "react"

// Mapeo de iconos (se mantiene igual)
const ICON_MAP: Record<string, React.ReactNode> = {
  brain: <Icons.BrainCircuit className="w-5 h-5 text-purple-500" />,
  sparkles: <Icons.Sparkles className="w-5 h-5 text-amber-500" />,
  rocket: <Icons.Rocket className="w-5 h-5 text-orange-500" />,
  users: <Icons.Users className="w-5 h-5 text-blue-500" />,
  user: <Icons.User className="w-5 h-5 text-slate-500" />,
  graduation: <Icons.GraduationCap className="w-5 h-5 text-indigo-500" />,
  book: <Icons.Book className="w-5 h-5 text-emerald-500" />,
  presentation: <Icons.Presentation className="w-5 h-5 text-pink-500" />,
  file: <Icons.FileText className="w-5 h-5 text-slate-400" />,
  code: <Icons.Code className="w-5 h-5 text-blue-600" />,
  monitor: <Icons.Monitor className="w-5 h-5 text-cyan-500" />,
  database: <Icons.Database className="w-5 h-5 text-indigo-600" />,
  key: <Icons.Key className="w-5 h-5 text-yellow-500" />,
  lightbulb: <Icons.Lightbulb className="w-5 h-5 text-amber-400" />,
  target: <Icons.Target className="w-5 h-5 text-red-500" />,
  'bar-chart': <Icons.BarChart3 className="w-5 h-5 text-blue-500" />,
  'line-chart': <Icons.LineChart className="w-5 h-5 text-violet-500" />,
  briefcase: <Icons.Briefcase className="w-5 h-5 text-brown-500" />,
  calculator: <Icons.Calculator className="w-5 h-5 text-emerald-600" />,
  clock: <Icons.Clock className="w-5 h-5 text-slate-500" />,
  calendar: <Icons.Calendar className="w-5 h-5 text-rose-500" />,
  zap: <Icons.Zap className="w-5 h-5 text-yellow-400" />,
  map: <Icons.Map className="w-5 h-5 text-green-500" />,
  settings: <Icons.Settings className="w-5 h-5 text-slate-600" />,
  laptop: <Icons.Laptop className="w-5 h-5 text-blue-400" />,
}

export function FloatingCards({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const cards = useMemo(() => {
    if (!mounted || !data) return []
    
    // SECTORES AJUSTADOS: 
    // lMin/lMax reducidos en los laterales para evitar desbordamiento.
    // tMin/tMax ajustados para mantener cercanía visual al centro.
    const sectors = [
      { id: 'top-left',     tMin: 12, tMax: 25, lMin: 8,  lMax: 22 },
      { id: 'top-right',    tMin: 15, tMax: 28, lMin: 72, lMax: 84 }, // Bajado de 90 a 84
      { id: 'bottom-left',  tMin: 68, tMax: 82, lMin: 10, lMax: 24 },
      { id: 'bottom-right', tMin: 65, tMax: 78, lMin: 70, lMax: 85 }, // Bajado de 90 a 85
      { id: 'mid-left',     tMin: 40, tMax: 55, lMin: 5,  lMax: 18 },
      { id: 'mid-right',    tMin: 38, tMax: 52, lMin: 75, lMax: 85 }, // Bajado de 95 a 85
    ];

    return data.map((item, index) => {
      const sector = sectors[index % sectors.length];
      
      const randomTop = Math.floor(Math.random() * (sector.tMax - sector.tMin)) + sector.tMin;
      const randomLeft = Math.floor(Math.random() * (sector.lMax - sector.lMin)) + sector.lMin;
      
      return {
        ...item,
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
        duration: Math.random() * 2 + 5,
        delay: index * 0.5,
      }
    })
  }, [mounted, data])

  if (!mounted || !data) return null

  return (
    <>
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="absolute z-20 pointer-events-none hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl 
                     bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 
                     dark:border-white/10 text-slate-900 dark:text-white shadow-xl 
                     transition-colors duration-300"
          style={{ top: card.top, left: card.left }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -15, 0] }}
          transition={{
            y: { 
              duration: card.duration, 
              repeat: Infinity, 
              repeatType: "reverse", // Añadido para un rebote más suave
              ease: "easeInOut", 
              delay: card.delay 
            },
            opacity: { duration: 0.8, delay: card.delay * 0.5 }
          }}
        >
          <div className="flex items-center justify-center p-1.5 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/30 dark:border-white/5">
            {ICON_MAP[card.icon] || <Icons.Sparkles className="w-5 h-5 text-blue-400" />}
          </div>
          <span className="font-semibold text-sm whitespace-nowrap tracking-tight">
            {card.title}
          </span>
        </motion.div>
      ))}
    </>
  )
}