import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from './context';
import { FEEDBACK_MAX_LENGTH, submitFeedback, type FeedbackCategory } from './api';
import { ECOSYSTEM_SITES } from './config';

const CATEGORIES: { id: FeedbackCategory; label: string; hint: string }[] = [
  { id: 'suggestion', label: 'Idea', hint: 'What would make this better?' },
  { id: 'bug', label: 'Problem', hint: 'What went wrong? Steps to repeat it help most.' },
  { id: 'praise', label: 'Praise', hint: 'What did you enjoy?' },
  { id: 'general', label: 'Other', hint: 'Anything on your mind.' },
];

const STAR_WORDS = ['', 'Needs work', 'Could be better', 'Good', 'Great', 'Loved it'];

export interface FeedbackTarget {
  slug: string | null;
  title: string;
}

/**
 * The feedback form. Works for guests and signed-in players alike.
 * `game` is preselected; pass `targets` to let the person choose what the feedback is about (the hub does).
 */
export function FeedbackForm({
  game = null,
  targets,
  onSent,
}: {
  game?: string | null;
  targets?: FeedbackTarget[];
  onSent?: () => void;
}) {
  const { user, profile, openAuth } = useAuth();
  const [about, setAbout] = useState<string | null>(game);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => setAbout(game), [game]);

  const hint = CATEGORIES.find((c) => c.id === category)?.hint ?? '';
  const shown = hover || rating;
  const who = user ? profile?.display_name || profile?.username || 'your account' : null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await submitFeedback({ game: about, category, rating: rating || null, message, contact });
    setBusy(false);
    if (err) return setError(err);
    setSent(true);
    onSent?.();
  }

  if (sent) {
    return (
      <div className="dps-fb-done" role="status">
        <span aria-hidden>🐲</span>
        <strong>Thank you — it reached the studio.</strong>
        <p>Every message is read. {contact ? 'If we need more detail we will write to you.' : 'Add an email next time if you would like a reply.'}</p>
        <button
          type="button"
          className="dps-ghost"
          onClick={() => {
            setSent(false);
            setMessage('');
            setRating(0);
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form className="dps-form dps-fb" onSubmit={onSubmit} noValidate>
      {targets && targets.length > 0 && (
        <label>
          <span>About</span>
          <select value={about ?? ''} onChange={(e) => setAbout(e.target.value || null)}>
            {targets.map((t) => (
              <option key={t.slug ?? 'realm'} value={t.slug ?? ''}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <div role="group" aria-label="Type of feedback" className="dps-chips">
        {CATEGORIES.map((c) => (
          <button key={c.id} type="button" aria-pressed={category === c.id} className={category === c.id ? 'on' : ''} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="dps-stars" role="radiogroup" aria-label="Rating out of 5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={n <= shown ? 'on' : ''}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(rating === n ? 0 : n)}
          >
            ★
          </button>
        ))}
        <small>{STAR_WORDS[shown] || 'Optional rating'}</small>
      </div>

      <label>
        <span>Your message</span>
        <textarea
          rows={4}
          maxLength={FEEDBACK_MAX_LENGTH}
          value={message}
          placeholder={hint}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
        />
      </label>

      <label>
        <span>Email for a reply (optional)</span>
        <input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={contact} onChange={(e) => setContact(e.target.value)} />
      </label>

      {error && (
        <p className="dps-msg dps-err" role="alert">
          {error}
        </p>
      )}

      <button className="dps-primary" type="submit" disabled={busy}>
        {busy ? 'Sending…' : 'Send feedback'}
      </button>
      <p className="dps-fb-who">
        {who ? (
          <>Sending as <b>{who}</b>.</>
        ) : (
          <>
            Sending as a guest — no account needed.{' '}
            <button type="button" className="dps-linklike" onClick={() => openAuth('signin')}>
              Sign in
            </button>{' '}
            to link it to your profile.
          </>
        )}
      </p>
    </form>
  );
}

/** Dialog opened from the dock (or any `openFeedback()` call) on every site. */
export function FeedbackModal() {
  const { feedbackOpen, feedbackGame, closeFeedback, site } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);

  // Games listen for keys on window (WASD, Space, P…). Keep typing inside the dialog from leaking out.
  useEffect(() => {
    const el = rootRef.current;
    if (!feedbackOpen || !el) return;
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.type === 'keydown' && e.key === 'Escape') closeFeedback();
    };
    el.addEventListener('keydown', onKey);
    el.addEventListener('keyup', onKey);
    el.addEventListener('keypress', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('keyup', onKey);
      el.removeEventListener('keypress', onKey);
    };
  }, [feedbackOpen, closeFeedback]);

  if (!feedbackOpen) return null;
  const title = feedbackGame ? ECOSYSTEM_SITES.find((s) => s.slug === feedbackGame)?.title ?? 'this game' : 'the Dragon Realm';

  return (
    <div className="dps-backdrop" ref={rootRef} onMouseDown={(e) => e.target === e.currentTarget && closeFeedback()}>
      <div className="dps-card" role="dialog" aria-modal="true" aria-labelledby="dps-fb-title" data-site={site}>
        <button type="button" className="dps-x" aria-label="Close" onClick={closeFeedback}>
          ×
        </button>
        <h2 className="dps-title" id="dps-fb-title">
          Tell us about {title}
        </h2>
        <p className="dps-sub">Bugs, ideas or a kind word — it goes straight to the people who build the games.</p>
        <FeedbackForm game={feedbackGame} />
      </div>
    </div>
  );
}
