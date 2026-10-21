import { useEffect, useRef, useState, Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Maximize, Minimize, Volume2, VolumeX, Info, Award, Frown, ExternalLink, Play } from 'lucide-react'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageLoader from '@/components/PageLoader'
import EmptyState from '@/components/EmptyState'
import GameThumb from '@/components/GameThumb'
import { GAME_COMPONENTS } from '@/games/registry'
import { getGameBySlug } from '@/data/games'
import { useRecentlyPlayed, useHighScore, useSoundPreference } from '@/hooks/usePlayerData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatScore } from '@/utils/format'

export default function GamePlay() {
  const { slug } = useParams()
  const game = getGameBySlug(slug)
  const { addRecentlyPlayed } = useRecentlyPlayed()
  const { best, recordScore } = useHighScore(slug, game?.scoreDirection)
  const [soundOn, setSoundOn] = useSoundPreference()
  const [showHelp, setShowHelp] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)

  useDocumentMeta(game ? `Playing ${game.title} — DracoPyre Strike` : 'Game Not Found — DracoPyre Strike')

  useEffect(() => {
    if (game) addRecentlyPlayed(game.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.slug])

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  async function toggleFullscreen() {
    if (!stageRef.current) return
    try {
      if (!document.fullscreenElement) await stageRef.current.requestFullscreen()
      else await document.exitFullscreen()
    } catch {
      /* fullscreen not supported/permitted — ignore gracefully */
    }
  }

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

  if (game.externalUrl) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center px-fluid">
        <GameThumb title={game.title} icon={game.icon} gradient={game.gradient} className="mx-auto h-28 w-28 rounded-2xl shadow-glow" iconClassName="h-12 w-12" />
        <h1 className="mt-5 font-display text-xl font-bold">{game.title} lives on its own site</h1>
        <p className="mt-2 text-sm text-textMuted">This one's a full separate build, not an embedded page — Play Now takes you there, and its Exit button brings you back here.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href={game.externalUrl} className="btn-focus flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2">
            <Play className="h-4 w-4 fill-white" /> Play Now <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <Link to={`/games/${game.slug}`} className="btn-focus rounded-full border border-text/10 bg-surface px-6 py-3 text-sm font-semibold text-textMuted transition-colors hover:text-text">
            View Details
          </Link>
        </div>
      </div>
    )
  }

  const GameComponent = GAME_COMPONENTS[game.slug]

  if (!GameComponent) {
    return (
      <div className="mx-auto max-w-xl py-16 px-fluid">
        <EmptyState
          icon={Frown}
          title="This game isn't available yet"
          description="We're still building this one. Check back soon, or jump into another game."
          actionLabel="Browse Games"
          actionTo="/games"
        />
      </div>
    )
  }

  const hasBest = game.hasScore && best !== undefined

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={`/games/${game.slug}`}
          className="btn-focus flex items-center gap-1.5 rounded-full border border-text/10 bg-surface px-3.5 py-2 text-sm font-medium text-textMuted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" /> Exit
        </Link>
        <h1 className="font-display text-lg font-bold sm:text-xl">{game.title}</h1>

        {hasBest && (
          <span className="stat-mono ml-auto flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1.5 text-xs font-semibold text-secondary sm:ml-0">
            <Award className="h-3.5 w-3.5" /> Best: {formatScore(best as number, game.scoreUnit)}
          </span>
        )}

        <div className={`flex items-center gap-1.5 ${hasBest ? '' : 'ml-auto'}`}>
          <button
            onClick={() => setShowHelp((h) => !h)}
            aria-pressed={showHelp}
            aria-label="How to play"
            className="btn-focus rounded-full border border-text/10 bg-surface p-2 text-textMuted transition-colors hover:text-text"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSoundOn((s) => !s)}
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
            className="btn-focus rounded-full border border-text/10 bg-surface p-2 text-textMuted transition-colors hover:text-text"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="btn-focus hidden rounded-full border border-text/10 bg-surface p-2 text-textMuted transition-colors hover:text-text sm:inline-flex"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="rounded-2xl border border-text/5 bg-surface p-4 animate-fadeUp">
          <p className="eyebrow mb-2">How to Play</p>
          <p className="mb-3 text-sm text-textMuted">{game.howToPlay[0]}</p>
          <ul className="grid gap-1.5 text-sm text-textMuted sm:grid-cols-2">
            {[...game.controls.desktop, ...game.controls.mobile].map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="h-1 w-1 shrink-0 rounded-full bg-secondary" /> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        ref={stageRef}
        className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-text/5 bg-surface p-2 sm:min-h-[65vh] sm:p-4"
      >
        <ErrorBoundary key={game.slug}>
          <Suspense fallback={<PageLoader label={`Loading ${game.title}`} />}>
            <GameComponent onScore={recordScore} soundOn={soundOn} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}
