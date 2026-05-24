export type Category = 'drama' | 'variety' | 'documentary' | 'movie'
export type ContentType = 'movie' | 'tv'
export type OriginLanguage = 'ko' | 'ja' | 'zh' | 'en' | 'other'

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
  genres: string[]
  numberOfSeasons?: number
  cast: string[]
  director?: string
  awards?: string[]
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
  original_language: string
  release_date?: string
  first_air_date?: string
  genre_ids: number[]
}

interface TmdbDiscoverResponse {
  results: TmdbItem[]
}

interface TmdbCastMember {
  order: number
  name: string
}

interface TmdbCrewMember {
  job: string
  name: string
}

interface TmdbCredits {
  cast: TmdbCastMember[]
  crew: TmdbCrewMember[]
}

interface TmdbCreatedBy {
  name: string
}

interface TmdbTvDetails {
  number_of_seasons: number
  number_of_episodes: number
  created_by: TmdbCreatedBy[]
  credits: TmdbCredits
  keywords: TmdbTvKeywords
}

interface TmdbKeyword {
  id: number
  name: string
}

interface TmdbMovieDetails {
  credits: TmdbCredits
  keywords: { keywords: TmdbKeyword[] }
}

interface TmdbTvKeywords {
  results: TmdbKeyword[]
}

