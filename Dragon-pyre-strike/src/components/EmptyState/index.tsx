import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}

/** Shared empty/error state shell — used for favorites, search, recently
 *  played, and network-error states (Sections 31 & 34). */
export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-text/10 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface2">
        <Icon className="h-6 w-6 text-muted" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-textMuted">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="btn-focus mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary2"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="btn-focus mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
