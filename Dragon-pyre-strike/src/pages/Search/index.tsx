import { SearchX } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import FilterBar from '@/components/FilterBar'
import GameGrid from '@/components/GameGrid'
import EmptyState from '@/components/EmptyState'
import { useGameQuery } from '@/hooks/useGameQuery'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function Search() {
  const { q, category, sort, results, total, hasMore, setQuery, setCategory, setSort, loadMore } = useGameQuery()

  useDocumentMeta(
    q ? `"${q}" — Search — DracoPyre Strike` : 'Search — DracoPyre Strike',
    'Search the DracoPyre Strike game library by title, category or tag.',
  )

  return (
    <div className="container-fluid py-8 sm:py-10">
      <p className="eyebrow mb-1">Search</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{q ? `Results for \u201c${q}\u201d` : 'Search DracoPyre Strike'}</h1>

      <div className="mt-6 space-y-4">
        <SearchBar value={q} onChange={setQuery} autoFocus />
        <FilterBar category={category} onCategoryChange={setCategory} sort={sort} onSortChange={setSort} resultCount={q ? total : undefined} />
      </div>

      <div className="mt-6">
        {!q ? (
          <EmptyState
            icon={SearchX}
            title="Search DracoPyre Strike"
            description="Type a game title, category or tag to get started — try “racing” or “puzzle”."
          />
        ) : results.length > 0 ? (
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
