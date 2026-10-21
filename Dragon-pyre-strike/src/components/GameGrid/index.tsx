import GameCard from '@/components/GameCard'
import Reveal from '@/components/Reveal'
import { GameCardSkeletonGrid } from '@/components/Skeletons'
import type { GameMeta } from '@/data/games'

interface GameGridProps {
  games: GameMeta[]
  loading?: boolean
  skeletonCount?: number
}

/** Fluid auto-fill grid: column count and card width flex continuously with the screen. */
export default function GameGrid({ games, loading = false, skeletonCount = 8 }: GameGridProps) {
  if (loading) return <GameCardSkeletonGrid count={skeletonCount} />
  return (
    <div className="fluid-grid">
      {games.map((game, i) => (
        <Reveal key={game.slug} delay={Math.min(i, 9) * 55}>
          <GameCard game={game} />
        </Reveal>
      ))}
    </div>
  )
}
