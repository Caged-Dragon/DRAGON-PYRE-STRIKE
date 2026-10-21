import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { ScoreDirection } from '@/data/games'
import { addFavorite as cloudAddFavorite, removeFavorite as cloudRemoveFavorite, reportRun, touchGame } from '@/dps'

export interface RecentEntry {
  slug: string
  playedAt: number
}

const RECENT_LIMIT = 12

/** Favorites — stored locally; mirrored to the player's Dragon Realm account when signed in. */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', [])

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites])

  const toggleFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev]))
      if (favorites.includes(slug)) void cloudRemoveFavorite(slug)
      else void cloudAddFavorite(slug)
    },
    [favorites, setFavorites],
  )

  const removeFavorite = useCallback(
    (slug: string) => {
      setFavorites((prev) => prev.filter((s) => s !== slug))
      void cloudRemoveFavorite(slug)
    },
    [setFavorites],
  )

  return { favorites, isFavorite, toggleFavorite, removeFavorite }
}

/** Recently played — capped history, most recent first (Section 23). */
export function useRecentlyPlayed() {
  const [recent, setRecent] = useLocalStorage<RecentEntry[]>('recent', [])

  const addRecentlyPlayed = useCallback(
    (slug: string) => {
      setRecent((prev) => [{ slug, playedAt: Date.now() }, ...prev.filter((r) => r.slug !== slug)].slice(0, RECENT_LIMIT))
      void touchGame(slug)
    },
    [setRecent],
  )

  const clearRecentlyPlayed = useCallback(() => setRecent([]), [setRecent])

  return { recent, addRecentlyPlayed, clearRecentlyPlayed }
}

type ScoreMap = Record<string, number>

/**
 * High scores per game (Section 24). `direction` controls whether a bigger
 * number is better ("high", e.g. points) or a smaller one is ("low", e.g.
 * seconds or attempts). Every finished run is also posted to the shared
 * Dragon Realm leaderboard (queued until login for guests).
 */
export function useHighScore(slug: string | undefined, direction: ScoreDirection = 'high') {
  const [scores, setScores] = useLocalStorage<ScoreMap>('scores', {})

  const best = slug ? scores[slug] : undefined

  const recordScore = useCallback(
    (value: number) => {
      if (!slug || !Number.isFinite(value)) return
      void reportRun(slug, value)
      setScores((prev) => {
        const current = prev[slug]
        const better = current === undefined || (direction === 'high' ? value > current : value < current)
        return better ? { ...prev, [slug]: value } : prev
      })
    },
    [slug, direction, setScores],
  )

  return { best, recordScore }
}

export function useSoundPreference() {
  return useLocalStorage<boolean>('sound', true)
}

/**
 * The user's own rating of the platform (Version 2.0 "Rate Us" feature).
 * Stored locally so a returning visitor sees their previous rating rather
 * than a blank slate. There's no backend to aggregate this across users —
 * see useFeedbackStatus for why ratings are sent by email instead.
 */
export function useRating() {
  return useLocalStorage<number>('rating', 0)
}

export interface FeedbackRecord {
  submittedAt: number
  category: string
  rating: number
}

/**
 * Tracks whether feedback has been sent from this browser before, purely so
 * the Feedback page can say "thanks again" instead of showing a first-time
 * form every visit. DracoPyre Strike has no backend, so the feedback
 * *content* itself is never stored here or anywhere else — it's composed
 * into an email to the studio and handed off to the person's own mail
 * client (with a copy-to-clipboard fallback), never persisted client-side.
 */
export function useFeedbackStatus() {
  const [lastFeedback, setLastFeedback] = useLocalStorage<FeedbackRecord | null>('lastFeedback', null)

  const markSubmitted = useCallback(
    (category: string, rating: number) => {
      setLastFeedback({ submittedAt: Date.now(), category, rating })
    },
    [setLastFeedback],
  )

  return { lastFeedback, markSubmitted }
}
