'use client'

import { Toggle } from '@/components/ui/toggle'
import { OTT_PROVIDERS } from '@/lib/tmdb'
import { cn } from '@/lib/utils'

interface OttFilterBarProps {
  selected: number[]
  onChange: (selected: number[]) => void
}

const OTT_LIST = [
  { id: 8, label: 'Netflix' },
  { id: 97, label: 'Tving' },
  { id: 337, label: 'Disney+' },
  { id: 356, label: 'Wavve' },
]

export function OttFilterBar({ selected, onChange }: OttFilterBarProps) {
  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-zinc-500 shrink-0">OTT 플랫폼</span>
      {OTT_LIST.map(({ id, label }) => {
        const isActive = selected.includes(id)
        const provider = OTT_PROVIDERS[id]
        return (
          <Toggle
            key={id}
            pressed={isActive}
            onPressedChange={() => toggle(id)}
            className={cn(
              'h-9 px-4 text-sm font-semibold rounded-full border transition-all duration-200',
              'data-[state=off]:bg-transparent data-[state=off]:text-zinc-400 data-[state=off]:border-zinc-700 data-[state=off]:hover:border-zinc-500',
              'data-[state=on]:text-white data-[state=on]:border-transparent'
            )}
            style={isActive ? { backgroundColor: provider?.color } : undefined}
          >
            {label}
          </Toggle>
        )
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
        >
          전체
        </button>
      )}
    </div>
  )
}
