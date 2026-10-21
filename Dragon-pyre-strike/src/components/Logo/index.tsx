import { Link } from 'react-router-dom'

/** The illustrated brand icon (dragon coiled around the "DS" monogram). Used
 *  in the header, footer, and loading contexts. For favicon and the loading
 *  spinner specifically, see public/favicon.svg -- a raster crop can't stay
 *  crisp at 16-32px, so that context gets a simplified vector mark instead. */
export function Mark({ className = 'h-9 w-auto' }: { className?: string }) {
  return <img src="/logo-icon.png" alt="" aria-hidden="true" className={`${className} object-contain drop-shadow-[0_0_10px_rgba(220,38,38,0.35)]`} />
}

/** The full illustrated lockup (dragon + monogram + wordmark + tagline) for
 *  large marketing placements -- hero moments, footer, empty states. */
export function FullLockup({ className = 'w-64' }: { className?: string }) {
  return <img src="/logo-full.png" alt="DracoPyre Strike -- One Realm. Every Game." className={`${className} object-contain`} />
}

export default function Logo({ withTagline = false, linkTo = '/' }: { withTagline?: boolean; linkTo?: string | null }) {
  const content = (
    <span className="inline-flex items-center gap-2.5">
      <Mark className="h-[clamp(2rem,1.6rem+1.2vw,2.75rem)] w-auto shrink-0" />
      <span className="logo-word flex flex-col leading-none">
        <span className="whitespace-nowrap font-display text-[length:clamp(0.95rem,0.8rem+0.6vw,1.2rem)] font-bold tracking-tight">
          DRACO<span className="text-gradient">PYRE</span> STRIKE
        </span>
        {withTagline && (
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">One Realm. Every Game.</span>
        )}
      </span>
    </span>
  )

  if (!linkTo) return content
  return (
    <Link to={linkTo} className="btn-focus rounded-lg" aria-label="DracoPyre Strike -- home">
      {content}
    </Link>
  )
}
