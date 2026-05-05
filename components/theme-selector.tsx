"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { motion, AnimatePresence } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function ThemeSelector({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn("h-9 w-9 rounded-full bg-transparent border border-transparent", className)} />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        // Quitamos cualquier estilo previo y definimos la base
        "relative h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300",
        "border-none border-slate-200 dark:border-white/10", // Borde sutil
        "bg-transparent hover:bg-slate-100 dark:hover:bg-white/5", // Fondo solo en hover
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        className
      )}
      aria-label="Cambiar tema"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-[1.2rem] w-[1.2rem] text-blue-400 fill-blue-400/10" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 fill-yellow-500/10" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  )
}