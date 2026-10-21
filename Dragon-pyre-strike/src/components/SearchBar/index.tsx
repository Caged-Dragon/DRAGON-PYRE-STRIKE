import { Search as SearchIcon, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchBar({ value, onChange, placeholder = 'Search games, categories, tags...', autoFocus }: SearchBarProps) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search games"
        className="btn-focus w-full rounded-2xl border border-text/10 bg-surface py-3.5 pl-12 pr-11 text-sm text-text placeholder:text-muted sm:text-base"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="btn-focus absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
