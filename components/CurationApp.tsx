'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CuratedContent, Category, OriginLanguage } from '@/lib/tmdb'
import { CategoryTabs } from './CategoryTabs'
import { OttFilterBar } from './OttFilterBar'
import { YearRangeSlider } from './YearRangeSlider'
import { CountryFilter } from './CountryFilter'
import { GenreFilter } from './GenreFilter'
import { ContentCard } from './ContentCard'
import { ExcludedPage } from './ExcludedPage'
import { Skeleton } from '@/components/ui/skeleton'

const PREF_SAVE_DEBOUNCE_MS = 600
const PREF_STORAGE_KEY = 'hongcha_prefs'

interface StoredPrefs {
  category?: Category
  ottPlatforms?: number[]
  yearFrom?: number | null
  yearTo?: number | null
  originLanguages?: OriginLanguage[]
  excludeAnimation?: boolean
  selectedGenres?: number[]
}

function loadStoredPrefs(): StoredPrefs | null {
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredPrefs) : null
  } catch {
    return null
  }
}

function watchedKey(contentId: number, contentType: string) {
  return `${contentType}:${contentId}`
}

export function CurationApp() {
  const [view, setView] = useState<'main' | 'excluded'>('main')
  const [category, setCategory] = useState<Category>('drama')
  const [ottPlatforms, setOttPlatforms] = useState<number[]>([])
  const [yearRange, setYearRange] = useState<[number, number] | null>(null)
  const [originLanguages, setOriginLanguages] = useState<OriginLanguage[]>([])
  const [excludeAnimation, setExcludeAnimation] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [contents, setContents] = useState<CuratedContent[]>([])
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set())
  const [skippedSet, setSkippedSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [prefLoaded, setPrefLoaded] = useState(false)

  const pageRef = useRef(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const prefSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtersRef = useRef({ category, ottPlatforms, yearRange, originLanguages, excludeAnimation, selectedGenres })

  useEffect(() => {
    filtersRef.current = { category, ottPlatforms, yearRange, originLanguages, excludeAnimation, selectedGenres }
  }, [category, ottPlatforms, yearRange, originLanguages, excludeAnimation, selectedGenres])

  useEffect(() => {
    if (!prefLoaded) return
    try {
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify({
        category,
        ottPlatforms,
        yearFrom: yearRange?.[0] ?? null,
        yearTo: yearRange?.[1] ?? null,
        originLanguages,
        excludeAnimation,
        selectedGenres,
      } satisfies StoredPrefs))
    } catch {
      // private mode 등 storage 불가 환경 무시
    }
  }, [category, ottPlatforms, yearRange, originLanguages, excludeAnimation, prefLoaded])

  useEffect(() => {
    async function init() {
      // 1. localStorage에서 즉시 복원
      const stored = loadStoredPrefs()
      if (stored) {
        if (stored.category) setCategory(stored.category)
        if (stored.ottPlatforms?.length) setOttPlatforms(stored.ottPlatforms)
        if (stored.yearFrom != null && stored.yearTo != null) setYearRange([stored.yearFrom, stored.yearTo])
        if (Array.isArray(stored.originLanguages) && stored.originLanguages.length) {
          setOriginLanguages(stored.originLanguages as OriginLanguage[])
        }
        if (stored.excludeAnimation) setExcludeAnimation(true)
        if (Array.isArray(stored.selectedGenres) && stored.selectedGenres.length) {
          setSelectedGenres(stored.selectedGenres)
        }
      }

      // 2. 서버에서 watched/skipped + 필터 fallback 로드
      const [prefRes, watchedRes, skippedRes] = await Promise.all([
        fetch('/api/preferences'),
        fetch('/api/watched'),
        fetch('/api/skipped'),
      ])
      const [prefJson, watchedJson, skippedJson] = await Promise.all([
        prefRes.json(),
        watchedRes.json(),
        skippedRes.json(),
      ])

      // localStorage가 없을 때만 서버 필터값 사용
      if (!stored && prefJson.success && prefJson.data) {
        const { ottPlatforms: saved, yearFrom, yearTo, originLanguages: savedLangs, excludeAnimation: savedExcludeAnim } = prefJson.data
        if (saved?.length) setOttPlatforms(saved)
        if (yearFrom != null && yearTo != null) setYearRange([yearFrom, yearTo])
        if (Array.isArray(savedLangs) && savedLangs.length) setOriginLanguages(savedLangs as OriginLanguage[])
        if (savedExcludeAnim) setExcludeAnimation(true)
      }

      if (watchedJson.success && Array.isArray(watchedJson.data)) {
        setWatchedSet(
          new Set(watchedJson.data.map((w: { contentId: number; contentType: string }) =>
            watchedKey(w.contentId, w.contentType)
          ))
        )
      }

      if (skippedJson.success && Array.isArray(skippedJson.data)) {
        setSkippedSet(
          new Set(skippedJson.data.map((s: { contentId: number; contentType: string }) =>
            watchedKey(s.contentId, s.contentType)
          ))
        )
      }

      setPrefLoaded(true)
    }
    init()
  }, [])

  const buildParams = useCallback((page: number) => {
    const { category: cat, ottPlatforms: otts, yearRange: yr, originLanguages: langs, excludeAnimation: excAnim, selectedGenres: genres } = filtersRef.current
    const params = new URLSearchParams({ category: cat, page: String(page) })
    if (otts.length > 0) params.set('ottPlatforms', otts.join(','))
    if (yr) {
      params.set('yearFrom', String(yr[0]))
      params.set('yearTo', String(yr[1]))
    }
    if (langs.length > 0) params.set('originLanguages', langs.join(','))
    if (excAnim) params.set('excludeAnimation', '1')
    if (genres.length > 0) params.set('genreIds', genres.join(','))
    return params
  }, [])

  const curate = useCallback(async () => {
    pageRef.current = 1
    setHasMore(true)
    setLoading(true)
    try {
      const res = await fetch(`/api/curate?${buildParams(1)}`)
      const json = await res.json()
      if (json.success) {
        setContents(json.data)
        setHasMore(json.hasMore ?? json.data.length >= 12)
      }
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const nextPage = pageRef.current + 1
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/curate?${buildParams(nextPage)}`)
      const json = await res.json()
      if (json.success && json.data.length > 0) {
        setContents((prev) => {
          const existingIds = new Set(prev.map((c) => watchedKey(c.contentId, c.contentType)))
          const fresh = (json.data as CuratedContent[]).filter(
            (c) => !existingIds.has(watchedKey(c.contentId, c.contentType))
          )
          return [...prev, ...fresh]
        })
        pageRef.current = nextPage
        setHasMore(json.hasMore ?? json.data.length >= 12)
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [buildParams, hasMore, loadingMore])

  useEffect(() => {
    if (!prefLoaded) return
    curate()
  }, [prefLoaded, category, ottPlatforms, yearRange, originLanguages, excludeAnimation, selectedGenres, curate])

  // IntersectionObserver for infinite scroll
  // contents.length dep ensures observer is set up after first content render
  // (sentinel div doesn't exist until contents.length > 0)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore, contents.length])

  function savePreferences(platforms: number[], range: [number, number] | null, langs: OriginLanguage[], excAnim: boolean) {
    if (prefSaveTimer.current) clearTimeout(prefSaveTimer.current)
    prefSaveTimer.current = setTimeout(() => {
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ottPlatforms: platforms,
          yearFrom: range?.[0] ?? null,
          yearTo: range?.[1] ?? null,
          originLanguages: langs,
          excludeAnimation: excAnim,
        }),
      })
    }, PREF_SAVE_DEBOUNCE_MS)
  }

  function handleOttChange(platforms: number[]) {
    setOttPlatforms(platforms)
    savePreferences(platforms, yearRange, originLanguages, excludeAnimation)
  }

  function handleYearChange(range: [number, number] | null) {
    setYearRange(range)
    savePreferences(ottPlatforms, range, originLanguages, excludeAnimation)
  }

  function handleOriginLanguagesChange(langs: OriginLanguage[]) {
    setOriginLanguages(langs)
    savePreferences(ottPlatforms, yearRange, langs, excludeAnimation)
  }

  function handleExcludeAnimationChange(excAnim: boolean) {
    setExcludeAnimation(excAnim)
    savePreferences(ottPlatforms, yearRange, originLanguages, excAnim)
  }

  function handleCategoryChange(cat: Category) {
    setCategory(cat)
    setSelectedGenres([])
  }

  function handleGenreChange(genres: number[]) {
    setSelectedGenres(genres)
  }

  function handleWatched(contentId: number, contentType: string) {
    const key = watchedKey(contentId, contentType)
    setWatchedSet((prev) => new Set([...prev, key]))
    setContents((prev) => prev.filter((c) => watchedKey(c.contentId, c.contentType) !== key))
  }

  function handleUnwatched(contentId: number, contentType: string) {
    setWatchedSet((prev) => {
      const next = new Set(prev)
      next.delete(watchedKey(contentId, contentType))
      return next
    })
  }

  function handleSkip(contentId: number, contentType: string) {
    const content = contents.find((c) => c.contentId === contentId && c.contentType === contentType)
    const key = watchedKey(contentId, contentType)
    setSkippedSet((prev) => new Set([...prev, key]))
    setContents((prev) => prev.filter((c) => watchedKey(c.contentId, c.contentType) !== key))
    fetch('/api/skipped', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId,
        contentType,
        title: content?.title ?? '',
        posterPath: content?.posterPath ?? null,
      }),
    })
  }

  function handleWatchedUndo(contentId: number, contentType: string) {
    setWatchedSet((prev) => {
      const next = new Set(prev)
      next.delete(watchedKey(contentId, contentType))
      return next
    })
  }

  function handleSkippedUndo(contentId: number, contentType: string) {
    setSkippedSet((prev) => {
      const next = new Set(prev)
      next.delete(watchedKey(contentId, contentType))
      return next
    })
  }

  const skeletons = Array.from({ length: 8 })

  const excludedCount = watchedSet.size + skippedSet.size

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-widest text-amber-400 shrink-0">HONGCHA</span>
          </div>

          <nav className="flex gap-1 mt-1 sm:mt-0">
            <button
              onClick={() => setView('main')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === 'main'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              오늘 뭐볼까?
            </button>
            <button
              onClick={() => setView('excluded')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === 'excluded'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              제외됨{excludedCount > 0 ? ` [${excludedCount}]` : ''}
            </button>
          </nav>
        </div>
      </header>

      {view === 'excluded' ? (
        <ExcludedPage
          onWatchedUndo={handleWatchedUndo}
          onSkippedUndo={handleSkippedUndo}
        />
      ) : (
        <>
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-3 space-y-3">
            <CategoryTabs value={category} onChange={handleCategoryChange} />
            <OttFilterBar selected={ottPlatforms} onChange={handleOttChange} />
            <CountryFilter value={originLanguages} onChange={handleOriginLanguagesChange} />
            <GenreFilter category={category} value={selectedGenres} onChange={handleGenreChange} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 sm:max-w-sm">
                <YearRangeSlider value={yearRange} onChange={handleYearChange} />
              </div>
              <button
                onClick={() => handleExcludeAnimationChange(!excludeAnimation)}
                className={`self-start shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  excludeAnimation
                    ? 'bg-amber-400 text-zinc-950 border-amber-400'
                    : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                }`}
              >
                애니메이션 제외
              </button>
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-4 pb-12">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {skeletons.map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                    <Skeleton className="aspect-[2/3] bg-zinc-800" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-3 w-16 bg-zinc-800" />
                      <Skeleton className="h-4 w-full bg-zinc-800" />
                      <Skeleton className="h-3 w-3/4 bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : contents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-zinc-500 gap-3">
                <span className="text-4xl">🍵</span>
                <p className="text-sm">추천할 콘텐츠가 없습니다. 필터를 조정해보세요.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {contents.map((content) => (
                    <ContentCard
                      key={`${content.contentType}:${content.contentId}`}
                      content={content}
                      isWatched={watchedSet.has(watchedKey(content.contentId, content.contentType))}
                      onWatched={handleWatched}
                      onUnwatched={handleUnwatched}
                      onSkip={handleSkip}
                    />
                  ))}
                </div>

                <div ref={sentinelRef} className="h-1" />

                {loadingMore && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-amber-400 animate-spin" />
                  </div>
                )}

                {!hasMore && contents.length > 0 && (
                  <p className="text-center text-zinc-600 text-sm py-8">모든 콘텐츠를 불러왔습니다</p>
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  )
}
