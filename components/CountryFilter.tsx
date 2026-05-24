'use client'

import { cn } from '@/lib/utils'
import type { OriginLanguage } from '@/lib/tmdb'

interface CountryFilterProps {
  value: OriginLanguage[]
  onChange: (value: OriginLanguage[]) => void
}

const COUNTRIES: { value: OriginLanguage; label: string }[] = [
  { value: 'ko', label: '🇰🇷 한국' },
  { value: 'ja', label: '🇯🇵 일본' },
  { value: 'zh', label: '🇨🇳 중국' },
  { value: 'en', label: '🇺🇸 영미권' },
  { value: 'other', label: '🌍 그외' },
]

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  function toggle(lang: OriginLanguage) {
    if (value.includes(lang)) {
      onChange(value.filter((v) => v !== lang))
    } else {
      onChange([...value, lang])
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-zinc-500 shrink-0">선호국가</span>
      {COUNTRIES.map((country) => {
        const isActive = value.includes(country.value)
        return (
          <button
            key={country.value}
            onClick={() => toggle(country.value)}
            className={cn(
              'h-9 px-4 text-sm font-semibold rounded-full border transition-all duration-200',
              isActive
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500'
            )}
          >
            {country.label}
          </button>
        )
      })}
    </div>
  )
}
