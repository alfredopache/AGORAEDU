export function SkeletonCard() {
  return (
    <div className="group relative rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-4 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      <div className="aspect-[16/10] w-full rounded-[1.8rem] bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
      <div className="px-4 pb-4 space-y-4">
        <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-md" />
          <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-md" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}