'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RefreshButtonProps {
  onClick: () => void
  loading: boolean
}

export function RefreshButton({ onClick, loading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200',
        'bg-amber-500 text-black hover:bg-amber-400 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
      )}
    >
      <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
      다시 추천받기
    </button>
  )
}
