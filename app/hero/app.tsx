// app/page.tsx
import HeroServer from "./hero-server"

export const dynamic = 'force-dynamic'

export default function Hero() {
  return (
    <main>
      <HeroServer />
      {/* Otras secciones... */}
    </main>
  )
}