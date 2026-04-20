"use client"
import { useState } from 'react'
import { Tag, X, PlayCircle } from 'lucide-react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

export const dynamic = 'force-dynamic'

export default function PodcastsClient({ initialPodcasts, allTags, showFilters, children }: any) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const filteredPodcasts = selectedTag
    ? initialPodcasts.filter((p: any) => p.tags?.includes(selectedTag))
    : initialPodcasts

  const getYouTubeThumbnail = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop()
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* Columna Izquierda: Lista de Videos */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPodcasts.map((podcast: any) => (
            <a 
              key={podcast._id}
              href={podcast.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            >
              <div className="relative aspect-video overflow-hidden">
                <Image 
                  src={podcast.coverImage ? urlFor(podcast.coverImage).url() : getYouTubeThumbnail(podcast.youtubeUrl)}
                  alt={podcast.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all duration-500 flex items-center justify-center z-10">
                  <PlayCircle className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100" />
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                  {podcast.duration}
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {podcast.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {podcast.description}
                </p>
              </div>
            </a>
          ))}
        </div>

        {filteredPodcasts.length === 0 && (
          <div className="text-center py-20 bg-slate-100 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No se encontraron episodios con la etiqueta #{selectedTag}.</p>
            <button 
              onClick={() => setSelectedTag(null)}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Mostrar todos
            </button>
          </div>
        )}
      </div>

      {/* Columna Derecha: Sidebar con Línea Difuminada */}
      <aside className="lg:col-span-4 space-y-8 lg:pl-12 relative">
        
        {/* LINEA DIVISORIA DIFUMINADA (Solo visible en LG) */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent dark:via-slate-800" />

        {/* Contenido de la Sidebar */}
        <div className="relative z-10 space-y-8">
          {children}

          {showFilters && allTags.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                  <Tag className="w-5 h-5" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Temas frecuentes</h3>
                </div>
                {selectedTag && (
                  <button 
                    onClick={() => setSelectedTag(null)} 
                    title="Quitar filtro"
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag: string) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${
                      selectedTag === tag 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                      : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-300 hover:border-blue-500/30'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}