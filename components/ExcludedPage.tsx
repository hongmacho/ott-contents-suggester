'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { tmdbImageUrl } from '@/lib/tmdb'

interface ExcludedItem {
  contentId: number
  contentType: string
  title: string
  posterPath: string | null
}

interface ExcludedPageProps {
  onWatchedUndo: (contentId: number, contentType: string) => void
  onSkippedUndo: (contentId: number, contentType: string) => void
}

export function ExcludedPage({ onWatchedUndo, onSkippedUndo }: ExcludedPageProps) {
  const [tab, setTab] = useState<'watched' | 'skipped'>('watched')
  const [watched, setWatched] = useState<ExcludedItem[]>([])
  const [skipped, setSkipped] = useState<ExcludedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [wRes, sRes] = await Promise.all([
        fetch('/api/watched'),
        fetch('/api/skipped'),
      ])
      const [wJson, sJson] = await Promise.all([wRes.json(), sRes.json()])
      if (wJson.success) setWatched(wJson.data)
      if (sJson.success) setSkipped(sJson.data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUndo(item: ExcludedItem, type: 'watched' | 'skipped') {
    const endpoint = type === 'watched' ? '/api/watched' : '/api/skipped'
    await fetch(`${endpoint}?contentId=${item.contentId}&contentType=${item.contentType}`, {
      method: 'DELETE',
    })
    if (type === 'watched') {
      setWatched((prev) => prev.filter(
        (w) => !(w.contentId === item.contentId && w.contentType === item.contentType)
      ))
      onWatchedUndo(item.contentId, item.contentType)
    } else {
      setSkipped((prev) => prev.filter(
        (s) => !(s.contentId === item.contentId && s.contentType === item.contentType)
      ))
      onSkippedUndo(item.contentId, item.contentType)
    }
  }

  const items = tab === 'watched' ? watched : skipped

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-12">
      {/* Sub tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('watched')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'watched'
              ? 'bg-amber-400 text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          봤어요{watched.length > 0 ? ` (${watched.length})` : ''}
        </button>
        <button
          onClick={() => setTab('skipped')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            tab === 'skipped'
              ? 'bg-amber-400 text-black'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          안볼래요{skipped.length > 0 ? ` (${skipped.length})` : ''}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="w-6 h-6 rounded-full border-2 border-zinc-600 border-t-amber-400 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500 gap-3">
          <span className="text-4xl">🍵</span>
          <p className="text-sm">목록이 비어 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <ExcludedCard
              key={`${item.contentType}:${item.contentId}`}
              item={item}
              type={tab}
              onUndo={handleUndo}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ExcludedCard({
  item,
  type,
  onUndo,
}: {
  item: ExcludedItem
  type: 'watched' | 'skipped'
  onUndo: (item: ExcludedItem, type: 'watched' | 'skipped') => Promise<void>
}) {
  const [hovering, setHovering] = useState(false)
  const [undoing, setUndoing] = useState(false)
  const imageUrl = tmdbImageUrl(item.posterPath)

  async function handleUndo() {
    setUndoing(true)
    await onUndo(item, type)
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative aspect-[2/3] bg-zinc-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover opacity-50"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
            이미지 없음
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            type === 'watched' ? 'bg-amber-500 text-black' : 'bg-zinc-700 text-zinc-300'
          }`}>
            {type === 'watched' ? '봤어요' : '안볼래요'}
          </span>
        </div>

        {hovering && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <button
              onClick={handleUndo}
              disabled={undoing}
              className="px-5 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {undoing ? '처리 중…' : '취소'}
            </button>
          </div>
        )}
      </div>

      <div className="p-2.5">
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
          {item.title || '제목 없음'}
        </p>
      </div>
    </div>
  )
}
