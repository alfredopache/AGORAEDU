import { Metadata } from 'next'
import { client } from '@/lib/sanity'
import PodcastsClient from './podcasts-client'
import SuggestionBox from '@/components/suggestion-box'
import { PageHeader } from "@/components/page-header"
import { TopographyBackground } from "@/components/ui/backgrounds"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Podcasts | Blog FP',
  description: 'Explora nuestros episodios sobre formación profesional y tecnología.',
}

async function getData() {
  const query = `{
    "podcasts": *[_type == "podcast"] | order(publishedAt desc) {
      _id,
      title,
      youtubeUrl,
      description,
      publishedAt,
      coverImage,
      duration,
      tags
    },
    "settings": *[_type == "settings"][0]
  }`
  return await client.fetch(query)
}

export default async function PodcastsPage() {
  const { podcasts, settings } = await getData()

  const allTags: string[] = Array.from(
    new Set(podcasts.flatMap((p: any) => p.tags || []))
  ).sort() as string[];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      
      {/* 1. Fondo reutilizable (Código extraído) */}
      <TopographyBackground />

      {/* 2. Cabecera */}
      <section className="relative pt-32 pb-12 z-10">
        <div className="mx-auto max-w-7xl px-6">
          <PageHeader 
            badge="Contenido AudioVisual"
            title="" 
            highlight=""
            description="Divulgación sobre Formación Profesional, tecnología y el futuro del aprendizaje."
            color="blue"
          />
        </div>
      </section>

      {/* 3. Contenido Principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <PodcastsClient 
          initialPodcasts={podcasts} 
          allTags={allTags}
          showFilters={settings?.showPodcastFilters}
        >
          <aside className="space-y-8">
            {settings?.showSuggestions !== false && <SuggestionBox />}
          </aside>
        </PodcastsClient>
      </div>
    </main>
  )
}