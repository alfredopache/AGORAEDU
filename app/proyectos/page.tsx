import { getProjects } from "@/content/projects"
import { PageHeader } from "@/components/page-header"
import { ProjectCard } from "@/components/project-card"
import { DotsBackground } from "@/components/ui/backgrounds"
import { EmptyState } from "@/components/ui/empty-state"

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <section className="relative min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-24 overflow-hidden transition-colors duration-500">
      
      {/* 1. Fondo de Puntos Base */}
      <DotsBackground />

      {/* 2. Efecto de Iluminación Ambiental */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 dark:bg-indigo-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        
        <PageHeader 
          badge=""
          title="Proyectos de"
          highlight="innovación"
          description="Experiencias, prototipos y propuestas didácticas para experimentar con nuevas tecnologías y metodologías en contextos educativos reales."
          color="blue"
        />

        {/* 3. Lógica de Renderizado con Empty State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects && projects.length > 0 ? (
            projects.map((entry, index) => (
              <ProjectCard key={entry.slug} entry={entry} index={index} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                title="No se han publicado proyectos" 
                subtitle="Nuestra IA está procesando nuevas experiencias educativas. Vuelve pronto para descubrir las novedades." 
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}