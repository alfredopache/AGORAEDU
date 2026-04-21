"use client"

import { motion as motionBase } from "framer-motion"
import { ArrowRight, Rocket, Mail, Instagram } from "lucide-react"

const motion = motionBase as any
import Link from "next/link"
import { useEffect, useState } from "react"
import { DataNodes } from "@/components/ui/data-nodes" 
import { FloatingCards } from "@/components/ui/floating-cards"

export const dynamic = 'force-dynamic'

interface HeroClientProps {
  sanityCards: any[]
}

export function HeroClient({ sanityCards }: HeroClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  return (
    <section 
      id="home" 
      className="relative flex min-h-screen items-start md:items-center justify-center overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500 pt-24 md:pt-0"
    >
      
      {/* --- CAPAS DE FONDO (BACKGROUND) --- */}
      {/* Cuadrícula técnica con perspectiva */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] dark:opacity-25 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 30%, transparent 100%)',
          transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) scale(2)',
        }}
      />

      {/* Escáner láser animado */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 dark:via-indigo-400/30 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          animate={{ top: ["-10%", "110%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute' }}
        />
      </div>

      {/* Luces de ambiente (Glow) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px] dark:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-300/20 dark:bg-indigo-600/10 rounded-full blur-[100px] dark:blur-[140px]" />
      </div>

      {/* Componentes de Interacción de Fondo */}
      <DataNodes />
      <FloatingCards data={sanityCards} />

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 md:py-16 text-center mt-10 md:mt-0">
        
        {/* Badge Superior */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-[0.2em] mb-8 md:mb-12 shadow-sm"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
          Formación Profesional
        </motion.div>
        
        {/* Título Principal */}
        <h1 className="text-5xl font-bold leading-[1.1] text-slate-900 dark:text-white md:text-8xl lg:text-9xl font-serif tracking-tighter">
          Agora<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-500">Edu</span>
        </h1>
        
        {/* Descripción */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mx-auto mt-6 md:mt-8 max-w-2xl text-base md:text-2xl leading-relaxed text-slate-600 dark:text-slate-400 font-sans"
        >
          Un laboratorio de ideas para reinventar la Formación Profesional, donde la innovación, la tecnología y la Inteligencia Artificial se convierten en herramientas para crear oportunidades reales.
        </motion.p>

        {/* --- BOTONES DE ACCIÓN --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          // mt-12 en móvil para dar aire, mt-16 en escritorio. z-30 para estar sobre el canvas.
          className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-30"
        >
          <Link href="/proyectos" className="w-full sm:w-auto">
            <button className="group relative w-full sm:w-44 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer">
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base">
                Proyectos
                <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </span>
            </button>
          </Link>
          
          <Link href="/blog" className="w-full sm:w-auto">
            <button className="group relative w-full sm:w-44 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 active:scale-95 cursor-pointer">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(99,102,241,0.15)] pointer-events-none" />
              
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base">
                Blog
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </motion.div>
              </span>
            </button>
          </Link>
        </motion.div>

        {/* --- SECCIÓN DE CONTACTO --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 relative z-30"
        >
          <a 
            href="mailto:somosagoraedu@gmail.com"
            className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-300 group"
          >
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">somosagoraedu@gmail.com</span>
          </a>

          <a 
            href="https://instagram.com/agoraedu__"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 text-slate-700 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-all duration-300 group"
          >
            <Instagram className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">@agoraedu__</span>
          </a>
        </motion.div>
      </div>

      {/* Degradado inferior para suavizar la transición al scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent z-20 pointer-events-none" />
    </section>
  )
}