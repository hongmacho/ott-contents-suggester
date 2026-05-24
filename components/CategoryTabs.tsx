'use client'

import { cn } from '@/lib/utils'
import type { Category } from '@/lib/tmdb'

interface CategoryTabsProps {
  value: Category
  onChange: (category: Category) => void
}

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'drama', label: '드라마', emoji: '🎭' },
  { value: 'movie', label: '영화', emoji: '🎬' },
  { value: 'variety', label: '예능', emoji: '🎉' },
  { value: 'documentary', label: '다큐멘터리', emoji: '📽️' },
]

export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-zinc-500">카테고리</span>
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={cn(
              'shrink-0 h-8 px-3.5 text-xs font-semibold rounded-full border transition-all duration-200',
              value === cat.value
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
            )}
          >
            <span className="mr-1">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
