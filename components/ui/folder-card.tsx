"use client"

import { motion } from "framer-motion"
import { Folder, ArrowUpRight, BookOpen, Rocket, FileText, Video, Mic, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { Carpeta } from "@/content/carpetas"

// 🔄 Sincronizado con los nombres exactos de tus nuevos esquemas
const getIconForType = (type: string) => {
  switch (type) {
    case 'blog':
    case 'post': 
      return <BookOpen className="w-3.5 h-3.5 text-amber-500" />
    case 'project': 
      return <Rocket className="w-3.5 h-3.5 text-blue-500" />
    case 'recursoArchivo': 
      return <FileText className="w-3.5 h-3.5 text-emerald-500" />
    case 'podcast': 
      return <Mic className="w-3.5 h-3.5 text-red-500" />
    case 'recursoImagen': 
      return <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
    default: 
      return <FileText className="w-3.5 h-3.5 text-slate-400" />
  }
}

// 🎨 Paleta extendida con todos los nuevos colores
const colorVariants: Record<string, { badge: string; hoverText: string }> = {
  blue: { badge: "border-blue-500/20 bg-blue-500/5 text-blue-400", hoverText: "group-hover:text-blue-500 dark:group-hover:text-blue-400" },
  indigo: { badge: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400", hoverText: "group-hover:text-indigo-500 dark:group-hover:text-indigo-400" },
  cyan: { badge: "border-cyan-500/20 bg-cyan-500/5 text-cyan-400", hoverText: "group-hover:text-cyan-500 dark:group-hover:text-cyan-400" },
  purple: { badge: "border-purple-500/20 bg-purple-500/5 text-purple-400", hoverText: "group-hover:text-purple-500 dark:group-hover:text-purple-400" },
  emerald: { badge: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400", hoverText: "group-hover:text-emerald-500 dark:group-hover:text-emerald-400" },
  
  /* Nuevos colores asignados */
  violet: { badge: "border-violet-500/20 bg-violet-500/5 text-violet-400", hoverText: "group-hover:text-violet-500 dark:group-hover:text-violet-400" },
  fuchsia: { badge: "border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-400", hoverText: "group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400" },
  pink: { badge: "border-pink-500/20 bg-pink-500/5 text-pink-400", hoverText: "group-hover:text-pink-500 dark:group-hover:text-pink-400" },
  rose: { badge: "border-rose-500/20 bg-rose-500/5 text-rose-400", hoverText: "group-hover:text-rose-500 dark:group-hover:text-rose-400" },
  amber: { badge: "border-amber-500/20 bg-amber-500/5 text-amber-400", hoverText: "group-hover:text-amber-500 dark:group-hover:text-amber-400" },
  orange: { badge: "border-orange-500/20 bg-orange-500/5 text-orange-400", hoverText: "group-hover:text-orange-500 dark:group-hover:text-orange-400" },
  red: { badge: "border-red-500/20 bg-red-500/5 text-red-400", hoverText: "group-hover:text-red-500 dark:group-hover:text-red-400" },
}

export function FolderCard({ carpeta }: { carpeta: Carpeta }) {
  const currentStyles = colorVariants[carpeta.color] || colorVariants.blue
  const totalItems = carpeta.items?.length || 0

  return (
    <div className="group relative flex flex-col min-h-[220px] rounded-2xl border transition-all duration-300 pointer-events-auto backdrop-blur-md bg-white/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1">
      
      {/* Pestaña superior del archivador de la carpeta */}
      <div className="absolute -top-[12px] left-6 h-[13px] w-24 rounded-t-lg border-t border-x border-inherit bg-white dark:bg-slate-950 z-0" />

      <div className="relative z-10 p-6 flex flex-col flex-grow">
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl border transition-colors duration-300 ${currentStyles.badge}`}>
            <Folder className="w-6 h-6 fill-current/10" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {totalItems} {totalItems === 1 ? 'elemento' : 'elementos'}
          </span>
        </div>

        {/* Títulos - Ahora cambian al color respectivo de la carpeta en Hover */}
        <h3 className={`text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300 ${currentStyles.hoverText}`}>
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