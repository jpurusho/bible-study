'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Highlighter, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HighlightToolbarProps {
  sessionId: string
  userId: string
}

type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink'

interface Highlight {
  id: string
  user_id: string
  session_id: string
  start_offset: number
  end_offset: number
  text_snippet: string
  color: HighlightColor
  note: string | null
  created_at: string
}

const COLOR_OPTIONS: { color: HighlightColor; label: string; className: string }[] = [
  { color: 'yellow', label: 'Yellow', className: 'bg-yellow-300 dark:bg-yellow-400' },
  { color: 'green', label: 'Green', className: 'bg-green-300 dark:bg-green-400' },
  { color: 'blue', label: 'Blue', className: 'bg-blue-300 dark:bg-blue-400' },
  { color: 'pink', label: 'Pink', className: 'bg-pink-300 dark:bg-pink-400' },
]

const COLOR_BADGE_MAP: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-300/30 dark:text-yellow-200',
  green: 'bg-green-200 text-green-900 dark:bg-green-300/30 dark:text-green-200',
  blue: 'bg-blue-200 text-blue-900 dark:bg-blue-300/30 dark:text-blue-200',
  pink: 'bg-pink-200 text-pink-900 dark:bg-pink-300/30 dark:text-pink-200',
}

export function HighlightToolbar({ sessionId, userId }: HighlightToolbarProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })
  const [selectedText, setSelectedText] = useState('')
  const [selectionOffsets, setSelectionOffsets] = useState<{ start: number; end: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const contentContainerRef = useRef<HTMLElement | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Fetch existing highlights on mount
  useEffect(() => {
    async function fetchHighlights() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('user_highlights')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        toast.error(`Failed to load highlights: ${error.message}`)
      } else if (data) {
        setHighlights(data as Highlight[])
      }
      setIsLoading(false)
    }

    fetchHighlights()
  }, [sessionId, userId, supabase])

  // Compute character offset relative to content container
  const getCharacterOffset = useCallback((node: Node, offset: number, container: HTMLElement): number => {
    const range = document.createRange()
    range.setStart(container, 0)
    range.setEnd(node, offset)
    return range.toString().length
  }, [])

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()

    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      // Delay hiding to allow clicking on the toolbar
      setTimeout(() => {
        const toolbar = toolbarRef.current
        if (toolbar && toolbar.matches(':hover')) return
        setToolbarVisible(false)
        setSelectedText('')
        setSelectionOffsets(null)
      }, 200)
      return
    }

    const text = selection.toString().trim()
    if (!text || text.length < 2) {
      setToolbarVisible(false)
      return
    }

    // Find the content container
    const container = contentContainerRef.current ?? document.querySelector('[data-content-container]')
    if (!container) return

    const range = selection.getRangeAt(0)

    // Ensure selection is within the content container
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
      setToolbarVisible(false)
      return
    }

    // Compute offsets
    const startOffset = getCharacterOffset(range.startContainer, range.startOffset, container as HTMLElement)
    const endOffset = getCharacterOffset(range.endContainer, range.endOffset, container as HTMLElement)

    // Position the toolbar above the selection
    const rect = range.getBoundingClientRect()
    setToolbarPosition({
      top: rect.top + window.scrollY - 48,
      left: rect.left + window.scrollX + rect.width / 2,
    })

    setSelectedText(text)
    setSelectionOffsets({ start: startOffset, end: endOffset })
    setToolbarVisible(true)
  }, [getCharacterOffset])

  // Set up selection listener
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [handleSelectionChange])

  // Find content container on mount
  useEffect(() => {
    const container = document.querySelector('[data-content-container]')
    if (container) {
      contentContainerRef.current = container as HTMLElement
    }
  }, [])

  // Save a highlight
  const saveHighlight = async (color: HighlightColor) => {
    if (!selectedText || !selectionOffsets) return

    const snippet = selectedText.length > 200 ? selectedText.slice(0, 200) + '...' : selectedText

    const { data, error } = await supabase
      .from('user_highlights')
      .insert({
        user_id: userId,
        session_id: sessionId,
        start_offset: selectionOffsets.start,
        end_offset: selectionOffsets.end,
        text_snippet: snippet,
        color,
        note: null,
      })
      .select()
      .single()

    if (error) {
      toast.error(`Failed to save highlight: ${error.message}`)
    } else if (data) {
      setHighlights((prev) => [data as Highlight, ...prev])
      toast.success('Highlight saved')
    }

    // Clear selection
    window.getSelection()?.removeAllRanges()
    setToolbarVisible(false)
    setSelectedText('')
    setSelectionOffsets(null)
  }

  // Delete a highlight
  const deleteHighlight = async (id: string) => {
    const { error } = await supabase
      .from('user_highlights')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Failed to delete highlight')
    } else {
      setHighlights((prev) => prev.filter((h) => h.id !== id))
    }
  }

  return (
    <>
      {/* Floating toolbar that appears on text selection */}
      {toolbarVisible && (
        <div
          ref={toolbarRef}
          className="fixed z-50 flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg animate-in fade-in-0 zoom-in-95"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <Highlighter className="size-3.5 text-muted-foreground mr-1" />
          {COLOR_OPTIONS.map(({ color, label, className }) => (
            <button
              key={color}
              onClick={() => saveHighlight(color)}
              title={`Highlight ${label}`}
              className={cn(
                'size-6 rounded-full border border-border/50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                className
              )}
            />
          ))}
          <button
            onClick={() => {
              window.getSelection()?.removeAllRanges()
              setToolbarVisible(false)
            }}
            className="ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
            title="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Highlights list panel */}
      {highlights.length > 0 && (
        <div className="border border-border rounded-lg">
          <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground">
            <Highlighter className="size-4 text-muted-foreground" />
            <span>My Highlights</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {highlights.length} {highlights.length === 1 ? 'highlight' : 'highlights'}
            </span>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-2">Loading highlights...</p>
            ) : (
              highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="flex items-start gap-2 rounded-md border border-border/50 p-2 text-sm"
                >
                  <span
                    className={cn(
                      'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium',
                      COLOR_BADGE_MAP[highlight.color]
                    )}
                  >
                    {highlight.color}
                  </span>
                  <p className="flex-1 text-foreground/80 line-clamp-2">
                    &ldquo;{highlight.text_snippet}&rdquo;
                  </p>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => deleteHighlight(highlight.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
