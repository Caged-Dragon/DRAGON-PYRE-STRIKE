import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import FilterBar from '@/components/FilterBar'
import GameGrid from '@/components/GameGrid'
import EmptyState from '@/components/EmptyState'
import { useGameQuery } from '@/hooks/useGameQuery'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { GAMES, sortGames, type SortKey } from '@/data/games'

export type GamesMode = 'all' | 'popular' | 'trending' | 'new'

const MODE_META: Record<GamesMode, { title: string; eyebrow: string; description: string; defaultSort: SortKey }> = {
  all: { title: 'All Games', eyebrow: 'Discover', description: 'Every game on DracoPyre Strike, in one place.', defaultSort: 'popular' },
  popular: { title: 'Popular Games', eyebrow: 'All-Time', description: 'The most-played games on DracoPyre Strike right now.', defaultSort: 'popular' },
  trending: { title: 'Trending Games', eyebrow: 'Trending Now', description: 'Games picking up momentum this week.', defaultSort: 'popular' },
  new: { title: 'New Games', eyebrow: 'Just Added', description: 'The newest additions to the library.', defaultSort: 'newest' },
}

export default function Games({ mode }: { mode: GamesMode }) {
  const meta = MODE_META[mode]
  useDocumentMeta(`${meta.title} — DracoPyre Strike`, meta.description)

  const source = useMemo(() => {
    if (mode === 'trending') {
      const t = GAMES.filter((g) => g.trending)
      return t.length ? t : sortGames(GAMES, 'popular')
    }
    if (mode === 'new') {
      const n = GAMES.filter((g) => g.new)
      return n.length ? n : GAMES
    }
    return GAMES
  }, [mode])

  const { q, category, sort, results, total, hasMore, setQuery, setCategory, setSort, loadMore } = useGameQuery({
    source,
    defaultSort: meta.defaultSort,
  })

  return (
    <div className="container-fluid py-8 sm:py-10">
      <p className="eyebrow mb-1">{meta.eyebrow}</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{meta.title}</h1>
      <p className="mt-1.5 text-sm text-textMuted sm:text-base">{meta.description}</p>

      <div className="mt-6 space-y-4">
        <SearchBar value={q} onChange={setQuery} />
        <FilterBar category={category} onCategoryChange={setCategory} sort={sort} onSortChange={setSort} resultCount={total} />
      </div>

      <div className="mt-6">
        {results.length > 0 ? (
          <GameGrid games={results} />
        ) : (
          <EmptyState
            icon={SearchX}
            title="No games found"
            description="Try another keyword or browse our categories."
            actionLabel="Browse Games"
            actionTo="/games"
          />
        )}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            className="btn-focus rounded-full border border-text/10 bg-surface px-6 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface2"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
