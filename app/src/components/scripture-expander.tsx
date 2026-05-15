'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScriptureExpanderProps {
  reference: string
}

export function ScriptureExpander({ reference }: ScriptureExpanderProps) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleToggle() {
    if (expanded) {
      setExpanded(false)
      return
    }

    setExpanded(true)

    if (text) return

    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/bible?ref=${encodeURIComponent(reference)}`)
      if (res.ok) {
        const data = await res.json()
        setText(data.text)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-block">
      <button
        onClick={handleToggle}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
          'bg-primary/10 text-primary hover:bg-primary/20',
          expanded && 'bg-primary/20'
        )}
        title={`Read ${reference} (ESV)`}
      >
        <BookOpen className="size-3" />
        {reference}
        {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
      </button>
      {expanded && (
        <span className="block mt-2 mb-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-7 text-foreground/85 italic">
          {loading && (
            <span className="flex items-center gap-2 text-muted-foreground not-italic text-xs">
              <Loader2 className="size-3 animate-spin" />
              Loading scripture...
            </span>
          )}
          {error && (
            <span className="text-muted-foreground not-italic text-xs">
              Could not load this passage. Try again later.
            </span>
          )}
          {text && (
            <>
              <span className="block">{text}</span>
              <span className="block mt-2 text-xs not-italic text-primary/70 font-medium">
                {reference} (ESV)
              </span>
            </>
          )}
        </span>
      )}
    </span>
  )
}
