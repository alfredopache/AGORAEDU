import Link from "next/link"
import { notFound } from "next/navigation"
import { Clock, ArrowLeft } from "lucide-react"
import { getBlogPost } from "@/content/blog"
import { urlFor } from "@/lib/sanity"
import { PortableText } from "@portabletext/react"
import Image from "next/image"
import { ShareButton } from "@/components/share-button"
import { ScrollCue } from "@/components/ui/scroll-cue"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

// --- SEO DINÁMICO ---
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  const entry = await getBlogPost(decodedSlug);

  if (!entry) return { title: 'Post no encontrado' };

  return {
    title: entry.title,
    description: entry.excerpt || `Lee más sobre ${entry.title} en el blog de AgoraEDU.`,
    openGraph: {
      title: entry.title,
      description: entry.excerpt,
      // Optimizamos también la imagen de la tarjeta social
      images: entry.image ? [urlFor(entry.image).width(1200).height(630).url()] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // 1. Desenvolver la promesa de params (Requerido en Next.js 15)
  const resolvedParams = await params;
  
  // 2. Decodificar para evitar el error 404 con acentos
  const decodedSlug = decodeURIComponent(resolvedParams.slug);
  
  const entry = await getBlogPost(decodedSlug);

  if (!entry) notFound();

  const member = entry.member;

  return (
    <article className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-24 relative transition-colors duration-500">
      
      {/* Malla de fondo */}
      <div 
        className="absolute inset-0 opacity-[0.1] pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* Hero Section */}
      <div className="relative h-[75vh] w-full overflow-hidden">
        <div className="h-full w-full relative">
          {entry.image ? (
            <>
              <Image 
                // Optimizamos la URL de Sanity: gran tamaño, alta calidad y formato automático
                src={urlFor(entry.image).width(2000).quality(90).auto('format').url()} 
                alt={entry.title}
                fill
                priority // Carga crítica de LCP
                className="object-cover"
                sizes="100vw"
                quality={95} // Calidad de compresión de Next.js
              />
              {/* CAPA DE GRANO: Mejora la percepción de nitidez y evita el 'banding' en degradados */}
              <div 
                className="absolute inset-0 z-10 opacity-[0.2] mix-blend-overlay pointer-events-none" 
                style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-slate-200 dark:bg-slate-800" />
          )}
        </div>
        
        {/* Gradiente de superposición para lectura de Navbar y Títulos */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-900/20 to-black/40 z-20" />
        
        {/* Indicador de scroll para móviles */}
        <div className="absolute top-20 mt-32 left-0 w-full flex justify-center z-30 md:hidden">
          <ScrollCue />
        </div>

        {/* Contenedor de Cabecera */}
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-30 pt-32">
          <div className="mx-auto max-w-4xl">
            <Link 
              href="/blog" 
              className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white drop-shadow-md"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Volver a la bitácora
            </Link>
            
            <h1 className="font-serif text-4xl font-bold md:text-7xl text-balance leading-tight mb-4 tracking-tight text-white drop-shadow-xl">
              {entry.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              {entry.tags?.map((tag: string) => (
                <span key={tag} className="text-[10px] uppercase tracking-[0.2em] text-white border border-white/30 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md font-black">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm font-bold">
              <time className="bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                {entry.date}
              </time>
              <span className="flex items-center gap-1.5 text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                <Clock className="h-4 w-4" />
                {entry.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo del Artículo */}
      <div className="relative z-30 mx-auto max-w-5xl px-6 md:-mt-10">
        <div className="rounded-[2.5rem] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 p-8 md:p-16 backdrop-blur-2xl shadow-2xl transition-all duration-500">
          <div className="prose dark:prose-invert prose-blue max-w-none">
            <div className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-sans selection:bg-blue-500/30">
              <PortableText value={entry.content} />
            </div>
          </div>
          
          {/* Footer del autor */}
          <div className="mt-16 flex flex-col gap-10 border-t border-slate-100 dark:border-white/5 pt-12">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="shrink-0 group">
                {member?.image ? (
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                    <Image 
                      src={member.image} 
                      alt={member.name} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 768px) 112px, 128px"
                    />
                  </div>
                ) : (
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-3xl text-white shadow-2xl">
                    AEDU
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <span className="text-[11px] uppercase tracking-[0.3em] font-black text-blue-600 dark:text-blue-400">
                  Escrito por
                </span>
                <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                  {member?.name || "Equipo"}
                </h3>
                <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium italic">
                  {member?.role || ""}
                </p>
              </div>
              <div className="flex shrink-0 self-center md:self-start pt-4">
                <ShareButton title={entry.title} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}