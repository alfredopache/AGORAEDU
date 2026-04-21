"use client"

import { motion as motionBase } from "framer-motion"
import Image from "next/image"

const motion = motionBase as any
import { useRouter } from "next/navigation"
import { Clock, ArrowRight, BookOpen } from "lucide-react"
import { urlFor } from "@/lib/sanity" // Importamos el helper de imágenes
import { BlogPost } from "@/content/blog"

export const dynamic = 'force-dynamic'

export default function BlogListClient({ entries }: { entries: BlogPost[] }) {
  const router = useRouter()

  return (
    <div className="grid gap-8 max-w-5xl mx-auto">
      {entries.map((entry, index) => (
        <article
          key={entry.title}
          onClick={() => router.push(`/blog/${entry.slug}`)}
          className="group relative flex flex-col gap-6 md:flex-row rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-md transition-all hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:bg-white/10 cursor-pointer overflow-hidden"
        >
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="relative aspect-video md:aspect-square md:w-52 shrink-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
            <Image
              // Aquí usamos urlFor para convertir el objeto de Sanity en URL
              src={entry.image ? urlFor(entry.image).url() : "/placeholder.svg"}
              alt={entry.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
            />
            <div className="absolute inset-0 bg-black/20 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-white text-xs font-medium flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Leer artículo
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="mb-3 flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <time className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-500/20">
                {entry.date}
              </time>
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-white/40">
                <Clock className="h-3.5 w-3.5" />
                {entry.readTime}
              </span>
            </div>
            
            <h3 className="font-serif text-2xl font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
              {entry.title}
            </h3>
            
            <p className="mt-3 text-slate-600 dark:text-white/60 line-clamp-2 text-base leading-relaxed font-sans">
              {entry.excerpt}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {entry.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[10px] text-slate-500 dark:text-white/70 uppercase font-bold tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 transform transition-transform group-hover:translate-x-2" />
            </div>
          </div>
          <div className="absolute -inset-x-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent skew-x-12 transition-all duration-1000 group-hover:translate-x-[300%]" />
            </motion.div>
          </div>
        </article>
      ))}
    </div>
  )
}