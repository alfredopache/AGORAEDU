import * as React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getCarpetaBySlug } from "@/content/carpetas"
import { ArrowLeft, BookOpen, Rocket, FileText, Video, ArrowRight, Hash, Mic, Home, Image as ImageIcon } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

const getItemMeta = (type: string) => {
  switch (type) {
    case "blog":
    case "post":
      return { label: "Articulo", icon: <BookOpen className="w-5 h-5 text-amber-500" />, bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", path: "blog" }
    
    case "project":
      return { label: "Despliegue", icon: <Rocket className="w-5 h-5 text-blue-500" />, bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", path: "proyectos" }
    
    case "resource":
      return { label: "Documento", icon: <FileText className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", path: "recursos" }
    
    case "podcast":
      return { label: "YouTube", icon: <Mic className="w-5 h-5 text-red-500" />, bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", path: "youtube" }
    
    case "recursoImagen":
      return { label: "Imagen", icon: <ImageIcon className="w-5 h-5 text-cyan-500" />, bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20", path: "imagenes" }

    default:
      return { label: "Blob", icon: <Mic className="w-5 h-5 text-slate-500" />, bg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20", path: "dashboard" }
  }
}

export default async function FolderDetailPage({ params }: PageProps) {
  const { slug } = await params
  const carpeta = await getCarpetaBySlug(slug)

  if (!carpeta) notFound()

  const items = carpeta.items || []

  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950 pt-16 pb-24 transition-colors duration-500">
      <div className="absolute top-0 bottom-0 left-[max(2rem,calc((100vw-56rem)/2))] w-px bg-slate-100 dark:bg-white/5 hidden xl:block" />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium text-slate-400 dark:text-slate-500 mb-10 overflow-x-auto whitespace-nowrap py-1">
          <Link 
            href="/carpetas" 
            className="flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            title="Volver a carpetas"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="text-slate-300 dark:text-white/10">/</span>
          <span className="text-slate-900 dark:text-slate-200 font-mono bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md">
            {carpeta.slug}
          </span>
        </div>

        {/* Cabecera */}
        <div className="relative border border-slate-200/60 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/10 p-8 rounded-3xl mb-12 backdrop-blur-xs">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
            {carpeta.title}
          </h1>
          {carpeta.description && (
            <p className="mt-4 text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              {carpeta.description}
            </p>
          )}
        </div>

        {/* Explorador de Archivos */}
        <div className="border border-slate-200/80 dark:border-white/5 rounded-3xl overflow-hidden bg-white/50 dark:bg-slate-900/10 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-white/5 text-xs font-black uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2.5">
              <Hash className="w-3.5 h-3.5" />
              <span>ITEMS VINCULADOS ({items.length})</span>
            </div>
            <span className="hidden sm:block">ACCESO</span>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400 dark:text-slate-500 italic">
              Esta carpeta está vacía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {items.map((item) => {
                if (!item || !item._type) return null
                
                const meta = getItemMeta(item._type)
                const isPodcast = item._type === "podcast"
                const isRecursoImagen = item._type === "recursoImagen"
                const isResource = item._type === "resource" // 👈 CORREGIDO: Eliminada la comparación errónea con "resources"

                // --- CASO EXCLUSIVO: DETECTAR Y PINTAR LA IMAGEN DIRECTAMENTE ---
                if (isRecursoImagen) {
                  return (
                    <div 
                      key={item._id} 
                      className="p-6 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-950 p-2 shadow-xs">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            // 👈 CORREGIDO: max-h-[500px] sustituido por max-h-125 tal como pedía Tailwind
                            className="w-full h-auto max-h-125 object-contain rounded-xl mx-auto"
                            loading="lazy"
                          />
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 italic">
                            No se ha subido ningún archivo de imagen válido.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                // --- COMPORTAMIENTO HABITUAL PARA ENLACES CLICKEABLES ---
                const targetHref = isPodcast && item.youtubeUrl
                  ? item.youtubeUrl
                  : isPodcast
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title || "")}`
                    : isResource && item.fileUrl
                      ? item.fileUrl
                      : `/${meta.path}/${item.slug}`

                const linkContent = (
                  <>
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform group-hover:border-blue-500/20 dark:group-hover:border-cyan-500/20">
                        {meta.icon}
                      </div>
                      
                      <div className="min-w-0 flex-1 pr-5">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                            {item.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded-md border shrink-0 hidden xs:inline-block ${meta.bg}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 dark:text-slate-500 truncate mt-1 font-mono">
                          {isPodcast ? "youtube.com/watch" : isResource ? "cdn.sanity.io/files" : `${meta.path}/${item.slug}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-transparent group-hover:border-slate-200/60 dark:group-hover:border-white/10 bg-transparent group-hover:bg-white dark:group-hover:bg-slate-950 transition-all text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0">
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </>
                )

                const isExternal = isPodcast || isResource

                if (isExternal) {
                  return (
                    <a
                      key={item._id}
                      href={targetHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-5 transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      {linkContent}
                    </a>
                  )
                }

                return (
                  <Link
                    key={item._id}
                    href={targetHref}
                    className="group flex items-center justify-between p-5 transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    {linkContent}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}