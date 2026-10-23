import { Link, useSearchParams } from 'react-router-dom'
import { MessageSquareHeart } from 'lucide-react'
import { FeedbackForm, type FeedbackTarget } from '@/dps'
import { GAMES } from '@/data/games'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SITE_CONFIG } from '@/data/configuration'

const TARGETS: FeedbackTarget[] = [
  { slug: null, title: `${SITE_CONFIG.siteName} (the whole Realm)` },
  ...GAMES.map((g) => ({ slug: g.slug, title: g.title })),
]

export default function Feedback() {
  useDocumentMeta(`Feedback — ${SITE_CONFIG.siteName}`, 'Rate a game or send feedback straight to the studio. Guests and players both welcome.')
  const [params] = useSearchParams()
  const wanted = params.get('game')
  const game = TARGETS.some((t) => t.slug === wanted) ? wanted : null

  return (
    <div className="mx-auto max-w-2xl px-fluid py-10 sm:py-14">
      <h1 className="flex items-center gap-3 font-display text-2xl font-bold sm:text-3xl">
        <MessageSquareHeart className="h-7 w-7 text-secondary" aria-hidden="true" /> Send word to the Realm
      </h1>
      <p className="mt-2 text-sm text-textMuted sm:text-base">
        Pick a game (or the Realm as a whole), rate it, and tell us what to fix or build next. You don&apos;t need an account — signed-in
        feedback is simply linked to your profile.
      </p>

      <section className="mt-8 rounded-2xl border border-text/5 bg-surface p-5 sm:p-6">
        <div className="dps-inline">
          <FeedbackForm game={game} targets={TARGETS} />
        </div>
      </section>

      <Link to="/games" className="btn-focus mt-6 inline-block text-sm font-semibold text-primary hover:text-secondary">
        ← Back to the games
      </Link>
    </div>
  )
}
