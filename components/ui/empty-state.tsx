import { SearchX } from "lucide-react"
import { motion } from "@/lib/motion"

export function EmptyState({ title = "No se encontraron resultados", subtitle = "Intenta ajustar tus filtros o buscar otra categoría." }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem]"
    >
      <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
        <SearchX className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{subtitle}</p>
    </motion.div>
  )
}