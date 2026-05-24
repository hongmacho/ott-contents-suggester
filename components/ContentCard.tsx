'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Eye, EyeOff, Star } from 'lucide-react'
import { tmdbImageUrl, type CuratedContent } from '@/lib/tmdb'
import { cn } from '@/lib/utils'

interface ContentCardProps {
  content: CuratedContent
  isWatched: boolean
  onWatched: (contentId: number, contentType: string) => void
  onUnwatched: (contentId: number, contentType: string) => void
}

const PROVIDER_COLORS: Record<string, string> = {
  Netflix: 'bg-red-600',
  Tving: 'bg-rose-500',
  'Disney+': 'bg-blue-600',
  Wavve: 'bg-indigo-600',
}

export function ContentCard({ content, isWatched, onWatched, onUnwatched }: ContentCardProps) {
  const [hovering, setHovering] = useState(false)
  const [loading, setLoading] = useState(false)

  const imageUrl = tmdbImageUrl(content.posterPath)

  async function handleWatchedToggle() {
    setLoading(true)
    if (isWatched) {
      await fetch(
        `/api/watched?contentId=${content.contentId}&contentType=${content.contentType}`,
        { method: 'DELETE' }
      )
      onUnwatched(content.contentId, content.contentType)
    } else {
      await fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: content.contentId, contentType: content.contentType }),
      })
      onWatched(content.contentId, content.contentType)
    }
    setLoading(false)
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-300',
        isWatched ? 'opacity-40 scale-[0.98]' : 'hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1'
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-zinc-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={content.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-sm">
            이미지 없음
          </div>
        )}

        {/* Watched overlay */}
        {isWatched && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium text-sm bg-zinc-800/80 px-3 py-1.5 rounded-full">
              시청 완료
            </span>
          </div>
        )}

        {/* Watched button - shows on hover */}
        <button
          onClick={handleWatchedToggle}
          disabled={loading}
          className={cn(
            'absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
            'backdrop-blur-sm border shadow-lg',
            hovering || isWatched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            isWatched
              ? 'bg-zinc-700/80 border-zinc-600 text-zinc-300 hover:bg-zinc-600/80'
              : 'bg-amber-500/90 border-amber-400 text-black hover:bg-amber-400/90'
          )}
        >
          {isWatched ? (
            <>
              <EyeOff size={12} />
              취소
            </>
          ) : (
            <>
              <Eye size={12} />
              봤어요
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        {/* OTT badges */}
        <div className="flex flex-wrap gap-1">
          {content.providers.map((provider) => (
            <span
              key={provider}
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded text-white',
                PROVIDER_COLORS[provider] ?? 'bg-zinc-600'
              )}
            >
              {provider}
            </span>
          ))}
        </div>

        <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2">
          {content.title}
        </h3>

        {/* Rating + Year */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star size={10} fill="currentColor" />
            {content.voteAverage.toFixed(1)}
          </span>
          {content.releaseYear > 0 && <span>{content.releaseYear}년</span>}
        </div>

        {/* Recommendation reason */}
        {content.recommendationReason && (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
            {content.recommendationReason}
          </p>
        )}
      </div>
    </div>
  )
}
