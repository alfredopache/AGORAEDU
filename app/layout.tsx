import React from "react"
import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import AuthSessionProvider from "@/components/session-provider"
import { LayoutContent } from "@/components/layout-content"
import { getLatestProject } from "@/content/projects" 
import { Toaster } from "sonner" // Añadimos el Toaster para las sugerencias
import { cn } from "@/lib/utils"

import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://agoraedu.eu'),
  title: {
    default: 'AgoraEDU',
    template: '%s | AgoraEDU'
  },
  description: 'Laboratorio de ideas para reinventar la Formación Profesional.',
  keywords: ['FP', 'Innovación', 'IA', 'AgoraEDU', 'Emprendimiento', 'Tecnología Educativa'],
  authors: [{ name: 'AgoraEDU Team.' }],
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://agoraedu.eu',
    siteName: 'AgoraEDU',
    title: 'AgoraEDU',
    description: 'Explora el futuro de la educación tecnológica.',
    images: [{ url: '/og-main.png', width: 1200, height: 630, alt: 'AgoraEDU' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgoraEDU',
    images: ['/og-main.png'],
  },
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let latestProject = null;
  try {
    latestProject = await getLatestProject();
  } catch (error) {
    console.error("⚠️ Layout Error:", error);
  }

  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className={cn(
        "font-sans antialiased overflow-x-hidden min-h-screen",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "transition-colors duration-500 ease-in-out" // Suavizado de fondo
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false} // Cambiado a FALSE para permitir la animación de cambio
        >
          <LayoutContent latestProject={latestProject}>
            <AuthSessionProvider>
              {children}
            </AuthSessionProvider>
          </LayoutContent>
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}