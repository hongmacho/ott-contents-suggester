export type Category = 'drama' | 'variety' | 'documentary' | 'movie'
export type ContentType = 'movie' | 'tv'

export interface CuratedContent {
  contentId: number
  contentType: ContentType
  title: string
  posterPath: string | null
  overview: string
  voteAverage: number
  voteCount: number
  releaseYear: number
  providers: string[]
  recommendationReason: string
}

interface TmdbItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  overview: string
  vote_average: number
  vote_count: number
  release_date?: string
  first_air_date?: string
}

interface TmdbDiscoverResponse {
  results: TmdbItem[]
}

const CATEGORY_CONFIG: Record<Category, {
  endpoint: '/discover/tv' | '/discover/movie'
  contentType: ContentType
  genres: string
}> = {
  drama: { endpoint: '/discover/tv', contentType: 'tv', genres: '18' },
  variety: { endpoint: '/discover/tv', contentType: 'tv', genres: '10764|10767' },
  documentary: { endpoint: '/discover/tv', contentType: 'tv', genres: '99' },
  movie: { endpoint: '/discover/movie', contentType: 'movie', genres: '' },
}

export const OTT_PROVIDERS: Record<number, { name: string; color: string; bg: string }> = {
  8:   { name: 'Netflix',  color: '#E50914', bg: 'bg-red-600' },
  97:  { name: 'Tving',    color: '#FF153C', bg: 'bg-rose-600' },
  337: { name: 'Disney+',  color: '#0063E5', bg: 'bg-blue-600' },
  356: { name: 'Wavve',    color: '#0037E5', bg: 'bg-indigo-600' },
}

const TMDB_BASE = 'https://api.themoviedb.org/3'
const DEFAULT_PROVIDERS = [8, 97, 337, 356]

async function fetchDiscover(
  endpoint: '/discover/tv' | '/discover/movie',
  params: Record<string, string>
): Promise<TmdbItem[]> {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) return []

  const data: TmdbDiscoverResponse = await res.json()
  return data.results ?? []
}

export async function discoverContent(params: {
  category: Category
  providerIds: number[]
  yearFrom?: number
  yearTo?: number
  koreanOnly?: boolean
  watchedIds: number[]
}): Promise<Omit<CuratedContent, 'recommendationReason'>[]> {
  const { category, providerIds, yearFrom, yearTo, koreanOnly, watchedIds } = params
  const config = CATEGORY_CONFIG[category]
  const apiKey = process.env.TMDB_API_KEY

  if (!apiKey) throw new Error('TMDB_API_KEY not configured')

  const effectiveProviders = providerIds.length > 0 ? providerIds : DEFAULT_PROVIDERS
  const isMovie = config.contentType === 'movie'

  const baseParams: Record<string, string> = {
    api_key: apiKey,
    language: 'ko-KR',
    sort_by: 'popularity.desc',
    watch_region: 'KR',
    'vote_average.gte': '6.5',
    'vote_count.gte': '50',
  }

  if (config.genres) baseParams['with_genres'] = config.genres
  if (koreanOnly) baseParams['with_original_language'] = 'ko'

  if (yearFrom) {
    baseParams[isMovie ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${yearFrom}-01-01`
  }
  if (yearTo) {
    baseParams[isMovie ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${yearTo}-12-31`
  }

  const perProvider = await Promise.all(
    effectiveProviders.map(async (providerId) => {
      const items = await fetchDiscover(config.endpoint, {
        ...baseParams,
        with_watch_providers: String(providerId),
      })
      return { providerId, items }
    })
  )

  const merged = new Map<number, { item: TmdbItem; providers: string[] }>()

  for (const { providerId, items } of perProvider) {
    const providerName = OTT_PROVIDERS[providerId]?.name ?? String(providerId)
    for (const item of items) {
      if (watchedIds.includes(item.id)) continue
      if (merged.has(item.id)) {
        const existing = merged.get(item.id)!
        if (!existing.providers.includes(providerName)) {
          existing.providers.push(providerName)
        }
      } else {
        merged.set(item.id, { item, providers: [providerName] })
      }
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.item.vote_count - a.item.vote_count)
    .slice(0, 12)
    .map(({ item, providers }) => ({
      contentId: item.id,
      contentType: config.contentType,
      title: item.title ?? item.name ?? '',
      posterPath: item.poster_path,
      overview: item.overview,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      releaseYear: parseInt(
        (isMovie ? item.release_date : item.first_air_date)?.split('-')[0] ?? '0'
      ),
      providers,
    }))
}

export function tmdbImageUrl(path: string | null, size = 'w500'): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}
