// Centralized configuration. Change brand strings here — nowhere else in the
// app should hardcode "DracoPyre Strike", "DracoPyre Games", or the tagline.

export const SITE_CONFIG = {
  siteName: 'DracoPyre Strike',
  studioName: 'DracoPyre Games',
  tagline: 'One Realm. Every Game.',
  description: 'Free games from across the Realm. Instant play. Anywhere.',
  studioLine: 'A DracoPyre Games Production',
  version: '4.0',
  year: new Date().getFullYear(),
  social: {
    twitter: 'https://twitter.com',
    discord: 'https://discord.com',
  },
  recentlyPlayedLimit: 12,
  gamesPerPage: 12,
} as const

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/games' },
  { label: 'Categories', to: '/category/action' },
  { label: 'Popular', to: '/popular' },
  { label: 'New', to: '/new' },
] as const

export const FOOTER_LINKS = {
  platform: [
    { label: 'Games', to: '/games' },
    { label: 'Categories', to: '/category/action' },
    { label: 'Popular', to: '/popular' },
    { label: 'New Games', to: '/new' },
    { label: 'Leaderboards', to: '/leaderboard' },
  ],
  company: [
    { label: 'About', to: '/about' },
    { label: 'Help', to: '/help' },
    { label: 'Feedback', to: '/feedback' },
    { label: 'Contact', to: '/contact' },
  ],
  legal: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ],
} as const
