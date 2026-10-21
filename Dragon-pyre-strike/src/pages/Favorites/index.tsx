import { useState } from 'react'
import { Heart } from 'lucide-react'
import GameGrid from '@/components/GameGrid'
import EmptyState from '@/components/EmptyState'
import FilterBar from '@/components/FilterBar'
import { useFavorites } from '@/hooks/usePlayerData'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { GAMES, sortGames, type SortKey } from '@/data/games'

export default function Favorites() {
  useDocumentMeta('Favorites — DracoPyre Strike', 'Your saved games on DracoPyre Strike.')
  const { favorites } = useFavorites()
  const [sort, setSort] = useState<SortKey>('popular')

  const games = sortGames(
    GAMES.filter((g) => favorites.includes(g.slug)),
    sort,
  )

  return (
    <div className="container-fluid py-8 sm:py-10">
      <p className="eyebrow mb-1">Your Library</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Favorites</h1>
      <p className="mt-1.5 text-sm text-textMuted sm:text-base">Games you've saved for later.</p>

      {games.length > 0 ? (
        <>
          <div className="mt-6">
            <FilterBar showCategory={false} sort={sort} onSortChange={setSort} resultCount={games.length} />
          </div>
          <div className="mt-6">
            <GameGrid games={games} />
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={Heart}
            title="No favorite games yet"
            description="Find a game you love and save it here."
            actionLabel="Explore Games"
            actionTo="/games"
          />
        </div>
      )}
    </div>
  )
}
