import { useEffect, useRef } from 'react'
import {
  SCORE_DIRECTION,
  addFavorite,
  getMyStats,
  listFavorites,
  reportRun,
  touchGame,
  useAuth,
} from '@/dps'
import { useFavorites, useRecentlyPlayed, type RecentEntry } from '@/hooks/usePlayerData'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { SITE_CONFIG } from '@/data/configuration'
import { GAMES } from '@/data/games'

// Games that live on their own site report their own scores — never push this browser's local copies.
const EXTERNAL = new Set(GAMES.filter((g) => g.externalUrl).map((g) => g.slug))

function better(slug: string, a: number, b: number) {
  return (SCORE_DIRECTION[slug] ?? 'high') === 'high' ? a > b : a < b
}

/**
 * Renders nothing. When a player signs in, merges what this browser knows
 * (favorites, best scores, recently played) with their account — best of both —
 * and pushes anything the account is missing. Guests are untouched.
 */
export default function CloudSync() {
  const { user } = useAuth()
  const uid = user?.id
  const { favorites } = useFavorites()
  const { recent } = useRecentlyPlayed()
  const [scores, setScores] = useLocalStorage<Record<string, number>>('scores', {})
  const [, setFavs] = useLocalStorage<string[]>('favorites', [])
  const [, setRecent] = useLocalStorage<RecentEntry[]>('recent', [])

  // Always read the freshest local values inside the async merge.
  const latest = useRef({ favorites, recent, scores })
  latest.current = { favorites, recent, scores }

  useEffect(() => {
    if (!uid) return
    let alive = true
    void (async () => {
      const [cloudFavs, stats] = await Promise.all([listFavorites(), getMyStats()])
      if (!alive) return
      const local = latest.current

      // Favorites: union (local first), push the ones the account doesn't have yet.
      const union = [...local.favorites, ...cloudFavs.filter((s) => !local.favorites.includes(s))]
      setFavs(union)
      for (const slug of local.favorites) if (!cloudFavs.includes(slug)) void addFavorite(slug)

      // Best scores: keep the better of local / account, in each game's own direction.
      const merged = { ...local.scores }
      const cloudBest = new Map<string, number>()
      for (const st of stats) {
        if (st.best_score === null) continue
        const v = Number(st.best_score)
        cloudBest.set(st.game_slug, v)
        const cur = merged[st.game_slug]
        if (cur === undefined || better(st.game_slug, v, cur)) merged[st.game_slug] = v
      }
      setScores(merged)
      for (const [slug, v] of Object.entries(local.scores)) {
        if (!(slug in SCORE_DIRECTION) || EXTERNAL.has(slug)) continue
        const c = cloudBest.get(slug)
        if (c === undefined || better(slug, v, c)) void reportRun(slug, v, { source: 'local-best' })
      }

      // Recently played: newest first across both.
      const byslug = new Map<string, number>()
      for (const r of local.recent) byslug.set(r.slug, r.playedAt)
      for (const st of stats) {
        const t = Date.parse(st.last_played_at)
        if (Number.isFinite(t) && t > (byslug.get(st.game_slug) ?? 0)) byslug.set(st.game_slug, t)
      }
      const mergedRecent = [...byslug.entries()]
        .map(([slug, playedAt]) => ({ slug, playedAt }))
        .sort((a, b) => b.playedAt - a.playedAt)
        .slice(0, SITE_CONFIG.recentlyPlayedLimit)
      setRecent(mergedRecent)
      const known = new Set(stats.map((s) => s.game_slug))
      for (const r of local.recent) if (!known.has(r.slug)) void touchGame(r.slug)
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  return null
}
