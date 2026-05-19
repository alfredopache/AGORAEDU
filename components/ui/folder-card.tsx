"use client"

import { motion } from "framer-motion"
import { Folder, ArrowUpRight, BookOpen, Rocket, FileText, Video } from "lucide-react"
import Link from "next/link"
import { Carpeta } from "@/content/carpetas"

// Función para renderizar el icono adecuado según el tipo de contenido referenciado
const getIconForType = (type: string) => {
  switch (type) {
    case 'blog': return <BookOpen className="w-3.5 h-3.5 text-amber-500" />
    case 'project': return <Rocket className="w-3.5 h-3.5 text-blue-500" />
    case 'resource': return <FileText className="w-3.5 h-3.5 text-emerald-500" />
    case 'multimedia': return <Video className="w-3.5 h-3.5 text-purple-500" />
    default: return <FileText className="w-3.5 h-3.5 text-slate-400" />
  }
}

// Mapeo de colores dinámicos adaptados a oklch / Tailwind v4
const colorVariants: Record<string, string> = {
  blue: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 text-blue-400",
  indigo: "border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40 text-indigo-400",
  cyan: "border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 text-cyan-400",
  purple: "border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 text-purple-400",
  emerald: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 text-emerald-400",
}

export function FolderCard({ carpeta }: { carpeta: Carpeta }) {
  const colorClass = colorVariants[carpeta.color] || colorVariants.blue
  const totalItems = carpeta.items?.length || 0

  return (
    <div className="group relative flex flex-col min-h-[220px] rounded-2xl border transition-all duration-300 pointer-events-auto backdrop-blur-md bg-white/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1">
      
      {/* Pestaña superior del archivador de la carpeta */}
      <div className={`absolute -top-[12px] left-6 h-[13px] w-24 rounded-t-lg border-t border-x border-inherit bg-white dark:bg-slate-950 z-0`} />

      <div className="relative z-10 p-6 flex flex-col flex-grow">
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl border ${colorClass}`}>
            <Folder className="w-6 h-6 fill-current/10" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {totalItems} {totalItems === 1 ? 'elemento' : 'elementos'}
          </span>
        </div>

        {/* Títulos */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors">
          {carpeta.title}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 flex-grow">
          {carpeta.description || "Sin descripción proporcionada."}
        </p>

        {/* Mini Preview de los elementos vinculados internos */}
        {totalItems > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
            {carpeta.items.slice(0, 2).map((item) => (
              <div key={item._id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                {getIconForType(item._type)}
                <span className="truncate">{item.title}</span>
              </div>
            ))}
            {totalItems > 2 && (
              <span className="text-[11px] text-slate-400 block pt-0.5">
                + {totalItems - 2} más...
              </span>
            )}
          </div>
        )}

        {/* Enlace de Acción */}
        <Link href={`/carpetas/${carpeta.slug}`} className="absolute inset-0 z-20" aria-label={`Ver carpeta ${carpeta.title}`} />
      </div>
    </div>
  )
}