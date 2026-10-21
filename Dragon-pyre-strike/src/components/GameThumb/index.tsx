import {
  Rocket, Spline, Grid3x3, Blocks, Bird, Bomb, Brain, Scissors, Hash, Target,
  Crosshair, Compass, Joystick, Puzzle, Car, Volleyball, Swords, Coffee, Users, Gamepad2,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Rocket, Spline, Grid3x3, Blocks, Bird, Bomb, Brain, Scissors, Hash, Target,
  Crosshair, Compass, Joystick, Puzzle, Car, Volleyball, Swords, Coffee, Users, Gamepad2,
}

interface GameThumbProps {
  title: string
  icon: string
  gradient: string
  className?: string
  iconClassName?: string
}

function hash(str: string) {
  let h = 7
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

const PATTERNS = [
  (a: number) => ({ backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.55) 1px, transparent 0)`, backgroundSize: `${a}px ${a}px` }),
  (a: number) => ({ backgroundImage: `repeating-linear-gradient(45deg, rgb(255 255 255 / 0.22) 0 2px, transparent 2px ${a}px)` }),
  (a: number) => ({ backgroundImage: `linear-gradient(rgb(255 255 255 / 0.18) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.18) 1px, transparent 1px)`, backgroundSize: `${a + 6}px ${a + 6}px` }),
  (a: number) => ({ backgroundImage: `repeating-radial-gradient(circle at 70% 120%, rgb(255 255 255 / 0.2) 0 2px, transparent 2px ${a + 8}px)` }),
]

/** Procedural game/category artwork: a themed gradient tile + animated icon,
 *  per-title pattern, glow, rising embers and a hover sheen. No external image
 *  assets to license (Section 51). */
export default function GameThumb({ title, icon, gradient, className = '', iconClassName = '' }: GameThumbProps) {
  const Icon = ICONS[icon] ?? Gamepad2
  const h = hash(title)
  const pattern = PATTERNS[h % PATTERNS.length](12 + (h % 9))
  const embers = [0, 1, 2, 3].map((i) => ({
    left: 12 + ((h >> (i * 3)) % 76),
    delay: ((h >> (i + 2)) % 40) / 10,
    dx: ((h >> i) % 24) - 12,
  }))
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      <div className="absolute inset-0 opacity-30" style={pattern} aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-2xl" aria-hidden="true" />
      {embers.map((e, i) => (
        <i key={i} className="thumb-ember" style={{ left: `${e.left}%`, animationDelay: `${e.delay}s`, ['--dx' as string]: `${e.dx}px` }} aria-hidden="true" />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" aria-hidden="true" />
      <Icon className={`thumb-float relative text-white drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)] ${iconClassName || 'h-[34%] w-[34%] min-h-9 min-w-9'}`} strokeWidth={1.5} aria-hidden="true" />
      <div className="thumb-sheen" aria-hidden="true" />
      <span className="sr-only">{title}</span>
    </div>
  )
}
