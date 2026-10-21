import { Link } from 'react-router-dom'
import { ArrowRight, Crosshair, Compass, Joystick, Puzzle, Car, Volleyball, Swords, Coffee, Users, type LucideIcon } from 'lucide-react'
import type { Category } from '@/data/categories'
import { GAMES } from '@/data/games'
import { useTilt } from '@/hooks/useTilt'

const ICONS: Record<string, LucideIcon> = { Crosshair, Compass, Joystick, Puzzle, Car, Volleyball, Swords, Coffee, Users }

export default function CategoryCard({ category }: { category: Category }) {
  const Icon = ICONS[category.icon] ?? Joystick
  const count = GAMES.filter((g) => g.category === category.id).length
  const tilt = useTilt<HTMLAnchorElement>(7)
  return (
    <Link
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      to={`/category/${category.id}`}
      className={`game-card glow-border spot group btn-focus flex min-h-[clamp(8rem,6rem+8vw,10.5rem)] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-[clamp(0.9rem,0.6rem+1vw,1.4rem)]`}
    >
      <div className="absolute inset-0 bg-black/30 transition-colors duration-500 group-hover:bg-black/10" aria-hidden="true" />
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15 blur-2xl transition-transform duration-700 group-hover:scale-150" aria-hidden="true" />
      <Icon className="relative h-[clamp(1.5rem,1.2rem+1vw,2rem)] w-[clamp(1.5rem,1.2rem+1vw,2rem)] text-white drop-shadow transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125" strokeWidth={1.75} aria-hidden="true" />
      <div className="relative">
        <h3 className="font-display text-[length:clamp(1rem,0.9rem+0.5vw,1.3rem)] font-bold text-white">{category.title}</h3>
        <p className="stat-mono mt-0.5 text-xs text-white/80">
          {count} {count === 1 ? 'game' : 'games'}
        </p>
      </div>
      <ArrowRight className="relative mt-3 h-4 w-4 text-white/80 transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true" />
    </Link>
  )
}
