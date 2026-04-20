"use client"
import { useState, useEffect } from 'react'
import { Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SuggestionBox() {
  const [suggestion, setSuggestion] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [placeholder, setPlaceholder] = useState('')

  const phrases = [
    "¿Algo sobre tecnología?",
    "¿Algo sobre psicología?",
    "¿Algo sobre finanzas?",
    "¿Algo sobre FP Dual?",
    "¿Algo sobre desarrollo web?",
  ]

  // Los Hooks siempre al principio
  useEffect(() => {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    setPlaceholder(randomPhrase)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suggestion.trim() || status === 'sending') return

    setStatus('sending')
    
    try {
      const response = await fetch('/api/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: suggestion }),
      })

      if (!response.ok) throw new Error('Error en el servidor')

      setSuggestion('')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)

    } catch (err) {
      console.error("Error al enviar:", err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div className={cn(
      "bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group transition-colors duration-500",
      status === 'error' ? 'bg-red-500' : ''
    )}>
      <div className="relative z-10 flex flex-col items-start">
        <h3 className="font-bold text-lg mb-2 text-white text-left">
          {status === 'error' ? 'Hubo un error' : 'Contáctanos'}
        </h3>
        <p className="text-sm text-blue-100 mb-6 leading-relaxed text-left">
          {status === 'error' 
            ? 'No se pudo enviar la sugerencia. Inténtalo de nuevo.' 
            : '¿Qué se te ocurre? Mándanos tus ideas y hablamos.'}
        </p>
        
        <form onSubmit={handleSubmit} className="relative w-full mb-4">
          <input 
            type="text"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder={placeholder}
            disabled={status === 'success' || status === 'sending'}
            className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 pr-12 text-sm placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={status !== 'idle' || !suggestion.trim()}
            className="absolute right-2 top-1.5 p-2 bg-white text-blue-600 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-sm"
          >
            {status === 'sending' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : status === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {status === 'success' && (
          <p className="text-[10px] text-blue-100 mt-1 mb-3 animate-pulse font-bold tracking-wide">
            ¡SUGERENCIA ENVIADA! MUCHAS GRACIAS.
          </p>
        )}

        {/* Opción alternativa: Formulario de Google */}
        <div className="w-full flex justify-start mt-2">
          <a
            href="https://forms.gle/gyWyGrpSpVAwE16t6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white hover:text-blue-600 transition-all duration-300"
          >
            O usa el formulario externo
          </a>
        </div>
      </div>
      
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  )
}
