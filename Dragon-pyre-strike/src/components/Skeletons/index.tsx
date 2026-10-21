export function GameCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-text/5 bg-surface">
      <div className="aspect-[4/3] animate-pulse bg-surface2" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface2" />
      </div>
    </div>
  )
}

export function GameCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="container-fluid py-14" aria-hidden="true">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded bg-surface2" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-surface2" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-surface2" />
          <div className="h-11 w-40 animate-pulse rounded-full bg-surface2" />
        </div>
        <div className="aspect-[4/3] w-full max-w-md animate-pulse rounded-3xl bg-surface2 lg:justify-self-end" />
      </div>
    </div>
  )
}
