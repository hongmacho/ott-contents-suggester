'use client'

import { Slider } from '@/components/ui/slider'

const MIN_YEAR = 1990
const MAX_YEAR = new Date().getFullYear()

interface YearRangeSliderProps {
  value: [number, number] | null
  onChange: (value: [number, number] | null) => void
}

export function YearRangeSlider({ value, onChange }: YearRangeSliderProps) {
  const current = value ?? [MIN_YEAR, MAX_YEAR]
  const isFiltered = value !== null && (value[0] > MIN_YEAR || value[1] < MAX_YEAR)

  function handleChange(vals: number | readonly number[]) {
    if (typeof vals === 'number') return
    const next: [number, number] = [vals[0], vals[1]]
    if (next[0] === MIN_YEAR && next[1] === MAX_YEAR) {
      onChange(null)
    } else {
      onChange(next)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">출시 연도</span>
        <span className={isFiltered ? 'text-amber-400 font-medium' : 'text-zinc-500'}>
          {isFiltered ? `${current[0]} ~ ${current[1]}년` : '전체 연도'}
        </span>
      </div>
      <Slider
        min={MIN_YEAR}
        max={MAX_YEAR}
        step={1}
        value={current}
        onValueChange={handleChange}
        minStepsBetweenValues={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-zinc-600">
        <span>{MIN_YEAR}</span>
        <span>{MAX_YEAR}</span>
      </div>
    </div>
  )
}
