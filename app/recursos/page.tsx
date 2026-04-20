import { getResources } from "@/content/resources"; // Crearemos esta función luego
import { PageHeader } from "@/components/page-header";
import { DotsBackground } from "@/components/ui/backgrounds";
import ResourcesClient from "./resources-client"; // El nuevo componente cliente

export const dynamic = 'force-dynamic'

export default async function RecursosPage() {
  // Traemos los recursos de Sanity (PDFs, PPTXs, Videos, etc.)
  const resources = await getResources();

  return (
    <section className="relative min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-24 overflow-hidden">
      {/* Fondo de Puntos para uniformidad */}
      <DotsBackground />
      
      {/* Refuerzo visual: Grid técnico + Auroras Azules/Cian para diferenciar de la Galería */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* El Grid sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Luces de ambiente en Azul/Cian (Color de "tecnología/recursos") */}
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-5%] w-[35%] h-[35%] rounded-full bg-cyan-500/10 dark:bg-cyan-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <PageHeader 
          badge="Biblioteca Digital"
          title="Recursos y"
          highlight="Materiales"
          description="Explora y descarga guías, presentaciones y documentación técnica generada en nuestro laboratorio."
          color="blue" // Cambiamos a azul para diferenciarlo del púrpura de la galería
        />

        {/* Pasamos los datos al componente cliente que gestiona el filtrado y el diseño de tarjetas */}
        <ResourcesClient initialResources={resources} />
      </div>
    </section>
  );
}