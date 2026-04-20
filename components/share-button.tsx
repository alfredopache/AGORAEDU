"use client"

import { Share2, Check } from "lucide-react"
import { useState } from "react"

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Echa un vistazo a este artículo: ${title}`,
      url: window.location.href, // Detecta la URL actual automáticamente
    }

    try {
      // Intentamos usar la API nativa (móviles y navegadores modernos)
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Si no está disponible (ej. Chrome en PC), copiamos al portapapeles
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.log("Error al compartir:", err)
    }
  }

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full font-bold hover:bg-blue-600 dark:hover:bg-blue-400 dark:hover:text-white transition-all active:scale-95 shadow-lg shadow-blue-500/10"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          ¡Copiado!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Compartir
        </>
      )}
    </button>
  )
}