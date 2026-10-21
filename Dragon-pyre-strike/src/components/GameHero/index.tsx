import { Link } from 'react-router-dom'
import { Play, Info, Star, Users, ExternalLink, Flame } from 'lucide-react'
import GameThumb from '@/components/GameThumb'
import Reveal from '@/components/Reveal'
import type { GameMeta } from '@/data/games'
import { CATEGORIES } from '@/data/categories'
import { useTilt } from '@/hooks/useTilt'
import { formatPlayCount } from '@/utils/format'

export default function GameHero({ game }: { game: GameMeta }) {
  const categoryLabel = CATEGORIES.find((c) => c.id === game.category)?.title ?? game.category
  const tilt = useTilt<HTMLDivElement>(9)
  const cta =
    'btn-focus btn-glow flex items-center gap-2 rounded-full px-[clamp(1.2rem,0.9rem+1vw,1.9rem)] py-[clamp(0.7rem,0.55rem+0.4vw,0.95rem)] text-sm font-bold'

  return (
    <section className="hero">
      <div className="hero-art" aria-hidden="true" />
      <div className="hero-veil" aria-hidden="true" />
      <div className="container-fluid hero-inner">
        <div className="min-w-0 animate-fadeUp">
          <p className="eyebrow mb-[clamp(0.7rem,0.5rem+0.6vw,1.2rem)]">Featured · Free to play</p>
          <h1 className="hero-title title-forge">{game.title}</h1>
          <p className="hero-lead mt-[clamp(0.8rem,0.5rem+1vw,1.5rem)] max-w-xl text-textMuted">{game.shortDescription}</p>

          <div className="mt-[clamp(1rem,0.7rem+1vw,1.6rem)] flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <span className="hero-chip">
              <Flame className="h-3.5 w-3.5 text-primary-2" /> {categoryLabel}
            </span>
            <span className="stat-mono flex items-center gap-1.5 text-sm text-textMuted">
              <Star className="h-4 w-4 fill-warning text-warning" />
              {game.rating.toFixed(1)}
            </span>
            <span className="stat-mono flex items-center gap-1.5 text-sm text-textMuted">
              <Users className="h-4 w-4" />
              {formatPlayCount(game.playCount)} plays
            </span>
          </div>

          <div className="mt-[clamp(1.3rem,0.9rem+1.6vw,2.4rem)] flex flex-wrap items-center gap-3">
            {game.externalUrl ? (
              <a href={game.externalUrl} className={`${cta} btn-pulse bg-primary text-white shadow-glow`}>
                <Play className="h-4 w-4 fill-white" /> Play Now <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link to={`/games/${game.slug}/play`} className={`${cta} btn-pulse bg-primary text-white shadow-glow`}>
                <Play className="h-4 w-4 fill-white" /> Play Now
              </Link>
            )}
            <Link to={`/games/${game.slug}`} className={`${cta} border border-text/20 bg-text/10 text-text backdrop-blur-md`}>
              <Info className="h-4 w-4" /> View Details
            </Link>
          </div>
        </div>

        <Reveal from="right" delay={150} className="min-w-0 justify-self-center sm:justify-self-end">
          <div
            ref={tilt.ref}
            onPointerMove={tilt.onPointerMove}
            onPointerLeave={tilt.onPointerLeave}
            className="tilt hero-card glow-border spot glass animate-floatSlow overflow-hidden rounded-3xl p-[clamp(0.5rem,0.3rem+0.5vw,0.8rem)] shadow-glow"
            style={{ width: 'min(100%, clamp(15rem, 10rem + 22vw, 26rem))' }}
          >
            <GameThumb
              title={game.title}
              icon={game.icon}
              gradient={game.gradient}
              className="aspect-[4/3] w-full rounded-2xl"
              iconClassName="h-[34%] w-[34%]"
            />
            <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-3">
              <div className="min-w-0">
                <p className="eyebrow">Now trending</p>
                <p className="truncate font-display text-[length:clamp(0.95rem,0.85rem+0.4vw,1.15rem)] font-bold">{game.title}</p>
              </div>
              <span className="stat-mono flex shrink-0 items-center gap-1 text-sm font-bold text-secondary">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {game.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
