import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import GameHero from '@/components/GameHero'
import Reveal from '@/components/Reveal'
import Marquee from '@/components/Marquee'
import CountUp from '@/components/CountUp'
import Section from '@/components/Section'
import GameGrid from '@/components/GameGrid'
import CategoryCard from '@/components/CategoryCard'
import { GAMES, getFeaturedGame, sortGames, getGameBySlug, type GameMeta } from '@/data/games'
import type { CategoryId } from '@/data/categories'
import { CATEGORIES } from '@/data/categories'
import { useRecentlyPlayed, useFavorites } from '@/hooks/usePlayerData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { SITE_CONFIG } from '@/data/configuration'

export default function Home() {
  useDocumentMeta(
    `${SITE_CONFIG.siteName} — ${SITE_CONFIG.tagline}`,
    `${SITE_CONFIG.description} Discover and play ${GAMES.length} free browser games instantly on ${SITE_CONFIG.siteName}.`,
  )

  const featured = getFeaturedGame()
  const trending = GAMES.filter((g) => g.trending)
  const popular = sortGames(GAMES, 'popular').slice(0, 10)
  const flaggedNew = GAMES.filter((g) => g.new)
  const newGames = flaggedNew.length ? flaggedNew : sortGames(GAMES, 'newest').slice(0, 5)

  const { recent } = useRecentlyPlayed()
  const { favorites } = useFavorites()
  const recentGames = recent.map((r) => getGameBySlug(r.slug)).filter((g): g is GameMeta => Boolean(g))
  const recommended = getRecommended(favorites, recent.map((r) => r.slug))

  return (
    <div>
      <GameHero game={featured} />

      <div className="container-fluid -mt-[clamp(1rem,0.4rem+3vw,3.5rem)] pb-2">
        <div className="stat-grid">
          {[
            { v: <CountUp to={GAMES.length} />, l: 'Games' },
            { v: <CountUp to={4} />, l: 'Realms' },
            { v: <CountUp to={100} suffix="%" />, l: 'Free' },
            { v: <CountUp to={0} />, l: 'Installs' },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 90}>
              <div className="stat-tile">
                <b>{s.v}</b>
                <span>{s.l}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="py-[clamp(1rem,0.6rem+2vw,2.5rem)]">
        <Marquee label="Games in the Realm">
          {GAMES.map((g) => (
            <Link
              key={g.slug}
              to={`/games/${g.slug}`}
              className="btn-focus flex items-center gap-[clamp(0.6rem,2vw,1.5rem)] whitespace-nowrap rounded font-fantasy text-[length:clamp(0.9rem,0.75rem+0.8vw,1.4rem)] font-bold uppercase tracking-[0.18em] text-text/55 transition-colors hover:text-secondary"
            >
              {g.title}
              <span className="text-primary" aria-hidden="true">
                ✦
              </span>
            </Link>
          ))}
        </Marquee>
      </div>

      <Section eyebrow="Trending Now" title="Trending Games" viewAllTo="/trending">
        <GameGrid games={trending.length ? trending : popular.slice(0, 5)} />
      </Section>

      <Section eyebrow="All-Time" title="Popular Games" viewAllTo="/popular">
        <GameGrid games={popular} />
      </Section>

      <section className="container-fluid py-section">
        <Reveal className="mb-[clamp(1.1rem,0.8rem+1.2vw,2rem)]">
          <p className="eyebrow mb-2">Browse</p>
          <h2 className="section-title font-display font-bold">Browse Categories</h2>
        </Reveal>
        <div className="fluid-grid cats">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i, 8) * 60}>
              <CategoryCard category={c} />
            </Reveal>
          ))}
        </div>
      </section>

      <Section eyebrow="Just Added" title="New Games" viewAllTo="/new">
        <GameGrid games={newGames} />
      </Section>

      {recentGames.length > 0 && (
        <Section eyebrow="Jump Back In" title="Recently Played">
          <GameGrid games={recentGames.slice(0, 5)} />
        </Section>
      )}

      <Section eyebrow="Picked For You" title="Recommended Games">
        <GameGrid games={recommended} />
      </Section>

      <section className="container-fluid py-section">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[clamp(1.25rem,1rem+1.5vw,2.25rem)] border border-text/10 px-[clamp(1.25rem,0.6rem+4vw,4rem)] py-[clamp(2.5rem,1.5rem+6vw,6rem)] text-center shadow-glow">
            <div className="hero-art !inset-0 !z-[-3] !bg-[url('/images/lair.webp')] !bg-center" aria-hidden="true" />
            <div className="absolute inset-0 z-[-2] bg-gradient-to-t from-bg via-bg/60 to-bg/80" aria-hidden="true" />
            <h2 className="title-forge text-[length:clamp(1.6rem,1rem+3.2vw,3.4rem)] leading-tight">Ready for one more round?</h2>
            <p className="mx-auto mt-3 max-w-md text-[length:var(--fs-lead)] text-textMuted">Every game in the Realm, in one place — one account, one leaderboard.</p>
            <Link
              to="/games"
              className="btn-focus btn-glow btn-pulse mt-[clamp(1.25rem,1rem+1.4vw,2.25rem)] inline-flex items-center gap-2 rounded-full bg-primary px-[clamp(1.4rem,1rem+1.4vw,2.3rem)] py-[clamp(0.75rem,0.6rem+0.5vw,1.05rem)] text-sm font-bold text-white shadow-glow"
            >
              Explore All Games <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

/**
 * Lightweight, honest recommendation heuristic: favor games sharing a
 * category with what the player has favorited/played, fall back to
 * highest-rated. No account or backend required for this to work, and the
 * same shape lets a real recommendation API replace it later untouched.
 */
function getRecommended(favoriteSlugs: string[], recentSlugs: string[]): GameMeta[] {
  const seedSlugs = [...favoriteSlugs, ...recentSlugs]
  if (seedSlugs.length === 0) return sortGames(GAMES, 'rating').slice(0, 5)

  const excludeSet = new Set(seedSlugs)
  const seedCategories = new Set<CategoryId>(
    seedSlugs.map((slug) => getGameBySlug(slug)?.category).filter((c): c is CategoryId => Boolean(c)),
  )
  const affinity = sortGames(GAMES.filter((g) => !excludeSet.has(g.slug) && seedCategories.has(g.category)), 'rating')
  const rest = sortGames(GAMES.filter((g) => !excludeSet.has(g.slug) && !seedCategories.has(g.category)), 'rating')
  return [...affinity, ...rest].slice(0, 5)
}
