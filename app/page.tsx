// app/page.tsx
import HeroServer from "./hero/hero-server" // Importamos el componente de servidor

export default function Page() {
  return (
    <main>
      <HeroServer />
      {/* Aquí irán tus otras secciones como Proyectos, Podcast, etc. */}
    </main>
  )
}