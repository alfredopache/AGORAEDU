import { BlogSkeleton } from "@/components/ui/blog-skeleton"

export default function BlogLoading() {
  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950 pt-32 pb-24 overflow-hidden">
      {/* Orbes de luz decorativos para que el loading no se vea vacío */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Skeleton del Header de la página */}
        <div className="mb-20 space-y-6">
          <div className="h-6 w-32 bg-blue-200/50 dark:bg-blue-500/10 animate-pulse rounded-full" />
          <div className="space-y-3">
            <div className="h-16 md:h-20 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
            <div className="h-16 md:h-20 w-1/2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          </div>
          <div className="h-6 w-2/3 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg" />
        </div>

        {/* Grid de Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <BlogSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  )
}