import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bug, Lightbulb, Heart, MessageSquare, Send, Copy, Check, Feather } from 'lucide-react'
import StarRating from '@/components/StarRating'
import { useRating, useFeedbackStatus, useFavorites, useRecentlyPlayed } from '@/hooks/usePlayerData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SITE_CONFIG } from '@/data/configuration'

type Category = 'bug' | 'suggestion' | 'praise' | 'general'

const CATEGORIES: { id: Category; label: string; icon: typeof Bug }[] = [
  { id: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { id: 'bug', label: 'Bug Report', icon: Bug },
  { id: 'praise', label: 'Praise', icon: Heart },
  { id: 'general', label: 'General', icon: MessageSquare },
]

const CONTACT_EMAIL = 'hello@dracopyrestrike.game'

const RATING_RESPONSE: Record<number, string> = {
  1: "That's rough. Tell us what went wrong below \u2014 we read every message.",
  2: "Sorry to hear it. What would've made this better?",
  3: 'Fair enough. What would push it higher for you?',
  4: 'Glad you\u2019re enjoying the Realm! Anything we could sharpen further?',
  5: 'You\u2019re a true dragonrider! Tell us what you loved, or just leave it at five stars.',
}

function buildFeedbackText(rating: number, category: Category, message: string, replyEmail: string) {
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label ?? 'General'
  const lines = [
    rating > 0 ? `Rating: ${rating}/5 stars` : 'Rating: not provided',
    `Category: ${categoryLabel}`,
    '',
    message.trim(),
  ]
  if (replyEmail.trim()) lines.push('', `Reply-to: ${replyEmail.trim()}`)
  return lines.join('\n')
}

export default function Feedback() {
  useDocumentMeta(
    `Feedback & Ratings \u2014 ${SITE_CONFIG.siteName}`,
    'Rate DracoPyre Strike and send feedback directly to the studio.',
  )

  const [rating, setRating] = useRating()
  const { lastFeedback, markSubmitted } = useFeedbackStatus()
  const { favorites } = useFavorites()
  const { recent } = useRecentlyPlayed()

  const [category, setCategory] = useState<Category>('suggestion')
  const [message, setMessage] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const feedbackText = buildFeedbackText(rating, category, message, replyEmail)
  const subject = `DracoPyre Strike Feedback \u2014 ${CATEGORIES.find((c) => c.id === category)?.label}${rating ? ` (${rating}\u2605)` : ''}`
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(feedbackText)}`

  function validate(): boolean {
    if (!message.trim()) {
      setError('Add a message before sending \u2014 even a line or two helps.')
      return false
    }
    setError('')
    return true
  }

  function handleEmailClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!validate()) {
      e.preventDefault()
      return
    }
    markSubmitted(category, rating)
  }

  async function handleCopy() {
    if (!validate()) return
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${feedbackText}`)
      markSubmitted(category, rating)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Could not copy automatically \u2014 select and copy the text manually.')
    }
  }

  const hasHistory = favorites.length > 0 || recent.length > 0

  return (
    <div className="mx-auto max-w-2xl py-10 sm:py-14 px-fluid">
      <p className="eyebrow mb-2">Version {SITE_CONFIG.version}</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Send Word to the Realm</h1>
      <p className="mt-2 text-sm text-textMuted sm:text-base">
        Your rating and message go straight to us by email — they are never stored in the game database or tied to your account. We read every one.
      </p>

      {lastFeedback && (
        <p className="mt-4 rounded-xl border border-text/10 bg-surface2 px-4 py-2.5 text-sm text-textMuted">
          Thanks for reaching out {formatWhen(lastFeedback.submittedAt)} — more to add? Send it below.
        </p>
      )}

      {/* Rate Us */}
      <section className="mt-8 rounded-2xl border border-text/5 bg-surface p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Rate DracoPyre Strike</h2>
        <p className="mt-1 text-sm text-textMuted">
          {hasHistory ? `You've explored ${favorites.length + recent.length} game${favorites.length + recent.length === 1 ? '' : 's'} so far \u2014 ` : ''}
          how are we doing?
        </p>
        <div className="mt-4">
          <StarRating value={rating} onChange={setRating} label="Rate DracoPyre Strike out of 5 stars" />
        </div>
        {rating > 0 && <p className="mt-3 text-sm font-medium text-secondary">{RATING_RESPONSE[rating]}</p>}
      </section>

      {/* Feedback form */}
      <section className="mt-6 rounded-2xl border border-text/5 bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Feather className="h-4 w-4 text-secondary" /> Send Feedback
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={active}
                className={`btn-focus flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active ? 'border-primary bg-primary text-white' : 'border-text/10 bg-surface2 text-textMuted hover:text-text'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {c.label}
              </button>
            )
          })}
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Your message</span>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              if (error) setError('')
            }}
            rows={5}
            placeholder={
              category === 'bug'
                ? 'What happened, and which game? The more detail, the faster we can fix it.'
                : category === 'suggestion'
                  ? 'What would make DracoPyre Strike better?'
                  : "What's on your mind?"
            }
            className="btn-focus w-full resize-none rounded-xl border border-text/10 bg-bg px-4 py-3 text-sm text-text placeholder:text-muted"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            Your email (optional, if you want a reply)
          </span>
          <input
            type="email"
            value={replyEmail}
            onChange={(e) => setReplyEmail(e.target.value)}
            placeholder="you@example.com"
            className="btn-focus w-full rounded-xl border border-text/10 bg-bg px-4 py-3 text-sm text-text placeholder:text-muted"
          />
        </label>

        {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={mailtoHref}
            onClick={handleEmailClick}
            className="btn-focus flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary2"
          >
            <Send className="h-4 w-4" /> Open in Email
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="btn-focus flex items-center gap-2 rounded-full border border-text/10 bg-surface2 px-5 py-2.5 text-sm font-semibold text-textMuted transition-colors hover:text-text"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Instead'}
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          "Open in Email" hands this off to your email app addressed to {CONTACT_EMAIL}. No mail app set up? Use "Copy
          Instead" and paste it wherever works for you.
        </p>
      </section>

      <Link to="/games" className="btn-focus mt-6 inline-block text-sm font-semibold text-primary hover:text-secondary">
        ← Back to the games
      </Link>
    </div>
  )
}

function formatWhen(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / 86_400_000)
  if (diffDays <= 0) return 'earlier today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays} days ago`
  return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
