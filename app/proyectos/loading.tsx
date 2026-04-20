import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <main className="max-w-7xl mx-auto px-6 pt-40 pb-24">
      <div className="mb-16 space-y-4">
        <div className="h-12 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
        <div className="h-6 w-1/2 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </main>
  )
}