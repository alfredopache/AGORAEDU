"use client"

import { motion, AnimatePresence } from "@/lib/motion"
import { useEffect, useState } from "react"

export function ScrollCue() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    // 1. Definimos el temporizador de 10 segundos
    const timer = setTimeout(() => {
      // Solo lo mostramos si el usuario NO ha scrolleado aún
      if (!hasScrolled) {
        setIsVisible(true)
      }
    }, 7000) // 10000ms = 10 segundos

    // 2. Función para detectar si el usuario ya empezó a bajar
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setHasScrolled(true)
        setIsVisible(false)
        // Limpiamos el evento una vez que ya detectamos movimiento
        window.removeEventListener("scroll", handleScroll)
      }
    }

    window.addEventListener("scroll", handleScroll)

    // Limpieza al desmontar el componente
    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [hasScrolled])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 md:hidden z-30 pointer-events-none"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [0, 12, 0] 
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity,
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut"
            }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">
              Desliza
            </span>
            
            <div className="relative w-[2px] h-14 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ 
                  y: ["-100%", "100%"] 
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-full h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}