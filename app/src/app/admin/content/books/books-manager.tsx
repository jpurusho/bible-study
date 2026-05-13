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
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Book = Database['public']['Tables']['books']['Row']

interface BooksManagerProps {
  initialBooks: Book[]
}

export function BooksManager({ initialBooks }: BooksManagerProps) {
  const [books, setBooks] = useState(initialBooks)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave(formData: FormData) {
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string

    if (!title || !slug) {
      toast.error('Title and slug are required')
      return
    }

    if (editingBook) {
      const { error } = await supabase
        .from('books')
        .update({ title, slug, description: description || null })
        .eq('id', editingBook.id)

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Book updated')
    } else {
      const maxOrder = books.length > 0 ? Math.max(...books.map((b) => b.display_order)) : 0
      const { error } = await supabase
        .from('books')
        .insert({ title, slug, description: description || null, display_order: maxOrder + 1 })

      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Book created')
    }

    setDialogOpen(false)
    setEditingBook(null)
    router.refresh()
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('display_order', { ascending: true })
    if (data) setBooks(data)
  }

  async function handleDelete(book: Book) {
    if (!confirm(`Delete "${book.title}"? This will also delete all chapters and sessions within it.`)) {
      return
    }
    const { error } = await supabase.from('books').delete().eq('id', book.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Book deleted')
    setBooks(books.filter((b) => b.id !== book.id))
    router.refresh()
  }

  async function handleTogglePublish(book: Book) {
    const { error } = await supabase
      .from('books')
      .update({ is_published: !book.is_published })
      .eq('id', book.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setBooks(books.map((b) => (b.id === book.id ? { ...b, is_published: !b.is_published } : b)))
    toast.success(book.is_published ? 'Book unpublished' : 'Book published')
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...books]
    const temp = updated[index - 1].display_order
    updated[index - 1].display_order = updated[index].display_order
    updated[index].display_order = temp
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]

    setBooks(updated)
    await Promise.all([
      supabase.from('books').update({ display_order: updated[index].display_order }).eq('id', updated[index].id),
      supabase.from('books').update({ display_order: updated[index - 1].display_order }).eq('id', updated[index - 1].id),
    ])
  }

  async function handleMoveDown(index: number) {
    if (index === books.length - 1) return
    const updated = [...books]
    const temp = updated[index + 1].display_order
    updated[index + 1].display_order = updated[index].display_order
    updated[index].display_order = temp
    ;[updated[index + 1], updated[index]] = [updated[index], updated[index + 1]]

    setBooks(updated)
    await Promise.all([
      supabase.from('books').update({ display_order: updated[index].display_order }).eq('id', updated[index].id),
      supabase.from('books').update({ display_order: updated[index + 1].display_order }).eq('id', updated[index + 1].id),
    ])
  }

  function openCreate() {
    setEditingBook(null)
    setDialogOpen(true)
  }

  function openEdit(book: Book) {
    setEditingBook(book)
    setDialogOpen(true)
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Book
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit Book' : 'Create Book'}</DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingBook?.title ?? ''}
                  required
                  onChange={(e) => {
                    if (!editingBook) {
                      const slugInput = document.getElementById('slug') as HTMLInputElement
                      if (slugInput) slugInput.value = generateSlug(e.target.value)
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL path)</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingBook?.slug ?? ''}
                  required
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingBook?.description ?? ''}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingBook ? 'Save' : 'Create'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No books yet. Create your first book to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {books.map((book, index) => (
            <div
              key={book.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <GripVertical className="size-4 rotate-180" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === books.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <GripVertical className="size-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{book.title}</span>
                  {!book.is_published && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">/{book.slug}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleTogglePublish(book)}
                  title={book.is_published ? 'Unpublish' : 'Publish'}
                >
                  {book.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </Button>
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(book)} title="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(book)}
                  title="Delete"
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link href={`/admin/content/books/${book.id}`}>
                  <Button variant="ghost" size="icon-xs" title="Chapters">
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
