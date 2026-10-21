import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Trophy, Play } from 'lucide-react'
import {
  SCORE_DIRECTION,
  avatarEmoji,
  getLeaderboard,
  getTopPlayers,
  levelFromXp,
  useAuth,
  type LeaderRow,
  type TopPlayer,
} from '@/dps'
import { GAMES } from '@/data/games'
import { formatScore } from '@/utils/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const BOARD_GAMES = GAMES.filter((g) => g.slug in SCORE_DIRECTION)

export default function Leaderboard() {
  useDocumentMeta('Leaderboards — DracoPyre Strike', 'Top players across every game in the Dragon Realm.')
  const [params, setParams] = useSearchParams()
  const { user, openAuth } = useAuth()
  const selected = params.get('game') ?? 'overall'
  const game = BOARD_GAMES.find((g) => g.slug === selected)

  const [rows, setRows] = useState<LeaderRow[]>([])
  const [players, setPlayers] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const run = game
      ? getLeaderboard(game.slug, 50).then((r) => alive && setRows(r))
      : getTopPlayers(50).then((p) => alive && setPlayers(p))
    void run.finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [game])

  const tab = (slug: string, label: string) => (
    <button
      key={slug}
      onClick={() => setParams(slug === 'overall' ? {} : { game: slug })}
      aria-pressed={selected === slug}
      className={`btn-focus shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
        selected === slug ? 'border-primary bg-primary text-white' : 'border-text/10 bg-surface text-textMuted hover:text-text'
      }`}
    >
      {label}
    </button>
  )

  const empty = !loading && (game ? rows.length === 0 : players.length === 0)

  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-10 px-fluid">
      <p className="eyebrow mb-1">Dragon Realm</p>
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
        <Trophy className="h-7 w-7 text-secondary" /> Leaderboards
      </h1>
      <p className="mt-1.5 text-sm text-textMuted sm:text-base">
        One account, every game. Scores from all four sites land on the same boards.
      </p>

      {!user && (
        <p className="mt-4 rounded-xl border border-text/10 bg-surface2 px-4 py-3 text-sm text-textMuted">
          Want your name on the board?{' '}
          <button onClick={() => openAuth('signup')} className="btn-focus font-semibold text-primary underline underline-offset-2">
            Create a free account
          </button>
          . Scores you earn as a guest are posted automatically when you sign in.
        </p>
      )}

      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Choose a leaderboard">
        {tab('overall', 'Overall XP')}
        {BOARD_GAMES.map((g) => tab(g.slug, g.title))}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-text/5 bg-surface">
        {loading && <p className="p-6 text-center text-sm text-textMuted">Consulting the Realm…</p>}

        {empty && (
          <div className="p-8 text-center">
            <p className="font-display text-lg font-bold">No entries yet</p>
            <p className="mt-1 text-sm text-textMuted">Be the first dragon on this board.</p>
            {game && (
              <PlayLink slug={game.slug} external={game.externalUrl} />
            )}
          </div>
        )}

        {!loading && game && rows.length > 0 && (
          <ol>
            {rows.map((r) => {
              const mine = r.user_id === user?.id
              return (
                <li key={r.user_id} className={`flex items-center gap-3 border-b border-text/5 px-4 py-3 last:border-b-0 ${mine ? 'bg-primary/10' : ''}`}>
                  <span className="stat-mono w-8 shrink-0 text-center text-sm font-bold text-textMuted">{medal(r.rank)}</span>
                  <span className="text-xl" aria-hidden="true">{avatarEmoji(r.avatar)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {r.display_name || r.username}
                    {mine && <span className="ml-2 text-xs font-bold text-primary">You</span>}
                  </span>
                  <span className="stat-mono text-sm font-bold text-secondary">{formatScore(Number(r.best_score), game.scoreUnit)}</span>
                  <span className="stat-mono hidden w-16 text-right text-xs text-textMuted sm:block">{r.plays} plays</span>
                </li>
              )
            })}
          </ol>
        )}

        {!loading && !game && players.length > 0 && (
          <ol>
            {players.map((p, i) => {
              const mine = p.id === user?.id
              return (
                <li key={p.id} className={`flex items-center gap-3 border-b border-text/5 px-4 py-3 last:border-b-0 ${mine ? 'bg-primary/10' : ''}`}>
                  <span className="stat-mono w-8 shrink-0 text-center text-sm font-bold text-textMuted">{medal(i + 1)}</span>
                  <span className="text-xl" aria-hidden="true">{avatarEmoji(p.avatar)}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {p.display_name || p.username}
                    {mine && <span className="ml-2 text-xs font-bold text-primary">You</span>}
                  </span>
                  <span className="stat-mono text-xs text-textMuted">Lv {levelFromXp(p.xp).level}</span>
                  <span className="stat-mono w-20 text-right text-sm font-bold text-secondary">{p.xp.toLocaleString()} XP</span>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
}

function PlayLink({ slug, external }: { slug: string; external?: string }) {
  const cls =
    'btn-focus mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2'
  return external ? (
    <a href={external} className={cls}>
      <Play className="h-4 w-4 fill-white" /> Play now
    </a>
  ) : (
    <Link to={`/games/${slug}/play`} className={cls}>
      <Play className="h-4 w-4 fill-white" /> Play now
    </Link>
  )
}
