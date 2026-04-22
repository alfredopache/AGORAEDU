"use client"

import React, { useRef, useState } from 'react'
import { motion } from '@/lib/motion'

export default function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    if (ref.current) {
      const { width, height, left, top } = ref.current.getBoundingClientRect();
      
      // Calculamos el centro del elemento
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calculamos la distancia desde el mouse al centro (con un factor de fuerza de 0.35)
      const x = (clientX - centerX) * 0.35;
      const y = (clientY - centerY) * 0.35;

      setPosition({ x, y });
    }
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  )
}