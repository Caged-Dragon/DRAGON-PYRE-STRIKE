import { Link } from 'react-router-dom'
import { Heart, Play, Star, ExternalLink } from 'lucide-react'
import GameThumb from '@/components/GameThumb'
import type { GameMeta } from '@/data/games'
import { CATEGORIES } from '@/data/categories'
import { useFavorites } from '@/hooks/usePlayerData'
import { useTilt } from '@/hooks/useTilt'
import { formatPlayCount } from '@/utils/format'

export default function GameCard({ game }: { game: GameMeta }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const tilt = useTilt<HTMLElement>(6)
  const fav = isFavorite(game.slug)
  const categoryLabel = CATEGORIES.find((c) => c.id === game.category)?.title ?? game.category

  return (
    <article
      ref={tilt.ref}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
      className="game-card glow-border spot group flex flex-col overflow-hidden rounded-2xl border border-text/10"
    >
      <Link to={`/games/${game.slug}`} className="btn-focus relative block aspect-[4/3] overflow-hidden">
        <GameThumb
          title={game.title}
          icon={game.icon}
          gradient={game.gradient}
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Desktop hover overlay — mobile never depends on hover */}
        <div className="absolute inset-0 hidden items-center justify-center bg-black/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 [@media(hover:hover)]:flex">
          <span className="btn-glow flex translate-y-3 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-bg shadow-lg transition-transform duration-300 group-hover:translate-y-0">
            <Play className="h-3.5 w-3.5 fill-bg" /> {game.externalUrl ? 'View Details' : 'Play Now'}
          </span>
        </div>
        <div className="absolute left-2 top-2 flex gap-1">
          {game.new && <span className="badge bg-secondary text-bg">NEW</span>}
          {game.hot && <span className="badge animate-pulseGlow bg-danger text-white">HOT</span>}
        </div>
      </Link>

      <button
        onClick={() => toggleFavorite(game.slug)}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
        className="btn-focus absolute right-2 top-2 z-10 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition-transform duration-200 hover:scale-110 active:scale-90"
      >
        <Heart className={`h-4 w-4 transition-all duration-300 ${fav ? 'scale-110 fill-danger text-danger' : ''}`} />
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-[clamp(0.6rem,0.4rem+0.6vw,0.9rem)]">
        <Link
          to={`/games/${game.slug}`}
          className="gc-title btn-focus line-clamp-1 rounded font-display text-[length:clamp(0.85rem,0.78rem+0.3vw,1.05rem)] font-semibold text-text transition-colors hover:text-primary"
        >
          {game.title}
        </Link>
        <div className="gc-meta flex items-center justify-between gap-2 text-xs text-textMuted">
          <span className="truncate">{categoryLabel}</span>
          <span className="stat-mono flex shrink-0 items-center gap-1">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {game.rating.toFixed(1)}
          </span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="stat-mono truncate text-xs text-muted">{formatPlayCount(game.playCount)} plays</span>
          {game.externalUrl ? (
            <a href={game.externalUrl} className="btn-focus flex items-center gap-0.5 rounded text-xs font-semibold text-primary [@media(hover:hover)]:hidden">
              Play <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Link to={`/games/${game.slug}/play`} className="btn-focus rounded text-xs font-semibold text-primary [@media(hover:hover)]:hidden">
              Play →
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
