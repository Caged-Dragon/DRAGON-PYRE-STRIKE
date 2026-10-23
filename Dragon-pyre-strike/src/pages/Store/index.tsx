import { Link } from 'react-router-dom'
import { CheckCircle2, Download, ExternalLink, Link2, Play, Smartphone, Star, Store as StoreIcon } from 'lucide-react'
import { usePwaInstall, useAuth, useRealmTheme, withInstall, withTheme } from '@/dps'
import GameThumb from '@/components/GameThumb'
import { GAMES, type GameMeta } from '@/data/games'
import { CATEGORIES } from '@/data/categories'
import { SITE_CONFIG } from '@/data/configuration'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatPlayCount } from '@/utils/format'

const STANDALONE = GAMES.filter((g) => g.externalUrl)
const BUILT_IN = GAMES.filter((g) => !g.externalUrl)

export default function Store() {
  useDocumentMeta(`Realm Store — ${SITE_CONFIG.siteName}`, 'Install every Dragon Realm game as an app on your phone or computer, all connected by one account.')
  useRealmTheme() // re-render when the theme changes so the links below carry the right theme
  const pwa = usePwaInstall()
  const { user, profile, openAuth } = useAuth()
  const who = user ? profile?.display_name || profile?.username || 'your account' : null

  return (
    <div className="container-fluid py-10 sm:py-14">
      <header className="max-w-3xl">
        <h1 className="flex items-center gap-3 font-display text-2xl font-bold sm:text-4xl">
          <StoreIcon className="h-7 w-7 text-secondary sm:h-9 sm:w-9" aria-hidden="true" /> Realm Store
        </h1>
        <p className="mt-3 text-sm text-textMuted sm:text-base">
          Install any game as its own app — its own icon, full screen, and it keeps working offline. Every game is connected to the
          same account, so scores, saves and your theme follow you.
        </p>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-text/10 bg-surface p-5 sm:p-6" aria-labelledby="hub-app">
          <h2 id="hub-app" className="flex items-center gap-2 text-lg font-bold">
            <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" /> The hub app
          </h2>
          <p className="mt-1 text-sm text-textMuted">
            Install {SITE_CONFIG.siteName} to keep the Store, leaderboards and your favourites one tap away. It is the launcher for every game.
          </p>
          {pwa.installed ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> You&apos;re using the installed app
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void pwa.install()}
              className="btn-focus mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Install the hub
            </button>
          )}
        </section>

        <section className="rounded-2xl border border-text/10 bg-surface p-5 sm:p-6" aria-labelledby="connected">
          <h2 id="connected" className="flex items-center gap-2 text-lg font-bold">
            <Link2 className="h-5 w-5 text-primary" aria-hidden="true" /> One account, every game
          </h2>
          {who ? (
            <p className="mt-1 text-sm text-textMuted">
              Signed in as <strong className="text-text">{who}</strong>. Open any installed game and sign in with the same details — your
              scores, settings and progress are already waiting.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-textMuted">
                Playing as a guest saves nothing. Sign in once to connect your scores, saves and theme across every game.
              </p>
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="btn-focus mt-4 inline-flex items-center gap-2 rounded-full border border-text/15 px-5 py-2.5 text-sm font-bold transition-colors hover:bg-surface2"
              >
                Sign in or create an account
              </button>
            </>
          )}
          <p className="mt-3 text-xs text-textMuted">
            <Link to="/leaderboard" className="font-semibold text-primary hover:text-secondary">Leaderboards</Link>
            {' · '}
            <Link to="/favorites" className="font-semibold text-primary hover:text-secondary">Favourites</Link>
            {' · '}
            <Link to="/feedback" className="font-semibold text-primary hover:text-secondary">Send feedback</Link>
          </p>
        </section>
      </div>

      <section className="mt-12" aria-labelledby="apps">
        <h2 id="apps" className="font-display text-xl font-bold sm:text-2xl">Games to install</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {STANDALONE.map((g) => (
            <StoreCard key={g.slug} game={g} />
          ))}
        </ul>
      </section>

      {BUILT_IN.length > 0 && (
        <section className="mt-12" aria-labelledby="inside">
          <h2 id="inside" className="font-display text-xl font-bold sm:text-2xl">Included in the hub app</h2>
          <p className="mt-1 text-sm text-textMuted">These play inside the hub, so installing the hub installs them too.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {BUILT_IN.map((g) => (
              <li key={g.slug} className="flex items-center gap-3 rounded-2xl border border-text/10 bg-surface p-3">
                <GameThumb title={g.title} icon={g.icon} gradient={g.gradient} className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{g.title}</p>
                  <p className="truncate text-xs text-textMuted">{g.shortDescription}</p>
                </div>
                <Link to={`/games/${g.slug}/play`} className="btn-focus inline-flex items-center gap-1.5 rounded-full border border-text/15 px-3.5 py-2 text-xs font-bold transition-colors hover:bg-surface2">
                  <Play className="h-3.5 w-3.5" aria-hidden="true" /> Play
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 max-w-3xl rounded-2xl border border-text/10 bg-surface p-5 sm:p-6" aria-labelledby="how">
        <h2 id="how" className="text-lg font-bold">How installing works</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-textMuted">
          <li>Press <strong className="text-text">Install</strong> on a game. It opens on its own site with the install sheet ready.</li>
          <li>Confirm the install (on iPhone: Share, then Add to Home Screen).</li>
          <li>Launch it from your home screen or app list. On Android, links from the hub open the installed game automatically.</li>
        </ol>
      </section>
    </div>
  )
}

function StoreCard({ game }: { game: GameMeta }) {
  const url = game.externalUrl as string
  const category = CATEGORIES.find((c) => c.id === game.category)?.title ?? game.category
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-text/10 bg-surface">
      <div className="flex gap-4 p-4">
        <GameThumb title={game.title} icon={game.icon} gradient={game.gradient} className="h-20 w-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold">{game.title}</h3>
          <p className="text-xs text-textMuted">{category}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-textMuted">
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" aria-hidden="true" />
            {game.rating.toFixed(1)} · {formatPlayCount(game.playCount)} plays
          </p>
        </div>
      </div>
      <p className="px-4 text-sm text-textMuted">{game.shortDescription}</p>
      <div className="mt-auto flex gap-2 p-4">
        <a
          href={withInstall(withTheme(url))}
          className="btn-focus inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03] hover:bg-primary2"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Install
        </a>
        <a
          href={withTheme(url)}
          className="btn-focus inline-flex items-center justify-center gap-1.5 rounded-full border border-text/15 px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface2"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open
        </a>
        <Link to={`/games/${game.slug}`} className="btn-focus inline-flex items-center justify-center rounded-full px-3 py-2.5 text-sm font-semibold text-textMuted hover:text-text">
          Details
        </Link>
      </div>
    </li>
  )
}
