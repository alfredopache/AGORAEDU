import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Download, FileText, GraduationCap } from "lucide-react"

import { getProjectBySlug, getRelatedProjects } from "@/content/projects"
import { DynamicIcon } from "@/components/dynamic-icon"
import { ProjectCard } from "@/components/project-card"
import { ShareButton } from "@/components/share-button"
import { FadeIn } from "@/components/fade-in"
import { PortableTextContent } from "@/components/portable-text-content"
import { ScrollToTop } from "@/components/scroll-to-top"
import { GridBackground } from "@/components/ui/backgrounds"

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Proyecto no encontrado" };
  return {
    title: `${project.title} | Innovación Académica`,
    description: project.excerpt,
  }
}

export default async function ProjectDetailsPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return notFound();

  // Cambio clave: pasamos el título de la categoría para la búsqueda de relacionados
  const related = await getRelatedProjects(project.category || "", slug);
  const hasSpecs = project.specs && project.specs.length > 0;

  return (
    <main className="relative min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500">
      <GridBackground />

      <section className="relative pt-28 pb-16 px-6 z-10">
        <div className="mx-auto max-w-6xl">
          <FadeIn direction="right">
            <Link 
              href="/proyectos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 mb-10 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Volver al listado
            </Link>
          </FadeIn>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-3">
              <FadeIn>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-200 dark:border-white/5">
                    {project.date}
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-lg shadow-blue-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-100 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    {project.category || "General"}
                  </div>
                </div>

                <h1 className="font-serif text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  {project.title}
                </h1>

                <p className="text-xl text-slate-600 dark:text-white/60 mb-8 leading-relaxed font-sans">
                  {project.excerpt}
                </p>

                <div className="flex flex-wrap gap-4">
                  {project.fileURL ? (
                    <a 
                      href={`${project.fileURL}?dl=${slug}.pdf`}
                      className="flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-xl active:scale-95"
                    >
                      <Download className="w-4 h-4" /> Guía Docente (PDF)
                    </a>
                  ) : (
                    <button disabled className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl font-bold cursor-not-allowed border border-dashed border-slate-200 dark:border-white/10">
                      <FileText className="w-4 h-4" /> Próximamente
                    </button>
                  )}
                  <ShareButton title={project.title} />
                </div>
              </FadeIn>
            </div>

            <div className="lg:col-span-2">
              <FadeIn direction="left" delay={0.2}>
                <div className="relative aspect-4/5 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5">
                  <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 40vw" />
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {hasSpecs && (
        <FadeIn direction="none" delay={0.3}>
          <section className="relative z-10 px-6 py-10 bg-slate-50 dark:bg-white/5 border-y border-slate-200 dark:border-white/10">
            <div className="mx-auto max-w-6xl">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12">
                {project.specs?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <DynamicIcon name={item.icon} className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 tracking-tighter">{item.label}</p>
                      <p className="text-slate-900 dark:text-white font-semibold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="md:col-span-2 space-y-12">
              <FadeIn>
                <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white mb-6 border-b-2 border-blue-600 dark:border-blue-400 pb-2 inline-block">
                  Descripción Académica
                </h3>
                <PortableTextContent value={project.content} />
              </FadeIn>

              {project.showAula && (
                <FadeIn delay={0.2}>
                  <div className="bg-blue-50 dark:bg-blue-500/5 p-8 rounded-3xl border border-blue-100 dark:border-blue-500/20 italic">
                    <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2 not-italic">
                      <GraduationCap className="w-5 h-5" /> Aplicación en el Aula
                    </h4>
                    <p className="text-sm text-blue-800/70 dark:text-blue-200/60 leading-relaxed">
                      {project.aulaContent || "Recurso diseñado para la implementación académica."}
                    </p>
                  </div>
                </FadeIn>
              )}
            </div>

            <aside>
              <FadeIn direction="left" delay={0.4}>
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm sticky top-24">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 italic text-sm">Conceptos Clave</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tags?.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-slate-50 dark:bg-white/5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </aside>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="relative z-10 px-6 py-24 bg-slate-50 dark:bg-white/2 border-t border-slate-200 dark:border-white/10">
          <div className="mx-auto max-w-6xl">
            <FadeIn direction="none">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">Recursos similares</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Otros proyectos de <span className="text-blue-600 dark:text-blue-400 font-semibold">{project.category}</span>
                  </p>
                </div>
                <Link href="/proyectos" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group/all">
                  Ver todo <ArrowRight className="w-4 h-4 transition-transform group-hover/all:translate-x-1" />
                </Link>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((item, i) => (
                <ProjectCard key={item.slug} entry={item} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ScrollToTop />
    </main>
  )
}