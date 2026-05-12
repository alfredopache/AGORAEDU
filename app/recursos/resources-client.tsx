"use client"

import { useState } from 'react'
import { 
  FileText, 
  Image as ImageIcon, 
  File as FileGeneric, 
  Download, 
  Search,
  ExternalLink,
  FileCode,
  User,
  Facebook
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'
interface Resource {
  _id: string
  title: string
  fileUrl: string
  extension: string
  category: string
  _createdAt: string
  size?: string
  description?: string | null
  author?: string | null
}

export default function ResourcesClient({ initialResources }: { initialResources: Resource[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const getFileConfig = (ext: string) => {
    const e = ext.toLowerCase()
    if (e === 'pdf') return { icon: <FileText />, color: 'text-red-500', bg: 'bg-red-500/10' }
    if (e === 'pptx' || e === 'ppt') return { icon: <FileGeneric />, color: 'text-orange-500', bg: 'bg-orange-500/10' }
    if (e === 'docx' || e === 'doc') return { icon: <FileText />, color: 'text-blue-500', bg: 'bg-blue-500/10' }
    if (e === 'zip' || e === 'rar') return { icon: <FileCode />, color: 'text-amber-500', bg: 'bg-amber-500/10' }
    if (['jpg', 'png', 'webp'].includes(e)) return { icon: <ImageIcon />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    return { icon: <FileGeneric />, color: 'text-slate-500', bg: 'bg-slate-500/10' }
  }

  const filteredResources = initialResources.filter(res =>
    res.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-12">
      {/* Buscador con Glassmorphism */}
      <div className="relative max-w-md mx-auto group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Buscar recursos..."
          className="block w-full pl-11 pr-4 py-4 rounded-2xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
          {filteredResources.map((resource) => {
            const config = getFileConfig(resource.extension)

            return (
              <motion.div
                key={resource._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative flex flex-col p-7 rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md hover:bg-white/50 dark:hover:bg-slate-900/50 transition-all duration-500 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_20px_40px_0_rgba(0,0,0,0.1)] hover:-translate-y-2 overflow-hidden"
              >
                {/* Reflejo de luz interno (Glow) */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/20 dark:bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`p-4 rounded-2xl ${config.bg} ${config.color} shadow-inner transition-transform group-hover:scale-110 duration-500`}>
                    {config.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/5 text-slate-600 dark:text-slate-400 backdrop-blur-sm">
                      {resource.extension}
                    </span>
                    {resource.size && <span className="text-[10px] text-muted-foreground font-medium">{resource.size}</span>}
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2 leading-tight tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {resource.title}
                  </h3>

                  {resource.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-white/60 line-clamp-3 font-sans mb-5">
                      {resource.description}
                    </p>
                  )}

                  {resource.author && (
                    <p className="text-[13px] font-medium text-slate-600 dark:text-white/65 flex items-center gap-2 mb-8">
                      <User className="h-3.5 w-3.5 text-blue-500/80" />
                      <span>Autor: {resource.author}</span>
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-3 relative z-10">
                  <a 
                    href={`${resource.fileUrl}?dl=`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3.5 rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-none"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                  <a 
                    href={resource.fileUrl}
                    target="_blank"
                    className="p-3.5 rounded-2xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-all backdrop-blur-sm"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                  <a
                    href="https://www.facebook.com/agoraedu"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Visitar Facebook de AgoraEDU"
                    title="AgoraEDU en Facebook"
                    className="p-3.5 rounded-2xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-all backdrop-blur-sm"
                  >
                    <Facebook className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}