"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { client } from "@/lib/sanity"
import { motion, AnimatePresence } from "@/lib/motion"

export function AdminLink() {
  const [isLogged, setIsLogged] = useState(false)

useEffect(() => {
    async function checkAuth() {
      try {
        // Usamos la API fetch directamente si el cliente de Sanity da problemas
        // Esto asegura que el navegador envíe las cookies (credentials: 'include')
        const projectId = client.config().projectId;
        const dataset = client.config().dataset;
        
        const response = await fetch(
          `https://${projectId}.api.sanity.io/v2026-02-13/users/me`, 
          { credentials: 'include' }
        );

        if (response.ok) {
          const user = await response.json();
          if (user && user.id) {
            setIsLogged(true);
          }
        } else {
          setIsLogged(false);
        }
      } catch (error) {
        setIsLogged(false);
      }
    }

    checkAuth();
  }, []);

  // Solo renderizamos si el estado es estrictamente true
  if (!isLogged) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center"
      >
        <Link 
          href="/admin" 
          className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-600/20 rounded-full transition-all"
        >
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest">
            Admin
          </span>
        </Link>
      </motion.div>
    </AnimatePresence>
  )
}