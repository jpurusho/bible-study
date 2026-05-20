'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen, Loader2, X } from 'lucide-react'

const SCRIPTURE_REGEX = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs?|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+(\d+[:\d\-,;\s]*\d*)/gi

interface ExpandedVerse {
  reference: string
  text: string | null
  loading: boolean
  error: boolean
  element: HTMLElement
}

export function ScriptureLinker() {
  const [expandedVerse, setExpandedVerse] = useState<ExpandedVerse | null>(null)
  const processedRef = useRef(false)

  const fetchVerse = useCallback(async (reference: string, element: HTMLElement) => {
    if (expandedVerse?.reference === reference) {
      setExpandedVerse(null)
      return
    }

    setExpandedVerse({ reference, text: null, loading: true, error: false, element })

    try {
      const res = await fetch(`/api/bible?ref=${encodeURIComponent(reference)}`)
      if (res.ok) {
        const data = await res.json()
        setExpandedVerse({ reference, text: data.text, loading: false, error: false, element })
      } else {
        setExpandedVerse({ reference, text: null, loading: false, error: true, element })
      }
    } catch {
      setExpandedVerse({ reference, text: null, loading: false, error: true, element })
    }
  }, [expandedVerse?.reference])

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const container = document.querySelector('[data-content-container]')
    if (!container) return

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const textNodes: Text[] = []

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (node.textContent && SCRIPTURE_REGEX.test(node.textContent)) {
        textNodes.push(node)
      }
      SCRIPTURE_REGEX.lastIndex = 0
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || ''
      const parent = textNode.parentNode
      if (!parent) return
      if (parent instanceof HTMLElement && parent.closest('[data-scripture-link]')) return

      const fragment = document.createDocumentFragment()
      let lastIndex = 0
      let match

      SCRIPTURE_REGEX.lastIndex = 0
      while ((match = SCRIPTURE_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
        }

        const reference = match[0].trim()
        const link = document.createElement('button')
        link.setAttribute('data-scripture-link', reference)
        link.className = 'inline-flex items-center gap-0.5 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30 hover:decoration-primary cursor-pointer font-medium transition-colors'
        link.textContent = reference
        link.addEventListener('click', (e) => {
          e.preventDefault()
          const target = e.currentTarget as HTMLElement
          window.dispatchEvent(new CustomEvent('scripture-click', { detail: { reference, element: target } }))
        })
        fragment.appendChild(link)

        lastIndex = match.index + match[0].length
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
      }

      if (lastIndex > 0) {
        parent.replaceChild(fragment, textNode)
      }
    })
  }, [])

  useEffect(() => {
    function handleClick(e: Event) {
      const detail = (e as CustomEvent).detail
      fetchVerse(detail.reference, detail.element)
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
