"use client"
import React from 'react'

interface GridBackgroundProps {
  opacity?: string;
  gridColor?: string; // Clase de Tailwind para el color de las líneas
  dotSize?: string;   // Por si quieres que sea de puntos en lugar de líneas
}

export const GridBackground = ({ 
  opacity = "opacity-[0.15] dark:opacity-[0.1]", 
  gridColor = "currentColor" 
}: GridBackgroundProps) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${opacity}`}>
      {/* Malla de líneas */}
      <div 
        className="absolute inset-0 mask-[radial-gradient(ellipse_at_center,white,transparent)]" 
        style={{ 
          backgroundImage: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `, 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      {/* Degradado para suavizar los bordes */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/0 via-slate-50/50 to-slate-50 dark:from-slate-950/0 dark:via-slate-950/50 dark:to-slate-950" />
    </div>
  )
}