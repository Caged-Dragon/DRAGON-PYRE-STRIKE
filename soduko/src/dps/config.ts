// Dragon Realm configuration. Every value can be overridden with an environment variable (see .env.example);
// the defaults below are used when a variable is not set. The Supabase publishable key is designed to be public
// (data is protected by Row Level Security), so it is safe to ship in the browser bundle.
const ENV = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {}) as Record<string, string | undefined>;
const pick = (key: string, fallback: string) => (ENV[key] || fallback).replace(/\/+$/, '');

export const SUPABASE_URL = pick('VITE_SUPABASE_URL', 'https://nllaznaojehldvgmarkf.supabase.co');
export const SUPABASE_PUBLISHABLE_KEY = ENV.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hymZ-smxjULVjj4mg7mp6w_KyIUE4zn';

export const HUB_URL = pick('VITE_HUB_URL', 'https://draco-pyre-strike.vercel.app');

/** The hub is not a row in the `games` table; this is the namespace it uses for its own saved data. */
export const HUB_SLUG = 'hub';

export interface EcoSite {
  slug: string;
  title: string;
  tagline: string;
  url: string;
  emoji: string;
}

/** Standalone game sites that live outside the hub. */
export const ECOSYSTEM_SITES: EcoSite[] = [
  { slug: 'dragon-strike', title: 'Dragon Strike', tagline: 'Fire the skies — 12 realms, 8 dragons', url: pick('VITE_URL_DRAGON_STRIKE', 'https://dragon-strike-shooter-site.vercel.app'), emoji: '🐲' },
  { slug: 'ember-wyrm', title: 'Ember Wyrm', tagline: 'Ten lairs, one hungry wyrm', url: pick('VITE_URL_EMBER_WYRM', 'https://emberwyrmsite.vercel.app'), emoji: '🐍' },
  { slug: 'drakebreaker', title: 'Drakebreaker', tagline: '50 levels of brick-shattering fury', url: pick('VITE_URL_DRAKEBREAKER', 'https://dragonbreaker-site.vercel.app'), emoji: '🧱' },
  { slug: 'dragon-flight', title: 'Dragon Flight', tagline: 'Glide the gates, chase the sky', url: pick('VITE_URL_DRAGON_FLIGHT', 'https://dragon-flight-site.vercel.app'), emoji: '🪽' },
  { slug: 'dragon-2048', title: 'Dragon 2048', tagline: 'Merge eggs into the Dragon Lord', url: pick('VITE_URL_DRAGON_2048', 'https://dragon-2048-site.vercel.app'), emoji: '🥚' },
  { slug: 'dragon-sudoku', title: 'Dragon Sudoku', tagline: 'Classic grids, dragon-cave nights', url: pick('VITE_URL_DRAGON_SUDOKU', 'https://dragon-sudoku-site.vercel.app'), emoji: '🔢' },
  { slug: 'dragon-tictactoe', title: 'Dragon Tic-Tac-Toe', tagline: 'Three in a row, claw to claw', url: pick('VITE_URL_DRAGON_TICTACTOE', 'https://dragon-tictactoe-site.vercel.app'), emoji: '⭕' },
];

/** Which direction is "better" for each game's score. Mirrors the `games` table. */
export const SCORE_DIRECTION: Record<string, 'high' | 'low'> = {
  'dragon-strike': 'high',
  'ember-wyrm': 'high',
  'dragons-hoard': 'high',
  'drakebreaker': 'high',
  'dragon-flight': 'high',
  'dragon-2048': 'high',
  'dragon-sudoku': 'high',
  'dragon-tictactoe': 'high',
  'dragons-lair': 'low',
  'dragons-memory': 'low',
  'dragons-riddle': 'low',
};

export const AVATARS: Record<string, string> = {
  ember: '🔥',
  frost: '❄️',
  storm: '⚡',
  void: '🌑',
  gold: '🪙',
  wyrm: '🐉',
};

export function avatarEmoji(id: string | null | undefined): string {
  return (id && AVATARS[id]) || AVATARS.ember;
}

/** Account level from cross-game XP. */
export function levelFromXp(xp: number): { level: number; into: number; needed: number } {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1;
  const floor = 40 * (level - 1) * (level - 1);
  const next = 40 * level * level;
  return { level, into: xp - floor, needed: next - floor };
}

/** Address of a standalone game site by slug (honours the VITE_URL_* overrides). */
export function siteUrl(slug: string): string {
  return ECOSYSTEM_SITES.find((x) => x.slug === slug)?.url ?? HUB_URL;
}
