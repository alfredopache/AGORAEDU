"use client"

import { useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

export default function PostImage({ src, alt }: { src: string; alt: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Imagen que dispara el Lightbox */}
      <div 
        className="relative mb-12 aspect-video overflow-hidden rounded-xl border border-border max-w-5xl mx-auto cursor-zoom-in group"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          priority
        />
      </div>

      {/* Overlay del Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 bg-background/80"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 text-foreground/80 hover:text-foreground transition-colors z-60"
          >
            <X className="h-6 w-6" />
          </button>
          
          <div
            className="relative max-h-[85vh] max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src || "/placeholder.svg"}
              alt={alt}
              width={1600}
              height={900}
              className="h-auto max-h-[85vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}