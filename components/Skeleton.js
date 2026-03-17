// Skeleton loader reutilizable
// Uso: <Skeleton className="h-10 w-full rounded-lg" />

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[#e5e7eb] rounded ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="glass-panel p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function SkeletonPanel() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="glass-panel p-5 h-[320px] space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-full w-full rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-panel p-5 flex justify-between items-center gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="border-b border-[#f3f4f6] p-4 flex gap-4">
        {[40, 28, 16, 16].map((w, i) => (
          <Skeleton key={i} className={`h-3 w-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-[#f3f4f6] p-4 flex gap-4 items-center">
          <Skeleton className="h-4 w-40 flex-shrink-0" />
          <Skeleton className="h-3 w-28 hidden sm:block" />
          <Skeleton className="h-4 w-16 ml-auto" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
