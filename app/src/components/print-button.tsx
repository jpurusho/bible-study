'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      title="Print or save as PDF"
    >
      <Printer className="size-4" />
      <span className="hidden sm:inline">Save as PDF</span>
    </button>
  )
}
