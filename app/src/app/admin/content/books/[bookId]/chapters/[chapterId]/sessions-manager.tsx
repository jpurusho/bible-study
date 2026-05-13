'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Session = Database['public']['Tables']['sessions']['Row']

interface SessionsManagerProps {
  chapterId: string
  bookId: string
  initialSessions: Session[]
}

export function SessionsManager({ chapterId, bookId, initialSessions }: SessionsManagerProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(formData: FormData) {
    const title = formData.get('title') as string
    const sessionNumber = parseInt(formData.get('session_number') as string, 10)
    const scriptureReference = formData.get('scripture_reference') as string

    if (!title || isNaN(sessionNumber)) {
      toast.error('Title and session number are required')
      return
    }

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update({
          title,
          session_number: sessionNumber,
          scripture_reference: scriptureReference || null,
        })
        .eq('id', editingSession.id)

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Session updated')
    } else {
      const maxOrder = sessions.length > 0 ? Math.max(...sessions.map((s) => s.display_order)) : 0
      const { error } = await supabase.from('sessions').insert({
        chapter_id: chapterId,
        title,
        session_number: sessionNumber,
        scripture_reference: scriptureReference || null,
        display_order: maxOrder + 1,
      })

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Session created')
    }

    setDialogOpen(false)
    setEditingSession(null)
    router.refresh()
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('display_order', { ascending: true })
    if (data) setSessions(data)
  }

  async function handleDelete(session: Session) {
    if (!confirm(`Delete "${session.title}"?`)) return
    const { error } = await supabase.from('sessions').delete().eq('id', session.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Session deleted')
    setSessions(sessions.filter((s) => s.id !== session.id))
    router.refresh()
  }

  async function handleTogglePublish(session: Session) {
    const newPublished = !session.is_published
    const { error } = await supabase
      .from('sessions')
      .update({
        is_published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
      })
      .eq('id', session.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setSessions(
      sessions.map((s) =>
        s.id === session.id
          ? { ...s, is_published: newPublished, published_at: newPublished ? new Date().toISOString() : null }
          : s
      )
    )
    toast.success(session.is_published ? 'Session unpublished' : 'Session published')
  }

  function openCreate() {
    setEditingSession(null)
    setDialogOpen(true)
  }

  function openEdit(session: Session) {
    setEditingSession(session)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Session
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Edit Session' : 'Create Session'}</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingSession?.title ?? ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_number">Session Number</Label>
                <Input
                  id="session_number"
                  name="session_number"
                  type="number"
                  min={1}
                  defaultValue={editingSession?.session_number ?? sessions.length + 1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scripture_reference">Scripture Reference</Label>
                <Input
                  id="scripture_reference"
                  name="scripture_reference"
                  placeholder="e.g., Acts 1:1-11"
                  defaultValue={editingSession?.scripture_reference ?? ''}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSession ? 'Save' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No sessions yet. Add the first session.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    #{session.session_number}
                  </span>
                  <span className="font-medium truncate">{session.title}</span>
                  {!session.is_published && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
                {session.scripture_reference && (
                  <p className="text-sm text-muted-foreground">{session.scripture_reference}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleTogglePublish(session)}
                  title={session.is_published ? 'Unpublish' : 'Publish'}
                >
                  {session.is_published ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(session)} title="Edit metadata">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(session)}
                  title="Delete"
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link href={`/admin/content/books/${bookId}/chapters/${chapterId}/sessions/${session.id}`}>
                  <Button variant="ghost" size="icon-xs" title="Edit Content">
                    <FileText className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
