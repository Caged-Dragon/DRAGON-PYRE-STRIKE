import type { ReactNode } from 'react'

/** Endless, hover-to-pause ticker. Content is rendered twice for a seamless loop. */
export default function Marquee({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="marquee" role="region" aria-label={label ?? 'Ticker'}>
      <div className="marquee-track">
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
