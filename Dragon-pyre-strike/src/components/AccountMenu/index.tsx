import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, LogIn, LogOut, Trophy, User as UserIcon } from 'lucide-react'
import { avatarEmoji, levelFromXp, useAuth } from '@/dps'

export default function AccountMenu() {
  const { user, profile, loading, openAuth, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (loading) return <div className="h-9 w-9" aria-hidden="true" />

  if (!user) {
    return (
      <button
        onClick={() => openAuth('signin')}
        aria-label="Sign in"
        className="btn-focus flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-bold text-white shadow-glow transition-transform hover:scale-105 hover:bg-primary2 sm:px-4"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">Sign in</span>
      </button>
    )
  }

  const name = profile?.display_name || profile?.username || user.email?.split('@')[0] || 'Player'
  const lvl = levelFromXp(profile?.xp ?? 0)
  const itemClass =
    'btn-focus flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-textMuted transition-colors hover:bg-surface2 hover:text-text'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="btn-focus flex h-9 w-9 items-center justify-center rounded-full border border-text/10 bg-surface text-lg transition-transform hover:scale-105"
      >
        <span aria-hidden="true">{avatarEmoji(profile?.avatar)}</span>
      </button>
      {open && (
        <div role="menu" className="glass absolute right-0 top-full z-50 mt-2 w-60 rounded-xl p-2 shadow-glow">
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate font-display text-sm font-bold">{name}</p>
            <p className="stat-mono text-xs text-textMuted">
              Level {lvl.level} · {profile?.xp ?? 0} XP
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (lvl.into / lvl.needed) * 100)}%` }} />
            </div>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <UserIcon className="h-4 w-4" /> My profile
          </Link>
          <Link to="/leaderboard" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <Trophy className="h-4 w-4" /> Leaderboards
          </Link>
          <Link to="/favorites" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <Heart className="h-4 w-4" /> Favorites
          </Link>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut()
            }}
            className={`${itemClass} w-full`}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
