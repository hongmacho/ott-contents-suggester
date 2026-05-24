'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <Tabs value={value} onValueChange={(v) => onChange(v as Category)}>
      <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto gap-1">
        {CATEGORIES.map((cat) => (
          <TabsTrigger
            key={cat.value}
            value={cat.value}
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:font-semibold text-zinc-400 hover:text-white transition-colors px-4 py-2 text-sm rounded-md"
          >
            <span className="mr-1.5">{cat.emoji}</span>
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
