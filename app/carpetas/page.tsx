import * as React from "react"
import { getCarpetas } from "@/content/carpetas"
import { FolderCard } from "@/components/ui/folder-card"
import { FolderKanban, SlidersHorizontal, Sparkles } from "lucide-react"

export const metadata = {
  title: "Colecciones y Carpetas | AgoraEDU",
  description: "Contenido didáctico, proyectos y recursos agrupados por temáticas y módulos.",
}

export default async function CarpetasPage() {
  const carpetas = await getCarpetas()

  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950 pt-16 pb-24 transition-colors duration-500 overflow-hidden">
      
      {/* --- BACKGROUND TECH GRAPH --- */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #64748b3b 1px, transparent 1px), linear-gradient(to bottom, #64748b34 1px, transparent 1px)`,
          backgroundSize: '3rem 3rem',
          maskImage: 'radial-gradient(circle 60% at 50% 30%, #000 40%, transparent 100%)',
        }}
      />

      {/* Auroras de color sutiles */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 dark:bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        
        {/* Cabecera Tipo Dashboard */}
        <div className="relative p-8 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/10 backdrop-blur-md mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              
              <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl font-serif">
                Módulos de Aprendizaje
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                Estructuras de conocimiento indexadas. Accede a repositorios de código, documentación técnica y laboratorios virtuales organizados por áreas de especialización.
              </p>
            </div>
            
            {/* Widget de Estadísticas Rápido */}
            <div className="flex items-center gap-4 bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 p-4 rounded-2xl self-start md:self-center shadow-xs">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Colecciones</div>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200">{carpetas.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Bento con espaciado óptimo */}
        {carpetas.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-transparent">
            <p className="text-slate-400 text-sm font-medium">Estructurando directorios en el servidor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carpetas.map((carpeta) => (
              <FolderCard key={carpeta._id} carpeta={carpeta} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}