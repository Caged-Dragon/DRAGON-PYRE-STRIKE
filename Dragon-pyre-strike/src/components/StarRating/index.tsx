import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: 'md' | 'lg'
  label?: string
}

export default function StarRating({ value, onChange, size = 'lg', label = 'Rating' }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value
  const starSize = size === 'lg' ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-6 w-6'

  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onMouseEnter={() => setHovered(n)}
          onFocus={() => setHovered(n)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(n)}
          className="btn-focus rounded-full p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <Star className={`${starSize} transition-colors ${n <= display ? 'fill-secondary text-secondary' : 'fill-transparent text-muted'}`} />
        </button>
      ))}
    </div>
  )
}
