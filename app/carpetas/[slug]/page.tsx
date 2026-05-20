import * as React from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getCarpetaBySlug } from "@/content/carpetas"
import { ArrowLeft, BookOpen, Rocket, FileText, Video, ArrowRight, Hash, Mic, Home, FolderOpen, Image as ImageIcon } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

const getItemMeta = (type: string) => {
  switch (type) {
    case "blog":
    case "post":
      return { icon: <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />, path: "blog" }
    
    case "project":
      return { icon: <Rocket className="w-5 h-5 text-blue-500 dark:text-blue-400" />, path: "proyectos" }
    
    case "recursoArchivo":
      return { icon: <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, path: "archivos" }
    
    case "podcast":
      return { icon: <Mic className="w-5 h-5 text-red-500 dark:text-red-400" />, path: "youtube" }
    
    case "recursoImagen":
      return { icon: <ImageIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />, path: "imagenes" }

    default:
      return { icon: <FileText className="w-5 h-5 text-slate-500" />, path: "dashboard" }
  }
}

const colorGlows: Record<string, string> = {
  blue: "from-blue-500/15 via-transparent",
  indigo: "from-indigo-500/15 via-transparent",
  cyan: "from-cyan-500/15 via-transparent",
  purple: "from-purple-500/15 via-transparent",
  emerald: "from-emerald-500/15 via-transparent",
  violet: "from-violet-500/15 via-transparent",
  fuchsia: "from-fuchsia-500/15 via-transparent",
  pink: "from-pink-500/15 via-transparent",
  rose: "from-rose-500/15 via-transparent",
  amber: "from-amber-500/15 via-transparent",
  orange: "from-orange-500/15 via-transparent",
  red: "from-red-500/15 via-transparent",
}

export default async function FolderDetailPage({ params }: PageProps) {
  const { slug } = await params
  const carpeta = await getCarpetaBySlug(slug)

  if (!carpeta) notFound()

  const items = carpeta.items || []
  const glowClass = colorGlows[carpeta.color || "blue"]

  return (
    <main className="relative min-h-screen bg-slate-100/60 dark:bg-slate-950 pt-4 pb-32 transition-colors duration-500 overflow-hidden">
      


      <div className="relative z-10 mx-auto max-w-4xl px-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
            <Link 
              href="/carpetas" 
              className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-xs hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              title="Volver a carpetas"
            >
              <Home className="w-3.5 h-3.5" />
            </Link>
            <span className="text-slate-300 dark:text-white/10">/</span>
            <span className="font-mono bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10">
              {carpeta.slug}
            </span>
          </div>
          
          <Link 
            href="/carpetas" 
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al listado
          </Link>
        </div>

        {/* Cabecera Premium Glassmorphism */}
        <div className="relative border border-slate-200 dark:border-white/10 bg-gradient-to-b from-white/90 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 p-8 md:p-10 rounded-3xl mb-12 shadow-sm backdrop-blur-md">
          
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {carpeta.title}
          </h1>
          {carpeta.description ? (
            <p className="mt-4 text-base md:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {carpeta.description}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400 dark:text-slate-500">
              Sin descripción adicional para esta carpeta.
            </p>
          )}
        </div>

        {/* Contenedor Principal del Explorador con Fondo Mejorado */}
        <div className="border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-900/60 dark:to-slate-950/40 shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl">
          
          {/* Barra de título del explorador */}
          <div className="flex items-center justify-between px-6 py-4 bg-white/40 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span>Contenido Vinculado ({items.length})</span>
            </div>
            <span className="hidden sm:block font-mono text-[10px]">Origen / Plataforma</span>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 shadow-xs">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Esta carpeta está vacía</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                El docente aún no ha anexado archivos o lecturas a este espacio.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-150 dark:divide-white/5">
              {items.map((item) => {
                if (!item || !item._type) return null
                
                const meta = getItemMeta(item._type)
                const isPodcast = item._type === "podcast"
                const isRecursoImagen = item._type === "recursoImagen"
                const isRecursoArchivo = item._type === "recursoArchivo"

                // --- VISTA MAQUETADA PARA IMÁGENES ---
                if (isRecursoImagen) {
                  return (
                    <div 
                      key={item._id} 
                      className="p-6 md:p-8 bg-white/40 dark:bg-slate-900/10 flex flex-col gap-4 hover:bg-white/80 dark:hover:bg-slate-900/30 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-xs shrink-0">
                          {meta.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xl">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-2.5 shadow-xs group/img">
                        {item.imageUrl ? (
                          <div className="relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-full h-auto max-h-125 object-contain rounded-xl mx-auto transform transition-transform duration-500 group-hover/img:scale-[1.01]"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 italic font-medium">
                            No se encuentra el archivo físico de la imagen.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }

                // --- COMPORTAMIENTO PARA ELEMENTOS CON LINK (Sin badges a la derecha) ---
                const targetHref = isPodcast && item.youtubeUrl
                  ? item.youtubeUrl
                  : isPodcast
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title || "")}`
                    : isRecursoArchivo && item.fileUrl 
                      ? item.fileUrl
                      : `/${meta.path}/${item.slug}`

                const linkContent = (
                  <>
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Icono de Item */}
                      <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xs shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-xs group-hover:border-slate-300 dark:group-hover:border-white/20">
                        {meta.icon}
                      </div>
                      
                      <div className="min-w-0 flex-1 pr-4">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 truncate transition-colors group-hover:text-slate-950 dark:group-hover:text-white">
                          {item.title}
                        </h3>
                        
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-1.5 font-mono tracking-tight bg-white/60 dark:bg-slate-950/40 px-2 py-0.5 rounded w-max max-w-full border border-slate-100 dark:border-none">
                          {isPodcast ? "youtube.com/watch" : isRecursoArchivo ? "sanity.io/storage/cdn" : `${meta.path}/${item.slug}`}
                        </p>
                      </div>
                    </div>

                    {/* Botón de flecha interactivo */}
                    <div className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950 group-hover:border-slate-300 dark:group-hover:border-white/20 group-hover:bg-white dark:group-hover:bg-slate-900 shadow-2xs text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-all duration-300 shrink-0">
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
                    </div>
                  </>
                )

                const isExternal = isPodcast || isRecursoArchivo

                if (isExternal) {
                  return (
                    <a
                      key={item._id}
                      href={targetHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-5 md:p-6 transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/30"
                    >
                      {linkContent}
                    </a>
                  )
                }

                return (
                  <Link
                    key={item._id}
                    href={targetHref}
                    className="group flex items-center justify-between p-5 md:p-6 transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/30"
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