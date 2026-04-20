/* metadatos en layout apartado para poder usar "use client"*/

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Day to Day - Empren.IA",
  description: "Longer-form pieces about life, thoughts, and experiences.",
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}