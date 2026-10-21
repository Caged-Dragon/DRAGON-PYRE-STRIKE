import { Link, useParams } from 'react-router-dom'
import { Play, Heart, Star, Users, Keyboard, Smartphone, Sparkles, Frown, ExternalLink } from 'lucide-react'
import GameThumb from '@/components/GameThumb'
import GameGrid from '@/components/GameGrid'
import EmptyState from '@/components/EmptyState'
import { getGameBySlug, getRelatedGames, type GameMeta } from '@/data/games'
import { CATEGORIES } from '@/data/categories'
import { useFavorites, useHighScore } from '@/hooks/usePlayerData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatPlayCount, formatScore } from '@/utils/format'

export default function GameDetails() {
  const { slug } = useParams()
  const game = getGameBySlug(slug)

  useDocumentMeta(
    game ? `${game.title} — Play Free Online — DracoPyre Strike` : 'Game Not Found — DracoPyre Strike',
    game?.description ?? 'This game could not be found on DracoPyre Strike.',
  )

  if (!game) {
    return (
      <div className="mx-auto max-w-xl py-16 px-fluid">
        <EmptyState
          icon={Frown}
          title="We couldn't find this game"
          description="It may have been removed, or the link might be off. Browse the full library instead."
          actionLabel="Browse Games"
          actionTo="/games"
        />
      </div>
    )
  }

  return <GameDetailsContent game={game} />
}

function GameDetailsContent({ game }: { game: GameMeta }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { best } = useHighScore(game.slug, game.scoreDirection)
  const fav = isFavorite(game.slug)
  const categoryLabel = CATEGORIES.find((c) => c.id === game.category)?.title ?? game.category
  const related = getRelatedGames(game)

  return (
    <div>
      <div className={`relative overflow-hidden bg-gradient-to-br ${game.gradient}`}>
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        <div className="container-fluid relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[320px_1fr] lg:items-center">
          <GameThumb
            title={game.title}
            icon={game.icon}
            gradient={game.gradient}
            className="aspect-square w-full max-w-xs rounded-2xl border border-white/15 shadow-glow sm:max-w-none"
            iconClassName="h-16 w-16"
          />
          <div>
            <Link
              to={`/category/${game.category}`}
              className="btn-focus inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {categoryLabel}
            </Link>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">{game.title}</h1>
            <p className="mt-3 max-w-xl text-white/85">{game.shortDescription}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
              <span className="stat-mono flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {game.rating.toFixed(1)}
              </span>
              <span className="stat-mono flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {formatPlayCount(game.playCount)} plays
              </span>
              {game.hasScore && best !== undefined && (
                <span className="stat-mono flex items-center gap-1.5">Your best: {formatScore(best, game.scoreUnit)}</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {game.externalUrl ? (
                <a href={game.externalUrl} className="btn-focus flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2">
                  <Play className="h-4 w-4 fill-white" /> Play Now <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link to={`/games/${game.slug}/play`} className="btn-focus flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2">
                  <Play className="h-4 w-4 fill-white" /> Play Now
                </Link>
              )}
              <button
                onClick={() => toggleFavorite(game.slug)}
                aria-pressed={fav}
                className="btn-focus flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <Heart className={`h-4 w-4 ${fav ? 'fill-danger text-danger' : ''}`} />
                {fav ? 'Saved' : 'Save'}
              </button>
            </div>
            {game.externalUrl && <p className="mt-3 text-xs text-white/70">Opens {game.title} on its own site. Use Exit there to return here.</p>}
          </div>
        </div>
      </div>

      <div className="container-fluid grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-lg font-bold">About {game.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-textMuted sm:text-base">{game.description}</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold">How to Play</h2>
            <ol className="mt-3 space-y-2.5">
              {game.howToPlay.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-textMuted sm:text-base">
                  <span className="stat-mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-secondary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Keyboard className="h-4 w-4 text-secondary" /> Desktop Controls
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-textMuted">
                {game.controls.desktop.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Smartphone className="h-4 w-4 text-secondary" /> Mobile Controls
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-textMuted">
                {game.controls.mobile.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <Sparkles className="h-4 w-4 text-secondary" /> Features
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {game.features.map((f) => (
                <span key={f} className="rounded-full border border-text/10 bg-surface px-3 py-1.5 text-xs text-textMuted">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-text/5 bg-surface p-5">
          <h2 className="eyebrow mb-3">Quick Facts</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Category" value={categoryLabel} />
            <Row label="Rating" value={`${game.rating.toFixed(1)} / 5`} />
            <Row label="Plays" value={formatPlayCount(game.playCount)} />
            <Row label="Released" value={new Date(game.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} />
          </dl>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-fluid pb-14">
          <h2 className="mb-5 font-display text-xl font-bold sm:text-2xl">You May Also Like</h2>
          <GameGrid games={related} />
        </section>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-text/5 pb-2">
      <dt className="text-textMuted">{label}</dt>
      <dd className="stat-mono text-text">{value}</dd>
    </div>
  )
}
