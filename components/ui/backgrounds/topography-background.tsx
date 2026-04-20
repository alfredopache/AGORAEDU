"use client"
import React from 'react'

interface TopographyBackgroundProps {
  opacity?: string; // Por si quieres variar la opacidad en diferentes páginas
  height?: string;
}

export const TopographyBackground = ({ 
  opacity = "opacity-25 dark:opacity-20", 
  height = "h-[1200px]" 
}: TopographyBackgroundProps) => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <svg 
        className={`absolute top-0 left-0 w-full ${height}`} 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Capas de Brillo (Glow) */}
        <g className="blur-[120px] opacity-20 dark:opacity-10">
           <path d="M-100,250 C200,600 700,0 1100,400" stroke="#3b82f6" strokeWidth="60" />
           <path d="M-100,700 C400,1000 800,500 1100,850" stroke="#1d4ed8" strokeWidth="60" />
        </g>

        {/* Grupo de Líneas Principales */}
        <g className={opacity}>
          <path d="M-100,100 C150,300 350,0 500,150 C650,300 850,50 1100,200" stroke="currentColor" strokeWidth="2" className="text-blue-400 dark:text-blue-500" />
          <path d="M-100,300 C200,550 450,200 650,400 C850,600 1000,250 1100,450" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 dark:text-slate-600" />
          <path d="M-100,500 C150,800 400,400 600,650 C800,900 950,500 1100,700" stroke="currentColor" strokeWidth="2" className="text-blue-300 dark:text-blue-400" />
          <path d="M-100,700 C250,950 500,650 750,850 C950,1050 1050,750 1100,900" stroke="currentColor" strokeWidth="1.5" className="text-slate-300 dark:text-slate-700" />
          <path d="M-100,850 C200,1100 600,800 850,1050 C1000,1200 1050,950 1100,1100" stroke="currentColor" strokeWidth="2" className="text-blue-200 dark:text-blue-600" />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/40 dark:via-transparent to-slate-50 dark:to-slate-950" />
    </div>
  )
}