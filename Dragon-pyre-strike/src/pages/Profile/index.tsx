import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Trophy, UserRound } from 'lucide-react'
import {
  AVATARS,
  avatarEmoji,
  getMyStats,
  levelFromXp,
  updateProfile,
  useAuth,
  type MyGameStat,
} from '@/dps'
import { GAMES } from '@/data/games'
import { formatRelativeTime, formatScore } from '@/utils/format'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/

export default function Profile() {
  useDocumentMeta('My Profile — DracoPyre Strike', 'Your Dragon Realm account, stats and settings.')
  const { user, profile, loading, openAuth, signOut, refreshProfile } = useAuth()
  const [stats, setStats] = useState<MyGameStat[]>([])
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('ember')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!profile) return
    setUsername(profile.username)
    setDisplayName(profile.display_name ?? '')
    setAvatar(profile.avatar)
  }, [profile])

  useEffect(() => {
    if (!user) return
    let alive = true
    void getMyStats().then((s) => alive && setStats(s))
    return () => {
      alive = false
    }
  }, [user])

  if (loading) return <p className="p-10 text-center text-sm text-textMuted">Loading your hoard…</p>

  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center px-fluid">
        <UserRound className="mx-auto h-12 w-12 text-textMuted" />
        <h1 className="mt-4 font-display text-xl font-bold">Sign in to see your profile</h1>
        <p className="mt-2 text-sm text-textMuted">
          One free account carries your scores, saves and favorites across every game in the Dragon Realm.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => openAuth('signin')} className="btn-focus rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-glow hover:bg-primary2">
            Sign in
          </button>
          <button onClick={() => openAuth('signup')} className="btn-focus rounded-full border border-text/10 bg-surface px-6 py-3 text-sm font-semibold text-textMuted hover:text-text">
            Create account
          </button>
        </div>
      </div>
    )
  }

  const lvl = levelFromXp(profile?.xp ?? 0)

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setMsg(null)
    const name = username.trim()
    if (!USERNAME_RE.test(name)) return setMsg({ ok: false, text: 'Username: 3–20 letters, numbers or underscores.' })
    setBusy(true)
    const err = await updateProfile({ username: name, display_name: displayName.trim() || null, avatar })
    if (!err) await refreshProfile()
    setBusy(false)
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Profile saved.' })
  }

  const rows = stats
    .map((s) => ({ s, g: GAMES.find((g) => g.slug === s.game_slug) }))
    .filter((r): r is { s: MyGameStat; g: (typeof GAMES)[number] } => Boolean(r.g))

  const inputCls =
    'btn-focus w-full rounded-xl border border-text/10 bg-surface2 px-3.5 py-2.5 text-sm text-text placeholder:text-muted'

  return (
    <div className="mx-auto max-w-3xl py-8 sm:py-10 px-fluid">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-text/10 bg-surface text-3xl" aria-hidden="true">
          {avatarEmoji(profile?.avatar)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Dragon Realm account</p>
          <h1 className="truncate font-display text-2xl font-bold">{profile?.display_name || profile?.username}</h1>
          <p className="truncate text-sm text-textMuted">@{profile?.username} · {user.email}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-text/5 bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg font-bold">Level {lvl.level}</p>
          <p className="stat-mono text-sm text-textMuted">{(profile?.xp ?? 0).toLocaleString()} XP total</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (lvl.into / lvl.needed) * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-textMuted">
          {lvl.needed - lvl.into} XP to level {lvl.level + 1}. Every finished run earns XP; new personal bests earn extra.
        </p>
      </div>

      <h2 className="mt-8 flex items-center gap-2 font-display text-lg font-bold">
        <Trophy className="h-5 w-5 text-secondary" /> Your stats
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 rounded-xl border border-text/10 bg-surface2 px-4 py-3 text-sm text-textMuted">
          Nothing yet — play any game in the Realm and it will show up here.{' '}
          <Link to="/games" className="font-semibold text-primary underline underline-offset-2">Browse games</Link>
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-2xl border border-text/5 bg-surface">
          {rows.map(({ s, g }) => (
            <div key={s.game_slug} className="flex items-center gap-3 border-b border-text/5 px-4 py-3 last:border-b-0">
              <Link to={`/games/${g.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary">
                {g.title}
              </Link>
              <span className="stat-mono text-sm font-bold text-secondary">
                {s.best_score === null ? '—' : formatScore(Number(s.best_score), g.scoreUnit)}
              </span>
              <span className="stat-mono hidden w-16 text-right text-xs text-textMuted sm:block">{s.plays} plays</span>
              <span className="stat-mono hidden w-20 text-right text-xs text-textMuted sm:block">
                {formatRelativeTime(Date.parse(s.last_played_at))}
              </span>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-8 font-display text-lg font-bold">Edit profile</h2>
      <form onSubmit={onSave} className="mt-3 grid gap-4 rounded-2xl border border-text/5 bg-surface p-4">
        <label className="grid gap-1.5">
          <span className="eyebrow">Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} className={inputCls} />
        </label>
        <label className="grid gap-1.5">
          <span className="eyebrow">Display name (optional)</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} className={inputCls} />
        </label>
        <div className="grid gap-1.5">
          <span className="eyebrow">Avatar</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AVATARS).map(([id, emoji]) => (
              <button
                key={id}
                type="button"
                onClick={() => setAvatar(id)}
                aria-pressed={avatar === id}
                aria-label={`${id} avatar`}
                className={`btn-focus flex h-11 w-11 items-center justify-center rounded-xl border text-xl transition-colors ${
                  avatar === id ? 'border-primary bg-primary/15' : 'border-text/10 bg-surface2 hover:border-text/30'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        {msg && (
          <p role="status" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
            {msg.text}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} className="btn-focus rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:bg-primary2 disabled:opacity-60">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="btn-focus flex items-center gap-2 rounded-full border border-text/10 bg-surface2 px-5 py-2.5 text-sm font-semibold text-textMuted hover:text-text"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </form>
    </div>
  )
}
