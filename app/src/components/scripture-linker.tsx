'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Loader2, X } from 'lucide-react'
import { findScriptureRefs } from '@/lib/scripture-refs'

interface ExpandedVerse {
  /** As written in the content — what the popup header shows. */
  reference: string
  /** Normalized book name — what /api/bible is asked for. */
  lookup: string
  text: string | null
  loading: boolean
  error: boolean
  element: HTMLElement
}

interface ScriptureLinkerProps {
  /**
   * Canonical book name for the session being read. Lets references written
   * without a book ("cf. 22:2; 26:14") resolve against it, which is how the
   * study notes cite the book they are expounding.
   */
  defaultBook?: string
}

export function ScriptureLinker({ defaultBook }: ScriptureLinkerProps = {}) {
  const [expandedVerse, setExpandedVerse] = useState<ExpandedVerse | null>(null)
  const processedRef = useRef(false)

  const fetchVerse = useCallback(async (reference: string, lookup: string, element: HTMLElement) => {
    if (expandedVerse?.reference === reference) {
      setExpandedVerse(null)
      return
    }

    setExpandedVerse({ reference, lookup, text: null, loading: true, error: false, element })

    try {
      const res = await fetch(`/api/bible?ref=${encodeURIComponent(lookup)}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedVerse({ reference, lookup, text: data.text, loading: false, error: false, element })
      } else {
        setExpandedVerse({ reference, lookup, text: null, loading: false, error: true, element })
      }
    } catch {
      setExpandedVerse({ reference, lookup, text: null, loading: false, error: true, element })
    }
  }, [expandedVerse?.reference])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const container = document.querySelector('[data-content-container]')
    if (!container) return

    // Collect first, then rewrite: replacing nodes while the walker is live
    // would have it step into the freshly inserted text.
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const textNodes: Text[] = []

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (node.textContent) textNodes.push(node)
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || ''
      const parent = textNode.parentNode
      if (!parent) return
      if (parent instanceof HTMLElement && parent.closest('[data-scripture-link]')) return

      const matches = findScriptureRefs(text, defaultBook)
      if (matches.length === 0) return

      const fragment = document.createDocumentFragment()
      let lastIndex = 0

      for (const { display, canonical, start, end } of matches) {
        if (start > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)))
        }

        const link = document.createElement('button')
        link.setAttribute('data-scripture-link', display)
        link.setAttribute('data-scripture-lookup', canonical)
        link.className = 'inline-flex items-center gap-0.5 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary cursor-pointer font-medium transition-colors'
        link.textContent = display
        link.addEventListener('click', (e) => {
          e.preventDefault()
          const target = e.currentTarget as HTMLElement
          window.dispatchEvent(
            new CustomEvent('scripture-click', {
              detail: { reference: display, lookup: canonical, element: target },
            })
          )
        })
        fragment.appendChild(link)

        lastIndex = end
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
      }

      parent.replaceChild(fragment, textNode)
    })
  }, [defaultBook])

  useEffect(() => {
    function handleClick(e: Event) {
      const detail = (e as CustomEvent).detail
      fetchVerse(detail.reference, detail.lookup ?? detail.reference, detail.element)
    }
    window.addEventListener('scripture-click', handleClick)
    return () => window.removeEventListener('scripture-click', handleClick)
  }, [fetchVerse])

  if (!expandedVerse) return null

  const rect = expandedVerse.element.getBoundingClientRect()
  const top = rect.bottom + window.scrollY + 8

  return createPortal(
    <div
      className="absolute left-4 right-4 sm:left-auto sm:right-auto z-50 max-w-lg"
      style={{ top, left: Math.max(16, Math.min(rect.left, window.innerWidth - 400)) }}
    >
      <div className="rounded-xl border border-primary/20 bg-background shadow-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <BookOpen className="size-4" />
            {expandedVerse.reference}
          </span>
          <button
            onClick={() => setExpandedVerse(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {expandedVerse.loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Loading...
          </div>
        )}
        {expandedVerse.error && (
          <p className="text-sm text-muted-foreground">Could not load this passage.</p>
        )}
        {expandedVerse.text && (
          <div className="text-sm leading-7 text-foreground/85 italic border-l-2 border-primary/30 pl-3">
            {expandedVerse.text}
          </div>
        )}
        <p className="text-xs text-muted-foreground">ESV</p>
      </div>
    </div>,
    document.body
  )
}
