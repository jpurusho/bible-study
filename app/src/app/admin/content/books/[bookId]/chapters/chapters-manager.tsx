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
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Chapter = Database['public']['Tables']['chapters']['Row']

interface ChaptersManagerProps {
  bookId: string
  initialChapters: Chapter[]
}

export function ChaptersManager({ bookId, initialChapters }: ChaptersManagerProps) {
  const [chapters, setChapters] = useState(initialChapters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(formData: FormData) {
    const title = formData.get('title') as string
    const chapterNumber = parseInt(formData.get('chapter_number') as string, 10)
    const description = formData.get('description') as string

    if (!title || isNaN(chapterNumber)) {
      toast.error('Title and chapter number are required')
      return
    }

    if (editingChapter) {
      const { error } = await supabase
        .from('chapters')
        .update({ title, chapter_number: chapterNumber, description: description || null })
        .eq('id', editingChapter.id)

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Chapter updated')
    } else {
      const maxOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.display_order)) : 0
      const { error } = await supabase.from('chapters').insert({
        book_id: bookId,
        title,
        chapter_number: chapterNumber,
        description: description || null,
        display_order: maxOrder + 1,
      })

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Chapter created')
    }

    setDialogOpen(false)
    setEditingChapter(null)
    router.refresh()
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('display_order', { ascending: true })
    if (data) setChapters(data)
  }

  async function handleDelete(chapter: Chapter) {
    if (!confirm(`Delete "${chapter.title}"? This will also delete all sessions within it.`)) {
      return
    }
    const { error } = await supabase.from('chapters').delete().eq('id', chapter.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Chapter deleted')
    setChapters(chapters.filter((c) => c.id !== chapter.id))
    router.refresh()
  }

  async function handleTogglePublish(chapter: Chapter) {
    const { error } = await supabase
      .from('chapters')
      .update({ is_published: !chapter.is_published })
      .eq('id', chapter.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setChapters(
      chapters.map((c) =>
        c.id === chapter.id ? { ...c, is_published: !c.is_published } : c
      )
    )
    toast.success(chapter.is_published ? 'Chapter unpublished' : 'Chapter published')
  }

  function openCreate() {
    setEditingChapter(null)
    setDialogOpen(true)
  }

  function openEdit(chapter: Chapter) {
    setEditingChapter(chapter)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Chapter
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Create Chapter'}</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingChapter?.title ?? ''}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapter_number">Chapter Number</Label>
                <Input
                  id="chapter_number"
                  name="chapter_number"
                  type="number"
                  min={1}
                  defaultValue={editingChapter?.chapter_number ?? chapters.length + 1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingChapter?.description ?? ''}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingChapter ? 'Save' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No chapters yet. Add the first chapter.
        </div>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-mono">
                    Ch. {chapter.chapter_number}
                  </span>
                  <span className="font-medium truncate">{chapter.title}</span>
                  {!chapter.is_published && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
                {chapter.description && (
                  <p className="text-sm text-muted-foreground truncate">{chapter.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleTogglePublish(chapter)}
                  title={chapter.is_published ? 'Unpublish' : 'Publish'}
                >
                  {chapter.is_published ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(chapter)} title="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(chapter)}
                  title="Delete"
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link href={`/admin/content/books/${bookId}/chapters/${chapter.id}`}>
                  <Button variant="ghost" size="icon-xs" title="View Sessions">
                    <ChevronRight className="size-4" />
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
