"use client"
import React from 'react'

interface DotsBackgroundProps {
  opacity?: string;
  dotSize?: string;
  spacing?: string;
}

export const DotsBackground = ({ 
  opacity = "opacity-[0.15] dark:opacity-[0.1]", 
  dotSize = "0.5px",
  spacing = "24px"
}: DotsBackgroundProps) => {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${opacity} mask-[radial-gradient(ellipse_at_center,white,transparent)]`}>
      <div 
        className="absolute inset-0" 
        style={{ 
          backgroundImage: `radial-gradient(currentColor ${dotSize}, transparent ${dotSize})`, 
          backgroundSize: `${spacing} ${spacing}` 
        }} 
      />
    </div>
  )
}