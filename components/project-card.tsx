"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Calendar } from "lucide-react"
import { Project } from "@/content/projects"
import { DynamicIcon } from "./dynamic-icon"

interface Props {
  entry: Project
  index: number
}

export function ProjectCard({ entry, index }: Props) {
  const router = useRouter()

  const handleDoubleClick = () => {
    router.push(`/proyectos/${entry.slug}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative flex flex-col h-full 
        /* Glassmorphism sutil */
        bg-white/70 dark:bg-slate-900/40 
        backdrop-blur-md 
        rounded-[2rem] 
        border border-slate-200/60 dark:border-white/10 
        
        /* Elevación y Sombra */
        shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
        hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] 
        transition-all duration-500 cursor-pointer 
        hover:-translate-y-2
      `}
    >
      {/* Resplandor de fondo al hacer hover (conecta con las auroras) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* 1. Contenedor de Imagen */}
      <div className="relative aspect-16/10 overflow-hidden shrink-0 m-2 rounded-[1.5rem]">
        <Image
          src={entry.image || "/placeholder.svg"}
          alt={entry.title}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        {/* Overlay de cristal en la imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        {/* Badges con Glassmorphism total */}
        <div className="absolute top-3 left-3 flex gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 shadow-xl">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
            </span>
            {entry.category || "Estrategia"}
          </div>
        </div>
      </div>

      {/* 2. Contenido de la Card */}
      <div className="p-6 pt-4 flex flex-col grow relative z-10">
        <div className="flex items-center gap-3 mb-4 text-slate-400 dark:text-slate-500">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <Calendar className="w-3 h-3 text-blue-500" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{entry.date}</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
          {entry.title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400/80 mb-6 line-clamp-3 leading-relaxed grow">
          {entry.excerpt}
        </p>

        {/* 3. Ficha Técnica y Botón */}
        <div className="mt-auto space-y-6">
          {entry.specs && entry.specs.length > 0 && (
            <div className="flex flex-wrap gap-4 pt-5 border-t border-slate-200/50 dark:border-white/5">
              {entry.specs.slice(0, 2).map((spec: any, i: number) => (
                <div key={i} className="flex items-center gap-2 group/spec">
                  <div className="p-1 rounded-md bg-blue-500/5 group-hover/spec:bg-blue-500/10 transition-colors">
                    <DynamicIcon name={spec.icon} className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            href={`/proyectos/${entry.slug}`}
            className="flex items-center justify-between w-full p-1 group/btn"
          >
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover/btn:text-blue-500 transition-colors">
              Ver Proyecto
            </span>
            <div className="h-10 w-10 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 group-hover/btn:scale-110 group-hover/btn:bg-blue-600 dark:group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-all duration-300 shadow-lg">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}