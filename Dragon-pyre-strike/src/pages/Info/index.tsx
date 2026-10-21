import { Link } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SITE_CONFIG } from '@/data/configuration'

interface InfoPageProps {
  title: string
  paragraphs: string[]
}

/** Lightweight, honest content for the footer's secondary links — real
 *  copy instead of dead-end or fake navigation (Section 58). */
export default function InfoPage({ title, paragraphs }: InfoPageProps) {
  useDocumentMeta(`${title} — ${SITE_CONFIG.siteName}`, paragraphs[0])
  return (
    <div className="mx-auto max-w-2xl py-14 px-fluid">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-textMuted sm:text-base">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <Link to="/games" className="btn-focus mt-8 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary2">
        Browse Games
      </Link>
    </div>
  )
}

export const ABOUT_COPY = {
  title: 'About DracoPyre Strike',
  paragraphs: [
    `${SITE_CONFIG.siteName} is a free browser gaming platform built by ${SITE_CONFIG.studioName}. Every game in the Realm is dragon-forged — the idea is simple: open the site, pick a game, click play. No installs, no friction — and an optional free account if you want your progress to follow you.`,
    "The library launched with 10 original, fully playable games spanning arcade, puzzle, action and strategy — each one reimagined with the Realm's own dragons, hoards and lairs. It's built to grow — the same game registry that powers 10 titles today is designed to scale to hundreds without a redesign.",
    'Every game runs entirely in your browser. Play as a guest and your favorites, recently played games and high scores are saved on your device — or sign in to keep them in your Dragon Realm account, shared across DracoPyre Strike, Ember Wyrm, Drakebreaker and Dragon Flight, with leaderboards and cloud saves.',
  ],
}

export const HELP_COPY = {
  title: 'Help & FAQ',
  paragraphs: [
    'Do I need an account? No. Every game is playable instantly as a guest, and your favorites, recently played list and high scores are saved to this browser automatically. A free account adds leaderboards, cloud saves and progress that follows you between devices and between all the Realm\'s game sites.',
    "Where is my data stored? Guests: locally, in your browser's storage — clearing it or switching devices resets it. Signed-in players: in your Dragon Realm account, so it survives both. Scores you earn as a guest are added to your account the next time you sign in.",
    'Why do I sign in again on each game site? Every game is its own website, so each one keeps its own login session. It is the same account everywhere — the same email and password — and your scores, saves and XP are shared.',
    "A game won't load — what do I do? Use the Try Again button on the game screen, or refresh the page. If it persists, it may not be supported in your current browser.",
    'Can I play on my phone? Yes — every game supports touch controls, and the layout adapts to any screen size.',
  ],
}

export const CONTACT_COPY = {
  title: 'Contact',
  paragraphs: [
    `Questions, bug reports or game ideas — we'd like to hear them. Reach the ${SITE_CONFIG.studioName} team at hello@dracopyrestrike.game.`,
    'For fastest results with a bug report, include the game name, your browser, and what you were doing right before it happened.',
  ],
}

export const PRIVACY_COPY = {
  title: 'Privacy Policy',
  paragraphs: [
    `${SITE_CONFIG.siteName} does not require an account. You can play every game as a guest.`,
    "As a guest, favorites, recently played games, high scores and your sound preference are stored locally on your device using your browser's localStorage and are not transmitted to us.",
    'If you create a Dragon Realm account, we store your email address, username, display name, avatar, favorites, game scores, play counts and game saves so they can follow you across the Realm\'s game sites. This data is held in a hosted database (Supabase) and is protected by per-user access rules: only you can read or change your saves and favorites. Your username, avatar, level and scores are visible on public leaderboards; your email address is not.',
    "Clearing your browser's site data, using a different browser, or switching devices will reset guest data. Account data stays until you ask us to delete it — contact hello@dracopyrestrike.game and we'll remove your account and everything attached to it.",
    'We do not sell your data or use it for advertising.',
  ],
}

export const TERMS_COPY = {
  title: 'Terms of Service',
  paragraphs: [
    `${SITE_CONFIG.siteName} is provided by ${SITE_CONFIG.studioName} for free, personal, non-commercial use.`,
    "All games are original works built for this platform. Don't redistribute, resell, or claim them as your own.",
    'The platform is provided "as is" without warranty. We aim for reliability but can\'t guarantee uninterrupted access.',
  ],
}
