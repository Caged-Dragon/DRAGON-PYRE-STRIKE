import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GAMES, searchGames, sortGames, type GameMeta, type SortKey } from '@/data/games'
import { SITE_CONFIG } from '@/data/configuration'

interface UseGameQueryOptions {
  source?: GameMeta[]
  defaultSort?: SortKey
  enableCategoryFilter?: boolean
  enableSearch?: boolean
}

/**
 * Shared search + category filter + sort + "load more" pagination, backed by
 * URL query params so results are shareable/bookmarkable. Reused by the
 * Games, Category, Search and Favorites pages instead of duplicating list
 * logic per page (Section 42/43).
 */
export function useGameQuery({
  source = GAMES,
  defaultSort = 'popular',
  enableCategoryFilter = true,
  enableSearch = true,
}: UseGameQueryOptions = {}) {
  const [params, setParams] = useSearchParams()
  const [pageSize, setPageSize] = useState<number>(SITE_CONFIG.gamesPerPage)

  const q = enableSearch ? params.get('q') ?? '' : ''
  const category = enableCategoryFilter ? params.get('category') ?? 'all' : 'all'
  const sort = (params.get('sort') as SortKey) || defaultSort

  const filtered = useMemo(() => {
    let list = source
    if (enableSearch && q) list = searchGames(list, q)
    if (enableCategoryFilter && category !== 'all') list = list.filter((g) => g.category === category)
    return sortGames(list, sort)
  }, [source, q, category, sort, enableSearch, enableCategoryFilter])

  const updateParam = useCallback(
    (key: string, value: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!value || value === 'all') next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
      setPageSize(SITE_CONFIG.gamesPerPage)
    },
    [setParams],
  )

  return {
    q,
    category,
    sort,
    results: filtered.slice(0, pageSize),
    total: filtered.length,
    hasMore: pageSize < filtered.length,
    setQuery: (v: string) => updateParam('q', v),
    setCategory: (v: string) => updateParam('category', v),
    setSort: (v: string) => updateParam('sort', v),
    loadMore: () => setPageSize((n) => n + SITE_CONFIG.gamesPerPage),
  }
}
