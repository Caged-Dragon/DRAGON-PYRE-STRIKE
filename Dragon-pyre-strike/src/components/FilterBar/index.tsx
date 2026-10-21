import { SlidersHorizontal } from 'lucide-react'
import { CATEGORIES } from '@/data/categories'
import type { SortKey } from '@/data/games'

interface FilterBarProps {
  category?: string
  onCategoryChange?: (v: string) => void
  sort: string
  onSortChange: (v: SortKey) => void
  showCategory?: boolean
  resultCount?: number
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Most Played' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'A\u2013Z' },
]

export default function FilterBar({ category, onCategoryChange, sort, onSortChange, showCategory = true, resultCount }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {typeof resultCount === 'number' && (
        <span className="stat-mono mr-auto text-sm text-textMuted">
          {resultCount} {resultCount === 1 ? 'game' : 'games'}
        </span>
      )}
      {showCategory && onCategoryChange && (
        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by category"
            className="btn-focus appearance-none rounded-full border border-text/10 bg-surface py-2 pl-8 pr-8 text-sm text-text"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        aria-label="Sort games"
        className="btn-focus rounded-full border border-text/10 bg-surface px-3.5 py-2 text-sm text-text"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
