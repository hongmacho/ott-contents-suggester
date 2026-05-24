'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { CuratedContent, Category } from '@/lib/tmdb'
import { CategoryTabs } from './CategoryTabs'
import { OttFilterBar } from './OttFilterBar'
import { YearRangeSlider } from './YearRangeSlider'
import { ContentCard } from './ContentCard'
import { RefreshButton } from './RefreshButton'
import { Skeleton } from '@/components/ui/skeleton'

const PREF_SAVE_DEBOUNCE_MS = 600

export function CurationApp() {
  const [category, setCategory] = useState<Category>('drama')
  const [ottPlatforms, setOttPlatforms] = useState<number[]>([])
  const [yearRange, setYearRange] = useState<[number, number] | null>(null)
  const [contents, setContents] = useState<CuratedContent[]>([])
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [prefLoaded, setPrefLoaded] = useState(false)
  const prefSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function watchedKey(contentId: number, contentType: string) {
    return `${contentType}:${contentId}`
  }

  // Load saved preferences and watched list on mount
  useEffect(() => {
    async function init() {
      const [prefRes, watchedRes] = await Promise.all([
        fetch('/api/preferences'),
        fetch('/api/watched'),
      ])
      const [prefJson, watchedJson] = await Promise.all([prefRes.json(), watchedRes.json()])

      if (prefJson.success && prefJson.data) {
        const { ottPlatforms: saved, yearFrom, yearTo } = prefJson.data
        if (saved?.length) setOttPlatforms(saved)
        if (yearFrom != null && yearTo != null) setYearRange([yearFrom, yearTo])
      }

      if (watchedJson.success && Array.isArray(watchedJson.data)) {
        setWatchedSet(
          new Set(watchedJson.data.map((w: { contentId: number; contentType: string }) =>
            watchedKey(w.contentId, w.contentType)
          ))
        )
      }

      setPrefLoaded(true)
    }
    init()
  }, [])

  const curate = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ category })
      if (ottPlatforms.length > 0) params.set('ottPlatforms', ottPlatforms.join(','))
      if (yearRange) {
        params.set('yearFrom', String(yearRange[0]))
        params.set('yearTo', String(yearRange[1]))
      }
      const res = await fetch(`/api/curate?${params}`)
      const json = await res.json()
      if (json.success) setContents(json.data)
    } finally {
      setLoading(false)
    }
  }, [category, ottPlatforms, yearRange])

  // Curate on first load and when filters change
  useEffect(() => {
    if (!prefLoaded) return
    curate()
  }, [prefLoaded, curate])

  // Debounced preference save
  function savePreferences(platforms: number[], range: [number, number] | null) {
    if (prefSaveTimer.current) clearTimeout(prefSaveTimer.current)
    prefSaveTimer.current = setTimeout(() => {
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ottPlatforms: platforms,
          yearFrom: range?.[0] ?? null,
          yearTo: range?.[1] ?? null,
        }),
      })
    }, PREF_SAVE_DEBOUNCE_MS)
  }

  function handleOttChange(platforms: number[]) {
    setOttPlatforms(platforms)
    savePreferences(platforms, yearRange)
  }

  function handleYearChange(range: [number, number] | null) {
    setYearRange(range)
    savePreferences(ottPlatforms, range)
  }

  function handleWatched(contentId: number, contentType: string) {
    setWatchedSet((prev) => new Set([...prev, watchedKey(contentId, contentType)]))
  }

  function handleUnwatched(contentId: number, contentType: string) {
    setWatchedSet((prev) => {
      const next = new Set(prev)
      next.delete(watchedKey(contentId, contentType))
      return next
    })
  }

  const skeletons = Array.from({ length: 8 })

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <span className="text-xl font-black tracking-widest text-amber-400 shrink-0">HONGCHA</span>
          <RefreshButton onClick={curate} loading={loading} />
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4 space-y-4">
        <CategoryTabs value={category} onChange={setCategory} />
        <OttFilterBar selected={ottPlatforms} onChange={handleOttChange} />
        <div className="max-w-sm">
          <YearRangeSlider value={yearRange} onChange={handleYearChange} />
        </div>
      </div>

      {/* Content grid */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {contents.map((content) => (
              <ContentCard
                key={`${content.contentType}:${content.contentId}`}
                content={content}
                isWatched={watchedSet.has(watchedKey(content.contentId, content.contentType))}
                onWatched={handleWatched}
                onUnwatched={handleUnwatched}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
