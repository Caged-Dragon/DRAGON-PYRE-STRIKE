import { useParams } from 'react-router-dom'
import { LayoutGrid, Frown } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import FilterBar from '@/components/FilterBar'
import GameGrid from '@/components/GameGrid'
import EmptyState from '@/components/EmptyState'
import GameThumb from '@/components/GameThumb'
import { useGameQuery } from '@/hooks/useGameQuery'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { getCategory } from '@/data/categories'
import { GAMES, sortGames } from '@/data/games'

export default function Category() {
  const { category: categoryId } = useParams()
  const category = getCategory(categoryId)

  useDocumentMeta(
    category ? `${category.title} Games — DracoPyre Strike` : 'Category Not Found — DracoPyre Strike',
    category?.description ?? 'This category could not be found on DracoPyre Strike.',
  )

  if (!category) {
    return (
      <div className="mx-auto max-w-xl py-16 px-fluid">
        <EmptyState
          icon={Frown}
          title="We couldn't find that category"
          description="It may not exist yet. Browse everything DracoPyre Strike has to offer instead."
          actionLabel="Browse Games"
          actionTo="/games"
        />
      </div>
    )
  }

  const source = GAMES.filter((g) => g.category === category.id)
  const featured = sortGames(source, 'popular')[0]

  const { q, sort, results, total, hasMore, setQuery, setSort, loadMore } = useGameQuery({
    source,
    enableCategoryFilter: false,
  })

  return (
    <div>
      <div className={`relative overflow-hidden bg-gradient-to-br ${category.gradient}`}>
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="container-fluid relative py-12 sm:py-16">
          <p className="eyebrow mb-2 text-white/80">Category</p>
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{category.title}</h1>
          <p className="mt-2 max-w-lg text-white/85">{category.description}</p>
        </div>
      </div>

      <div className="container-fluid py-8 sm:py-10">
        {featured && (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-text/5 bg-surface p-4 sm:flex-row sm:items-center">
            <GameThumb
              title={featured.title}
              icon={featured.icon}
              gradient={featured.gradient}
              className="h-32 w-full shrink-0 rounded-xl sm:w-48"
            />
            <div>
              <p className="eyebrow mb-1">Featured in {category.title}</p>
              <h2 className="font-display text-lg font-bold">{featured.title}</h2>
              <p className="mt-1 text-sm text-textMuted">{featured.shortDescription}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <SearchBar value={q} onChange={setQuery} placeholder={`Search ${category.title.toLowerCase()} games...`} />
          <FilterBar showCategory={false} sort={sort} onSortChange={setSort} resultCount={total} />
        </div>

        <div className="mt-6">
          {results.length > 0 ? (
            <GameGrid games={results} />
          ) : (
            <EmptyState
              icon={LayoutGrid}
              title="No games here yet"
              description={`${category.title} is a growing category on DracoPyre Strike — check back soon, or explore what's already live.`}
              actionLabel="Browse All Games"
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
    </div>
  )
}
