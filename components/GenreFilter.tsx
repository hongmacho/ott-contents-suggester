'use client'

import { cn } from '@/lib/utils'
import type { Category } from '@/lib/tmdb'

interface GenreOption {
  id: number
  label: string
}

const GENRE_OPTIONS: Record<'drama' | 'movie', GenreOption[]> = {
  drama: [
    { id: 10749, label: '로맨스' },
    { id: 9648, label: '미스터리' },
    { id: 53, label: '스릴러' },
    { id: 80, label: '범죄' },
    { id: 10765, label: 'SF&판타지' },
    { id: 27, label: '공포' },
    { id: 36, label: '역사' },
    { id: 10759, label: '액션' },
  ],
  movie: [
    { id: 28, label: '액션' },
    { id: 35, label: '코미디' },
    { id: 10749, label: '로맨스' },
    { id: 53, label: '스릴러' },
    { id: 878, label: 'SF' },
    { id: 27, label: '공포' },
    { id: 80, label: '범죄' },
    { id: 14, label: '판타지' },
    { id: 12, label: '어드벤처' },
    { id: 36, label: '역사' },
  ],
}

interface GenreFilterProps {
  category: Category
  value: number[]
  onChange: (value: number[]) => void
}

export function GenreFilter({ category, value, onChange }: GenreFilterProps) {
  const options = GENRE_OPTIONS[category as 'drama' | 'movie']
  if (!options) return null

  function toggle(id: number) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-zinc-500">장르</span>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((genre) => {
          const isActive = value.includes(genre.id)
          return (
            <button
              key={genre.id}
              onClick={() => toggle(genre.id)}
              className={cn(
                'shrink-0 h-8 px-3.5 text-xs font-semibold rounded-full border transition-all duration-200',
                isActive
                  ? 'bg-amber-500 border-amber-500 text-black'
                  : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
              )}
            >
              {genre.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
