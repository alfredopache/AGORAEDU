import { getBlogEntries } from "@/content/blog"
import BlogListClient from "./blogListClient"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/ui/empty-state"

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  let blogEntries = await getBlogEntries()
  if (!Array.isArray(blogEntries)) blogEntries = []

  return (
    <section className="relative min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-24 overflow-hidden transition-colors duration-500">
      
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.1] pointer-events-none z-0" 
           style={{ backgroundImage: 'radial-gradient(currentColor 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} 
      />

      {/* Luces de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <PageHeader 
          badge="Bitácora Digital"
          title="Trabajando en la"
          highlight="educación"
          description="Laboratorio de ideas, tecnología y aprendizaje aplicado."
          color="blue"
        />

        {/* Lógica de Empty State */}
        {Array.isArray(blogEntries) && blogEntries.length > 0 ? (
          <BlogListClient entries={blogEntries} />
        ) : (
          <div className="mt-12">
            <EmptyState 
              title="Aún no hay artículos" 
              subtitle="Nuestra IA y el equipo editorial están preparando las primeras publicaciones. ¡Vuelve muy pronto!" 
            />
          </div>
        )}
        {/* Bloque de contacto */}
        <div className="mt-16 flex justify-center">
          <div className="bg-blue-600 rounded-3xl p-8 w-full max-w-xl shadow-lg">
            <h2 className="text-white text-2xl font-bold mb-2">Contáctanos</h2>
            <p className="text-white mb-6">¿Qué se te ocurre? Mándanos tus ideas y correo electrónico y hablamos</p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScsGfbihPL9wZgBGALCbTt-AvHHNSbGX88pwKfGe_LZTgEZvw/viewform?usp=header"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-white text-lg font-semibold bg-blue-600 border border-white rounded-xl px-6 py-3 text-center transition hover:bg-blue-700 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
            >
              Ir al formulario
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}