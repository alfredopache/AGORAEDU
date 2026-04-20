"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Linkedin, 
  Github, 
  X, 
  Instagram, 
  Globe, 
  User,
  Youtube,
  Tv,
  MessageSquare,
  Palette,
  Dribbble,
  type LucideIcon 
} from "lucide-react"

interface TeamMemberProps {
  member: {
    name: string
    role: string
    image: string
    bio?: string
    socials?: Array<{
      platform: string
      url: string
    }> 
  }
}

const SOCIAL_CONFIG: Record<string, { icon: LucideIcon, color: string, label: string }> = {
  linkedin: { icon: Linkedin, color: "hover:text-blue-500 hover:bg-blue-500/10", label: "LinkedIn" },
  github: { icon: Github, color: "hover:text-white hover:bg-white/10", label: "GitHub" },
  x: { icon: X, color: "hover:text-white hover:bg-white/10", label: "X" },
  instagram: { icon: Instagram, color: "hover:text-pink-500 hover:bg-pink-500/10", label: "Instagram" },
  globe: { icon: Globe, color: "hover:text-emerald-400 hover:bg-emerald-400/10", label: "Website" },
  youtube: { icon: Youtube, color: "hover:text-red-500 hover:bg-red-500/10", label: "YouTube" },
  twitch: { icon: Tv, color: "hover:text-purple-500 hover:bg-purple-500/10", label: "Twitch" },
  discord: { icon: MessageSquare, color: "hover:text-indigo-400 hover:bg-indigo-400/10", label: "Discord" },
  behance: { icon: Palette, color: "hover:text-blue-600 hover:bg-blue-600/10", label: "Behance" },
  dribbble: { icon: Dribbble, color: "hover:text-pink-400 hover:bg-pink-400/10", label: "Dribbble" },
}

export function TeamMemberCard({ member }: TeamMemberProps) {
  const [isHovered, setIsHovered] = useState(false)
  const hasImage = member.image && member.image.trim() !== "";

  return (
    <motion.div
      layout
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex flex-col p-4 rounded-[2.5rem] border transition-colors duration-500
        ${isHovered 
          ? "border-white/40 bg-white/20 dark:bg-slate-800/40 shadow-2xl shadow-blue-500/10" 
          : "border-white/20 bg-white/10 dark:bg-slate-900/40 shadow-none"}
        backdrop-blur-xl overflow-hidden
      `}
    >
      {/* Contenedor de Imagen y Badge Principal */}
      <motion.div layout className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-slate-200 dark:bg-slate-800">
        {hasImage ? (
          <Image 
            src={member.image} 
            alt={member.name} 
            fill 
            className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-slate-400">
            <User size={64} strokeWidth={1} />
          </div>
        )}
        
        {/* Gradiente reforzado para soportar más líneas de texto */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-95' : 'opacity-75'}`} />
        
        {/* Contenedor de texto con crecimiento vertical */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <motion.h3 layout className="text-2xl font-bold tracking-tight mb-1">
            {member.name}
          </motion.h3>
          
          {/* Texto que baja: Eliminado line-clamp, añadido whitespace-normal */}
          <motion.p 
            layout 
            className="text-xs font-semibold text-blue-400 uppercase tracking-widest leading-snug whitespace-normal break-words"
          >
            {member.role}
          </motion.p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-6 pb-2 px-2">
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed"
              >
                {member.bio || "Sin biografía disponible."}
              </motion.p>
              
              <div className="flex gap-2.5 items-center flex-wrap">
                {member.socials && member.socials.map((social, index) => {
                  const config = SOCIAL_CONFIG[social.platform.toLowerCase()];
                  if (!config || !social.url) return null;
                  
                  const Icon = config.icon;
                  
                  return (
                    <motion.a 
                      key={social.platform + index}
                      href={social.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 + (index * 0.05) }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`
                        group p-3 rounded-2xl bg-white/5 border border-white/10 
                        transition-all duration-300 shadow-sm
                        ${config.color}
                      `}
                      title={config.label}
                    >
                      <Icon size={18} strokeWidth={2.5} />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}