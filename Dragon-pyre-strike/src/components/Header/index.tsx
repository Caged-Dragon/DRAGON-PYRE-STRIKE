import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Search as SearchIcon, Heart, ChevronDown } from 'lucide-react'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import AccountMenu from '@/components/AccountMenu'
import { CATEGORIES } from '@/data/categories'
import { useFavorites } from '@/hooks/usePlayerData'

interface HeaderProps {
  /** Used on the gameplay screen — keeps the logo + exit affordances, drops the rest (Section 17: don't clutter gameplay). */
  minimal?: boolean
}

export default function Header({ minimal = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { favorites } = useFavorites()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    const q = searchValue.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setMobileSearchOpen(false)
    setMobileOpen(false)
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link btn-focus rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'text-text' : 'text-textMuted hover:text-text'
    }`

  const mobileLinkClass = 'block rounded-lg px-3 py-2.5 text-sm font-medium text-textMuted transition-colors hover:bg-surface2 hover:text-text'
  const open = mobileOpen || mobileSearchOpen

  return (
    <header className="hdr" data-scrolled={scrolled || open ? 'true' : 'false'}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="container-fluid flex h-[clamp(3.5rem,3.1rem+1.4vw,4.5rem)] items-center gap-2">
        <span className="logo-glow shrink-0">
          <Logo />
        </span>

        {!minimal && (
          <nav className="hdr-nav ml-4 items-center gap-1" aria-label="Primary">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/games" className={linkClass}>
              Games
            </NavLink>
            <div className="relative" ref={catRef}>
              <button
                onClick={() => setCatOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={catOpen}
                className="btn-focus flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-textMuted transition-colors hover:text-text"
              >
                Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div role="menu" className="glass animate-fadeUp absolute left-0 top-full mt-2 grid w-64 grid-cols-1 gap-0.5 rounded-xl p-2 shadow-glow">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.id}
                      role="menuitem"
                      to={`/category/${c.id}`}
                      onClick={() => setCatOpen(false)}
                      className="btn-focus rounded-lg px-3 py-2 text-sm text-textMuted transition-all hover:translate-x-1 hover:bg-surface2 hover:text-text"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink to="/popular" className={linkClass}>
              Popular
            </NavLink>
            <NavLink to="/new" className={linkClass}>
              New
            </NavLink>
            <NavLink to="/leaderboard" className={linkClass}>
              Leaderboards
            </NavLink>
          </nav>
        )}

        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          {!minimal && (
            <form onSubmit={submitSearch} className="hdr-search-wide relative items-center">
              <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                type="search"
                placeholder="Search games..."
                aria-label="Search games"
                className="btn-focus w-[clamp(7rem,12vw,11rem)] rounded-full border border-text/10 bg-surface/70 py-2 pl-9 pr-3 text-sm text-text backdrop-blur placeholder:text-muted transition-[width,box-shadow] duration-300 focus:w-[clamp(9rem,17vw,15rem)]"
              />
            </form>
          )}

          {!minimal && (
            <button
              onClick={() => setMobileSearchOpen((o) => !o)}
              className="hdr-search-icon btn-focus rounded-full p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text"
              aria-label="Search"
              aria-expanded={mobileSearchOpen}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}

          <ThemeToggle />

          <Link
            to="/favorites"
            className="hdr-heart btn-focus relative rounded-full p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text"
            aria-label={`Favorites, ${favorites.length} saved`}
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="pop-in stat-mono absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </Link>

          <AccountMenu />

          {!minimal && (
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="hdr-burger btn-focus rounded-full p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileSearchOpen && !minimal && (
        <form onSubmit={submitSearch} className="hdr-m-search animate-fadeUp border-t border-text/5 px-[var(--gutter)] py-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              type="search"
              placeholder="Search games..."
              aria-label="Search games"
              className="btn-focus w-full rounded-full border border-text/10 bg-surface py-2.5 pl-9 pr-3 text-sm text-text placeholder:text-muted"
            />
          </div>
        </form>
      )}

      {mobileOpen && !minimal && (
        <nav aria-label="Mobile" className="hdr-mobile animate-fadeUp max-h-[calc(100svh-4rem)] space-y-1 overflow-y-auto border-t border-text/5 px-[var(--gutter)] py-3">
          <Link to="/" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Home
          </Link>
          <Link to="/games" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Games
          </Link>
          <Link to="/popular" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Popular
          </Link>
          <Link to="/trending" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Trending
          </Link>
          <Link to="/new" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            New Games
          </Link>
          <Link to="/leaderboard" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Leaderboards
          </Link>
          <Link to="/profile" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            My Profile
          </Link>
          <Link to="/favorites" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Favorites
          </Link>
          <Link to="/feedback" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
            Feedback & Ratings
          </Link>
          <div className="pt-3">
            <p className="eyebrow px-3 pb-1.5">Categories</p>
            <div className="fluid-grid cats !gap-0.5">
              {CATEGORIES.map((c) => (
                <Link key={c.id} to={`/category/${c.id}`} onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
