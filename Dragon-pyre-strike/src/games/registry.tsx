import { lazy, type ComponentType } from 'react'

export interface GamePlayProps {
  onScore?: (value: number) => void
  soundOn?: boolean
}

/**
 * In-app games only -- three games in data/games.ts (ember-wyrm,
 * dragon-flight, drakebreaker) set `externalUrl` instead and live on their
 * own separate sites (hub-and-spoke -- see README "External games").
 */
export const GAME_COMPONENTS: Record<string, ComponentType<GamePlayProps>> = {
  'dragon-strike': lazy(() => import('./dragon-strike')),
  'dragons-hoard': lazy(() => import('./dragons-hoard')),
  'dragons-lair': lazy(() => import('./dragons-lair')),
  'dragons-memory': lazy(() => import('./dragons-memory')),
  'dragon-knight-mage': lazy(() => import('./dragon-knight-mage')),
  'dragons-realm': lazy(() => import('./dragons-realm')),
  'dragons-riddle': lazy(() => import('./dragons-riddle')),
}
