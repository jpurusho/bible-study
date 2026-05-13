'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface TOCItem {
  id: string
  text: string
  level: number
}

function extractHeadings(html: string): TOCItem[] {
  const headings: TOCItem[] = []
  const regex = /<h([1-4])[^>]*>(.*?)<\/h[1-4]>/gi
  let match

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10)
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text) {
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      headings.push({ id, text, level })
    }
  }

  return headings
}

export function TableOfContents({ html }: { html: string }) {
  const headings = useMemo(() => extractHeadings(html), [html])

  if (headings.length === 0) return null

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        On this page
      </p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={cn(
            'block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5',
            heading.level === 1 && 'font-medium',
            heading.level === 2 && 'pl-3',
            heading.level === 3 && 'pl-6',
            heading.level === 4 && 'pl-9'
          )}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  )
}
