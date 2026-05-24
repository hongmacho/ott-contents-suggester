'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Eye, EyeOff, Star, X } from 'lucide-react'
import { tmdbImageUrl, type CuratedContent } from '@/lib/tmdb'
import { cn } from '@/lib/utils'

interface ContentCardProps {
  content: CuratedContent
  isWatched: boolean
  onWatched: (contentId: number, contentType: string) => void
  onUnwatched: (contentId: number, contentType: string) => void
  onSkip: (contentId: number, contentType: string) => void
}

function formatVoteCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}천`
  return String(count)
}

const PROVIDER_COLORS: Record<string, string> = {
  Netflix: 'bg-red-600',
  Tving: 'bg-rose-500',
  'Disney+': 'bg-blue-600',
  Wavve: 'bg-indigo-600',
}

export function ContentCard({ content, isWatched, onWatched, onUnwatched, onSkip }: ContentCardProps) {
  const [hovering, setHovering] = useState(false)

  const imageUrl = tmdbImageUrl(content.posterPath)

  function handleWatchedToggle() {
    if (isWatched) {
      onUnwatched(content.contentId, content.contentType)
      fetch(
        `/api/watched?contentId=${content.contentId}&contentType=${content.contentType}`,
        { method: 'DELETE' }
      )
    } else {
      onWatched(content.contentId, content.contentType)
      fetch('/api/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.contentId,
          contentType: content.contentType,
          title: content.title,
          posterPath: content.posterPath,
        }),
      })
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 transition-all duration-300',
        isWatched
          ? 'opacity-40 scale-[0.98]'
          : 'hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1'
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
            <span className="text-white font-medium text-base bg-zinc-800/80 px-3 py-1.5 rounded-full">
              시청 완료
            </span>
          </div>
        )}

        {/* Hover info overlay — desktop only */}
        {!isWatched && (
          <div
            className={cn(
              'absolute inset-0 hidden md:flex flex-col justify-end transition-all duration-300',
              hovering ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)' }}
          >
            <div className="px-3 pb-3 pt-10 space-y-2">
              {(content.director || content.cast.length > 0) && (
                <div className="space-y-1">
                  {content.director && (
                    <p className="text-sm text-zinc-200 leading-snug">
                      <span className="text-zinc-400">연출</span> {content.director}
                    </p>
                  )}
                  {content.cast.length > 0 && (
                    <p className="text-sm text-zinc-200 leading-snug">
                      <span className="text-zinc-400">출연</span> {content.cast.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {content.overview && (
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-6">
                  {content.overview}
                </p>
              )}

              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={handleWatchedToggle}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-sm font-semibold bg-amber-500/90 border border-amber-400 text-black hover:bg-amber-400/90 transition-colors"
                >
                  <Eye size={13} />
                  봤어요
                </button>
                <button
                  onClick={() => onSkip(content.contentId, content.contentType)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-sm font-semibold bg-zinc-800/90 border border-zinc-600 text-zinc-300 hover:bg-zinc-700/90 transition-colors"
                >
                  <X size={13} />
                  안볼래요
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile action buttons — always visible, no hover needed */}
        {!isWatched && (
          <div
            className="absolute bottom-0 inset-x-0 px-2 pb-2 flex gap-1.5 md:hidden"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}
          >
            <button
              onClick={handleWatchedToggle}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold bg-amber-500/90 border border-amber-400 text-black active:bg-amber-400"
            >
              <Eye size={11} />
              봤어요
            </button>
            <button
              onClick={() => onSkip(content.contentId, content.contentType)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-semibold bg-zinc-800/90 border border-zinc-600 text-zinc-300 active:bg-zinc-700"
            >
              <X size={11} />
              안볼래요
            </button>
          </div>
        )}

        {/* Watched undo button */}
        {isWatched && (
          <div className="absolute bottom-0 inset-x-0 px-2 pb-3 flex">
            <button
              onClick={handleWatchedToggle}
                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full text-sm font-semibold backdrop-blur-sm bg-zinc-700/80 border border-zinc-600 text-zinc-300 hover:bg-zinc-600/80 transition-colors"
            >
              <EyeOff size={13} />
              취소
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {content.providers.map((provider) => (
            <span
              key={provider}
              className={cn(
                'text-xs font-bold px-2 py-0.5 rounded text-white',
                PROVIDER_COLORS[provider] ?? 'bg-zinc-600'
              )}
            >
              {provider}
            </span>
          ))}
        </div>

        <h3 className="text-white font-semibold text-base leading-snug line-clamp-2">
          {content.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star size={12} fill="currentColor" />
            {content.voteAverage.toFixed(1)}
          </span>
          <span className="text-zinc-600">({formatVoteCount(content.voteCount)})</span>
          {content.releaseYear > 0 && <span>{content.releaseYear}년</span>}
          {content.numberOfSeasons != null && (
            <span>{content.numberOfSeasons}시즌</span>
          )}
        </div>

        {content.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.genres.slice(0, 3).map((genre) => (
              <span key={genre} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {genre}
              </span>
            ))}
          </div>
        )}

        {content.awards && content.awards.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.awards.slice(0, 2).map((award) => (
              <span key={award} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                🏆 {award}
              </span>
            ))}
          </div>
        )}

        {/* Mobile-only: director / cast / overview */}
        <div className="md:hidden space-y-1 pt-1 border-t border-zinc-800">
          {content.director && (
            <p className="text-xs text-zinc-400 leading-snug">
              <span className="text-zinc-600">연출</span> {content.director}
            </p>
          )}
          {content.cast.length > 0 && (
            <p className="text-xs text-zinc-400 leading-snug">
              <span className="text-zinc-600">출연</span> {content.cast.join(', ')}
            </p>
          )}
          {content.overview && (
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
              {content.overview}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
