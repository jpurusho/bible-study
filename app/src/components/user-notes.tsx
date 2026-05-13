'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, StickyNote, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface UserNotesProps {
  sessionId: string
  userId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function UserNotes({ sessionId, userId }: UserNotesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = useRef(createClient()).current

  const CHARACTER_LIMIT = 5000

  // Fetch existing note on mount
  useEffect(() => {
    async function fetchNote() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('user_notes')
        .select('id, content')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .eq('scope', 'session')
        .maybeSingle()

      if (error) {
        toast.error('Failed to load your note')
      } else if (data) {
        setContent(data.content ?? '')
        setNoteId(data.id)
      }
      setIsLoading(false)
    }

    fetchNote()
  }, [sessionId, userId, supabase])

  // Save/upsert note
  const saveNote = useCallback(
    async (text: string) => {
      if (!text.trim() && !noteId) return

      setStatus('saving')

      const payload = {
        user_id: userId,
        session_id: sessionId,
        scope: 'session' as const,
        content: text,
        updated_at: new Date().toISOString(),
      }

      let error

      if (noteId) {
        ;({ error } = await supabase
          .from('user_notes')
          .update({ content: text, updated_at: new Date().toISOString() })
          .eq('id', noteId))
      } else {
        const result = await supabase
          .from('user_notes')
          .upsert(payload, { onConflict: 'user_id,session_id,scope' })
          .select('id')
          .single()

        error = result.error
        if (result.data) {
          setNoteId(result.data.id)
        }
      }

      if (error) {
        setStatus('error')
        toast.error('Failed to save note')
      } else {
        setStatus('saved')
      }
    },
    [noteId, sessionId, userId, supabase]
  )

  // Handle content change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length > CHARACTER_LIMIT) return

    setContent(value)
    setStatus('idle')

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      saveNote(value)
    }, 2000)
  }

  // Delete note
  const handleDelete = async () => {
    if (!noteId) {
      setContent('')
      return
    }

    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      toast.error('Failed to delete note')
    } else {
      setContent('')
      setNoteId(null)
      setStatus('idle')
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="border border-border rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
      >
        {isOpen ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
        <StickyNote className="size-4 text-muted-foreground" />
        <span>My Notes</span>
        {content.trim() && !isOpen && (
          <span className="ml-auto text-xs text-muted-foreground">has notes</span>
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={handleChange}
                placeholder="Write your personal notes for this session..."
                className="min-h-32 resize-y"
                maxLength={CHARACTER_LIMIT}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusIndicator status={status} />
                  <span className="text-xs text-muted-foreground">
                    {content.length}/{CHARACTER_LIMIT}
                  </span>
                </div>

                {(content.trim() || noteId) && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                    <span>Delete</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function StatusIndicator({ status }: { status: SaveStatus }) {
  switch (status) {
    case 'saving':
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Saving...
        </span>
      )
    case 'saved':
      return (
        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <Check className="size-3" />
          Saved
        </span>
      )
    case 'error':
      return (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" />
          Error saving
        </span>
      )
    default:
      return null
  }
}
