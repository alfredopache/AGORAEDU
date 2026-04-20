/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 */

"use client"

import { NextStudio } from 'next-sanity/studio'
import config from '../../../sanity.config'

// Forzamos el renderizado dinámico para evitar errores de contexto en el servidor
export const dynamic = 'force-dynamic'

export default function StudioPage() {
  return (
    <div className="min-h-screen">
      <NextStudio config={config} />
    </div>
  )
}
