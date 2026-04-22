"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import { ThemeSelector } from "@/components/theme-selector"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "@/lib/motion"
import { AdminLink } from "./admin-link"
import Magnetic from "./magnetic"
import { cn } from "@/lib/utils"
import GoogleSignIn from "@/components/google-signin"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Proyectos", href: "/proyectos" },
  { label: "Recursos", href: "/recursos" },
  { label: "Multimedia", href: "/multimedia" },
  { label: "Acceso IA", href: "/eduia", special: true },
  { label: "Sobre nosotros", href: "/sobre-nosotros" },
]

interface LatestProject {
  title: string
  slug: string
}

export function BlogNav({ latestProject }: { latestProject?: LatestProject | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-2 pointer-events-none">
      <nav 
        className={cn(
          "pointer-events-auto relative flex items-center justify-between w-[98%] max-w-[1800px] mx-auto px-4 sm:px-8 transition-all duration-500 ease-in-out",
          scrolled 
            ? "py-3 rounded-[2rem] bg-white/90 dark:bg-slate-950/70 backdrop-blur-xl border border-slate-300 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]" 
            : "py-5 rounded-none bg-transparent border-transparent"
        )}
      >
        {/* LADO IZQUIERDO: Logo y Latest */}
        <div className="flex items-center gap-6"> 
          <Magnetic>
            <Link 
              href="/" 
              className="flex items-center font-serif text-2xl font-bold tracking-tighter shrink-0 block transition-colors duration-300 text-black dark:text-white"
            >
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              Agora<span className="text-blue-600 dark:text-blue-400">Edu</span>
            </Link>
          </Magnetic>

          {latestProject && (
            <div className="hidden lg:block">
              <Magnetic>
                <Link
                  href={`/proyectos/${latestProject.slug}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group backdrop-blur-md",
                    scrolled 
                      ? "bg-blue-100/50 border-blue-200 text-black dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-white" 
                      : "bg-black/5 border-black/10 text-black dark:bg-white/10 dark:border-white/20 dark:text-white"
                  )}
                >
                  <div className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", scrolled ? "bg-blue-400" : "bg-blue-500")}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", scrolled ? "bg-blue-500" : "bg-blue-600")}></span>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", scrolled ? "text-blue-700 dark:text-blue-400" : "text-black/70 dark:text-white")}>
                    Reciente
                  </span>
                  <span className={cn("text-[11px] font-bold truncate max-w-[120px] transition-colors text-black dark:text-white/90 group-hover:text-blue-600")}>
                    {latestProject.title}
                  </span>
                </Link>
              </Magnetic>
            </div>
          )}
        </div>

        {/* CENTRO: Enlaces de navegación */}
        <div className={cn(
          "hidden md:flex items-center p-1 rounded-full border transition-all duration-500",
          scrolled 
            ? "bg-slate-200/50 dark:bg-white/5 border-slate-300 dark:border-white/5 backdrop-blur-sm" 
            : "bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 backdrop-blur-sm"
        )}>
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              const isSpecial = link.special
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={cn(
                      "px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all rounded-full relative z-10 block whitespace-nowrap",
                      isSpecial
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                        : isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : scrolled 
                          ? "text-black/60 hover:text-black dark:text-slate-400 dark:hover:text-white" 
                          : "text-black/70 hover:text-black dark:text-white/80 dark:hover:text-white"
                    )}
                  >
                    {isSpecial && "🤖 "}
                    {link.label}
                  </Link>
                  {isActive && !isSpecial && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white dark:bg-white/10 rounded-full shadow-sm z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* LADO DERECHO: Theme y Admin */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <AdminLink />
          </div>
          <div className="hidden md:block">
            <GoogleSignIn />
          </div>
          <div className={cn(
            "hidden md:flex p-1 rounded-full border transition-all",
            scrolled 
              ? "bg-white dark:bg-white/5 border-slate-300 dark:border-white/10 shadow-sm" 
              : "bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/20"
          )}>
            <ThemeSelector />
          </div>
          
          <div className="md:hidden flex items-center gap-2">
            <ThemeSelector />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "p-2.5 rounded-full border transition-all pointer-events-auto",
                scrolled 
                  ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-black dark:text-white" 
                  : "bg-black/5 border-black/10 dark:bg-white/10 dark:border-white/20 text-black dark:text-white backdrop-blur-md"
              )}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menú Móvil */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-[calc(100%+1rem)] left-0 right-0 rounded-[2.5rem] border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/95 backdrop-blur-2xl p-8 md:hidden shadow-2xl z-50 pointer-events-auto"
            >
              <div className="flex flex-col gap-6">
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "block py-3 px-4 text-xl font-serif font-bold rounded-2xl transition-all",
                          link.special
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                            : pathname === link.href 
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-500/10" 
                            : "text-black dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
                        )}
                      >
                        {link.special && "🤖 "}
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                  <AdminLink />
                  <div className="pt-2">
                    <GoogleSignIn />
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  )
}
