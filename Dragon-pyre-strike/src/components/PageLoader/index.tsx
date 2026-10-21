/** Inline SVG mirror of public/favicon.svg -- used here (instead of the
 *  raster Logo/Mark) so the loading indicator never itself depends on a
 *  network image fetch, and spins cleanly at any size. */
function ClawMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pl-claw-g" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FBBF24" />
          <stop offset="0.5" stopColor="#F97316" />
          <stop offset="1" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="rgb(var(--color-surface))" />
      <g stroke="url(#pl-claw-g)" strokeWidth="6.5" strokeLinecap="round">
        <path d="M14 14 L28 50" />
        <path d="M28 10 L42 54" />
        <path d="M42 14 L54 46" />
      </g>
    </svg>
  )
}

export default function PageLoader({ label = 'Loading', fullHeight = false }: { label?: string; fullHeight?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'min-h-[70vh]' : 'py-16'}`}
      role="status"
      aria-live="polite"
    >
      <ClawMark className="h-10 w-10 animate-spinSlow" />
      <span className="stat-mono text-xs uppercase tracking-widest text-muted">{label}</span>
    </div>
  )
}
