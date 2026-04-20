"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface Stat {
  label: string
  value: string
  icon: ReactNode
}

export function StatsTicker({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative py-10 border-y border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 overflow-hidden">
      <div className="flex whitespace-nowrap">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-20 items-center pr-20"
        >
          {[...stats, ...stats, ...stats].map((stat, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-4xl md:text-6xl font-black tracking-tighter tabular-nums flex items-center gap-3">
                  <span className="text-blue-600 dark:text-blue-500 text-2xl">{stat.icon}</span>
                  {stat.value}
                </span>
                <span className="text-xs uppercase tracking-[0.1em] font-bold text-slate-400 dark:text-slate-500">
                  {stat.label}
                </span>
              </div>
              <div className="h-12 w-px bg-slate-200 dark:bg-white/10 ml-10" />
            </div>
          ))}
        </motion.div>
      </div>
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10" />
    </section>
  )
}