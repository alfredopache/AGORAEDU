"use client"

import React, { useEffect, useRef, useState } from "react"
import { Play, Pause } from "lucide-react"
import Magnetic from "@/components/magnetic"

export function DataNodes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const [isPaused, setIsPaused] = useState(false)

  // ... (Efecto useEffect del canvas igual que antes)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let animationFrameId: number
    let particles: Particle[] = []
    let particleCount = 75
    let connectionDist = 280
    let mouseDist = 250

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number; color: string;
      constructor() {
        this.x = Math.random() * canvas!.width
        this.y = Math.random() * canvas!.height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.size = Math.random() * 1.5 + 0.5
        this.color = Math.random() > 0.5 ? "#22d3ee" : "#818cf8"
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1
      }
      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
      }
    }

    const init = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (window.innerWidth < 768) {
        particleCount = 25
        connectionDist = 150
        mouseDist = 0
      } else {
        particleCount = 75
        connectionDist = 320
        mouseDist = 250
      }
      particles = Array.from({ length: particleCount }, () => new Particle())
    }

    const animate = () => {
      if (isPaused) return 
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p1, i) => {
        p1.update()
        p1.draw()
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDist) {
            ctx.beginPath()
            const opacity = 1 - (dist / connectionDist)
            ctx.strokeStyle = `rgba(129, 140, 248, ${opacity * 0.2})` 
            ctx.lineWidth = 0.5
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
        if (mouseDist > 0) {
          const mdx = p1.x - mouseRef.current.x
          const mdy = p1.y - mouseRef.current.y
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
          if (mDist < mouseDist) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(34, 211, 238, ${(1 - mDist / mouseDist) * 0.3})`
            ctx.lineWidth = 0.8
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
            ctx.stroke()
          }
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    init()
    animate()
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener("resize", init)
    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", init)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isPaused])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className={`transition-opacity duration-1000 ${isPaused ? 'opacity-30' : 'opacity-100'}`}
      />
      
      {/* PANEL DE CONTROL */}
<div className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-50 pointer-events-auto">
  <Magnetic>
    <div className="group relative flex items-center justify-center">
      
      {/* TEXTO FLOTANTE - Solo visible en desktop para no saturar el móvil */}
      <span className="hidden md:block absolute right-full mr-4 opacity-0 -translate-x-2 pointer-events-none whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        {isPaused ? "Reanudar" : "Pausar"}
      </span>

      {/* BOTÓN - Un poco más pequeño en móvil para ser menos intrusivo */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full 
                   bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl 
                   border border-slate-200/30 dark:border-white/10 
                   text-slate-600 dark:text-slate-400 
                   hover:text-blue-500 dark:hover:text-cyan-400 
                   hover:border-blue-500/50 transition-all duration-300 shadow-xl"
      >
        <div className="relative flex items-center justify-center">
          {isPaused ? (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          ) : (
            <Pause size={16} fill="currentColor" />
          )}
          
          {!isPaused && (
            <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
          )}
        </div>
      </button>

    </div>
  </Magnetic>
</div>
    </div>
  )
}