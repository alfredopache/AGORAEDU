export function BlogSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
      {/* Imagen del Post */}
      <div className="aspect-[16/9] w-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      
      <div className="p-8 flex flex-col flex-grow space-y-4">
        {/* Meta: Fecha y Tiempo */}
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />
          <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-full" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <div className="h-7 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-7 w-2/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        </div>

        {/* Extracto */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-md" />
          <div className="h-4 w-[90%] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-md" />
        </div>

        {/* Botón/Footer */}
        <div className="pt-4 mt-auto">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        </div>
      </div>
    </div>
  )
}