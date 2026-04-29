"use client"

import { useState } from "react"
import { motion as motionBase } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Clock, ArrowRight, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { urlFor } from "@/lib/sanity"
import { BlogPost } from "@/content/blog"

const motion = motionBase as any

export const dynamic = 'force-dynamic'

export default function BlogListClient({ entries }: { entries: BlogPost[] }) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'educacion' | 'salud-y-bienestar' | 'tecnologia'>('all')

  const normalizeTag = (tag: string) => tag.replace(/^#/, '').trim().toLowerCase()

  const categoryIdFromTag = (tag: string) => {
    const normalized = normalizeTag(tag)

    if (['educacion', 'educación'].includes(normalized)) return 'educacion'
    if (['salud y bienestar', 'salud', 'bienestar'].includes(normalized)) return 'salud-y-bienestar'
    if (['tecnologia', 'tecnología', 'tecnologIA'.toLowerCase()].includes(normalized)) return 'tecnologia'

    return null
  }

  const filterCategories: { id: 'all' | 'educacion' | 'salud-y-bienestar' | 'tecnologia'; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'educacion', label: 'Educación' },
    { id: 'salud-y-bienestar', label: 'Salud y bienestar' },
    { id: 'tecnologia', label: 'Tecnología' },
  ]

  const filteredEntries = entries.filter((entry) => {
    if (!entry.tags || entry.tags.length === 0) return false

    const entryCategoryIds = Array.from(
      new Set(entry.tags.map(categoryIdFromTag).filter(Boolean))
    )

    if (selectedCategory === 'all') {
      return entryCategoryIds.length > 0
    }

    return entryCategoryIds.includes(selectedCategory)
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-3">
        {filterCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-semibold transition-all',
              selectedCategory === category.id
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8">
        {filteredEntries.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-center text-slate-500 dark:text-slate-400">
            No hay artículos en esta categoría.
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
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

                  <div className="flex flex-1 flex-col justify-center mt-6 md:mt-0 md:ml-6">
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
                        {entry.tags
                          ?.map((tag) => ({ tag, categoryId: categoryIdFromTag(tag) }))
                          .filter((item) => item.categoryId)
                          .slice(0, 2)
                          .map((item) => (
                            <span key={item.tag} className="rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[10px] text-slate-500 dark:text-white/70 uppercase font-bold tracking-wider">
                              #{item.tag}
                            </span>
                          ))}
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400 transform transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
