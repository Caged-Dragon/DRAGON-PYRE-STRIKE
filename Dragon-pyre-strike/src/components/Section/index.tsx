import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from '@/components/Reveal'

interface SectionProps {
  eyebrow?: string
  title: string
  viewAllTo?: string
  children: ReactNode
}

export default function Section({ eyebrow, title, viewAllTo, children }: SectionProps) {
  return (
    <section className="container-fluid py-section">
      <Reveal className="mb-[clamp(1.1rem,0.8rem+1.2vw,2rem)] flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 className="section-title font-display font-bold">{title}</h2>
        </div>
        {viewAllTo && (
          <Link
            to={viewAllTo}
            className="btn-focus group flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-primary transition-colors hover:text-secondary"
          >
            View All <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        )}
      </Reveal>
      {children}
    </section>
  )
}
