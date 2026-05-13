"use client"

import { usePathname } from "next/navigation"
import { BlogNav } from "@/components/blog-nav"
import { BlogFooter } from "@/components/blog-footer"

// Definimos la interfaz aquí también para que TypeScript sepa qué estamos pasando
interface LatestProject {
  title: string
  slug: string
}

interface LayoutContentProps {
  children: React.ReactNode
  latestProject: LatestProject | null // Aceptamos la prop que viene del Layout (RSC)
}

export function LayoutContent({ children, latestProject }: LayoutContentProps) {
  const pathname = usePathname()
  
  // Ocultamos Nav y Footer en el estudio de Sanity
  const isAdmin = pathname?.startsWith("/admin")
  // En /eduia la página gestiona su propio layout de altura completa
  const isEduIA = pathname?.startsWith("/eduia")

  return (
    <>
      {/* Pasamos los datos del proyecto a la Navbar */}
      {!isAdmin && <BlogNav latestProject={latestProject ?? undefined} />}
      {isEduIA ? (
        <main className="h-screen pt-24 flex flex-col overflow-hidden">
          {children}
        </main>
      ) : (
        <main className="pt-20 md:pt-24 lg:pt-28 min-h-screen">
          {children}
        </main>
      )}

      {!isAdmin && !isEduIA && <BlogFooter />}
    </>
  )
}