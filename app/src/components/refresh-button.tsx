'use client'

import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.refresh()}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Refresh"
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  )
}
