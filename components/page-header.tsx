"use client"
import { motion } from "framer-motion"

interface PageHeaderProps {
  badge: string;
  title: string;
  highlight: string;
  description: string;
  color?: "blue" | "purple" | "emerald"; // Colores dinámicos
}

export function PageHeader({ badge, title, highlight, description, color = "blue" }: PageHeaderProps) {
  const colorClasses = {
    blue: "border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500",
    purple: "border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400",
    emerald: "border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-500"
  }

  const currentSelection = colorClasses[color].split(" ");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`mb-16 border-l-4 ${currentSelection[0]} ${currentSelection[1]} pl-6`}
    >
      <p className={`mb-2 text-2xl uppercase tracking-[0.3em] font-bold ${currentSelection[2]} ${currentSelection[3]}`}>
        {badge}
      </p>
      <h2 className="font-serif text-4xl font-semibold text-slate-900 dark:text-white md:text-6xl text-balance">
        {title} <span className={`text-transparent bg-clip-text bg-linear-to-r ${currentSelection[4]} ${currentSelection[5]} ${currentSelection[6]} ${currentSelection[7]}`}>
          {highlight}
        </span>
      </h2>
      <p className="mt-4 text-lg text-slate-600 dark:text-white/50 max-w-2xl leading-relaxed">
        {description}
      </p>
    </motion.div>
  )
}