const GENRE_NAMES: Record<number, string> = {
  28: '액션', 12: '어드벤처', 16: '애니메이션', 35: '코미디', 80: '범죄',
  99: '다큐멘터리', 18: '드라마', 10751: '가족', 14: '판타지', 36: '역사',
  27: '공포', 10402: '음악', 9648: '미스터리', 10749: '로맨스', 878: 'SF',
  53: '스릴러', 10752: '전쟁', 37: '서부',
  10759: '액션&어드벤처', 10762: '키즈', 10763: '뉴스', 10764: '리얼리티',
  10765: 'SF&판타지', 10767: '토크쇼', 10768: '전쟁&정치',
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

// Bayesian rating constants
const BAYES_M = 200  // minimum vote count for full trust
const BAYES_C = 7.0  // prior mean rating
const RECENT_YEAR_THRESHOLD = new Date().getFullYear() - 2
const RECENT_MIN_COUNT = 3

const OTHER_LANGS = new Set(['ko', 'ja', 'zh', 'en'])

const AWARD_KEYWORD_MAP: Record<string, string> = {
  'academy-award-winner': '아카데미상 수상',
  'academy-award-for-best-picture': '아카데미 작품상',
  'academy-award-for-best-picture-winner': '아카데미 작품상',
  'golden-globe-winner': '골든글로브 수상',
  'golden-globe-award': '골든글로브 수상',
  'emmy-award': '에미상 수상',
  'primetime-emmy-award': '에미상 수상',
  'primetime-emmy-award-winner': '에미상 수상',
  'cannes-film-festival': '칸 영화제',
  'palme-d-or': '칸 황금종려상',
  'bafta': 'BAFTA 수상',
  'bafta-award-winner': 'BAFTA 수상',
  'venice-film-festival': '베니스 영화제',
  'berlin-film-festival': '베를린 영화제',
}

function parseAwards(keywords: TmdbKeyword[]): string[] {
  const seen = new Set<string>()
  const awards: string[] = []
  for (const kw of keywords) {
    const label = AWARD_KEYWORD_MAP[kw.name]
    if (label && !seen.has(label)) {
      seen.add(label)
      awards.push(label)
    }
  }
  return awards
}

function matchesLanguage(originalLanguage: string, lang: OriginLanguage): boolean {
  if (lang === 'other') return !OTHER_LANGS.has(originalLanguage)
  return originalLanguage === lang
}

function computeScore(item: TmdbItem): number {
  const v = item.vote_count
  const R = item.vote_average
  return (v / (v + BAYES_M)) * R + (BAYES_M / (v + BAYES_M)) * BAYES_C
}

function getItemYear(item: TmdbItem, isMovie: boolean): number {
  return parseInt((isMovie ? item.release_date : item.first_air_date)?.split('-')[0] ?? '0')
}

async function fetchDiscover(
  endpoint: '/discover/tv' | '/discover/movie',
  params: Record<string, string>,
  page = 1
): Promise<TmdbItem[]> {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v)
  }
  url.searchParams.set('page', String(page))

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
  originLanguages: OriginLanguage[]
  excludeAnimation?: boolean
  watchedIds: number[]
  page?: number
}): Promise<{ items: Omit<CuratedContent, 'recommendationReason'>[]; hasMore: boolean }> {
  const { category, providerIds, yearFrom, yearTo, originLanguages, excludeAnimation = false, watchedIds, page = 1 } = params
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
  if (excludeAnimation) baseParams['without_genres'] = '16'

  if (yearFrom) {
    baseParams[isMovie ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${yearFrom}-01-01`
  }
  if (yearTo) {
    baseParams[isMovie ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${yearTo}-12-31`
  }

  // Build API-level language param sets
  // concrete languages (ko/ja/zh/en) → use with_original_language for accurate results
  // 'other' → fetch all then post-filter (TMDb has no "exclude language" param)
  const concreteLanguages = originLanguages.filter((l) => l !== 'other')
  const includesOther = originLanguages.includes('other')

  const langParamSets: Record<string, string>[] = []
  if (originLanguages.length === 0 || includesOther) {
    langParamSets.push({})
  }
  for (const lang of concreteLanguages) {
    langParamSets.push({ with_original_language: lang })
  }

  const fetchResults = await Promise.all(
    effectiveProviders.flatMap((providerId) =>
      langParamSets.map((langParams) =>
        fetchDiscover(
          config.endpoint,
          { ...baseParams, ...langParams, with_watch_providers: String(providerId) },
          page
        ).then((items) => ({ providerId, items }))
      )
    )
  )

  const merged = new Map<number, { item: TmdbItem; providers: string[] }>()

  for (const { providerId, items } of fetchResults) {
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

  const rawItems = [...merged.values()]

  // Post-filter: apply language filter (handles 'other' and dedup from no-lang-filter fetches)
  const pool = originLanguages.length > 0
    ? rawItems.filter(({ item }) =>
        originLanguages.some((lang) => matchesLanguage(item.original_language, lang))
      )
    : rawItems

  // Score all items (pure Bayesian)
  const scored = pool.map(({ item, providers }) => ({
    item,
    providers,
    score: computeScore(item),
    year: getItemYear(item, isMovie),
  }))

  scored.sort((a, b) => b.score - a.score)

  // Apply diversity: guarantee at least RECENT_MIN_COUNT recent items in final 12
  const top12 = scored.slice(0, 12)
  const recentInTop = top12.filter((x) => x.year >= RECENT_YEAR_THRESHOLD).length

  if (recentInTop < RECENT_MIN_COUNT) {
    const topIds = new Set(top12.map((x) => x.item.id))
    const recentExtras = scored
      .filter((x) => x.year >= RECENT_YEAR_THRESHOLD && !topIds.has(x.item.id))
      .slice(0, RECENT_MIN_COUNT - recentInTop)

    let replaced = 0
    for (let i = top12.length - 1; i >= 0 && replaced < recentExtras.length; i--) {
      if (top12[i].year < RECENT_YEAR_THRESHOLD) {
        top12[i] = recentExtras[replaced++]
      }
    }
    top12.sort((a, b) => b.score - a.score)
  }

  const detailMap = new Map<number, { seasons?: number; cast: string[]; director?: string; awards: string[] }>()
  await Promise.all(
    top12.map(async ({ item }) => {
      const endpoint = isMovie
        ? `${TMDB_BASE}/movie/${item.id}?api_key=${apiKey}&language=ko-KR&append_to_response=credits,keywords`
        : `${TMDB_BASE}/tv/${item.id}?api_key=${apiKey}&language=ko-KR&append_to_response=credits,keywords`
      const r = await fetch(endpoint, { next: { revalidate: 3600 } })
      if (!r.ok) return

      if (isMovie) {
        const d = await r.json() as TmdbMovieDetails
        const director = d.credits?.crew?.find((c) => c.job === 'Director')?.name
        const cast = (d.credits?.cast ?? [])
          .sort((a, b) => a.order - b.order)
          .slice(0, 3)
          .map((c) => c.name)
        const awards = parseAwards(d.keywords?.keywords ?? [])
        detailMap.set(item.id, { cast, director, awards })
      } else {
        const d = await r.json() as TmdbTvDetails
        const director = d.created_by?.[0]?.name
        const cast = (d.credits?.cast ?? [])
          .sort((a, b) => a.order - b.order)
          .slice(0, 3)
          .map((c) => c.name)
        const awards = parseAwards(d.keywords?.results ?? [])
        detailMap.set(item.id, { seasons: d.number_of_seasons, cast, director, awards })
      }
    })
  )

  // pool이 12개 미만이면 다음 TMDB 페이지에 결과가 있는지 probe
  let hasMore = pool.length >= 12
  if (!hasMore && rawItems.length > 0) {
    const probeResults = await Promise.all(
      effectiveProviders.slice(0, 1).flatMap((providerId) =>
        langParamSets.slice(0, 1).map((langParams) =>
          fetchDiscover(
            config.endpoint,
            { ...baseParams, ...langParams, with_watch_providers: String(providerId) },
            page + 1
          )
        )
      )
    )
    hasMore = probeResults.some((items) => items.length > 0)
  }

  const items = top12.map(({ item, providers }) => {
    const detail = detailMap.get(item.id)
    return {
      contentId: item.id,
      contentType: config.contentType,
      title: item.title ?? item.name ?? '',
      posterPath: item.poster_path,
      overview: item.overview,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      releaseYear: getItemYear(item, isMovie),
      providers,
      genres: (item.genre_ids ?? []).map((id) => GENRE_NAMES[id]).filter(Boolean),
      numberOfSeasons: detail?.seasons,
      cast: detail?.cast ?? [],
      director: detail?.director,
      awards: detail?.awards?.length ? detail.awards : undefined,
    }
  })

  return { items, hasMore }
}

export function tmdbImageUrl(path: string | null, size = 'w500'): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}
