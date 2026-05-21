'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Eye, EyeOff, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Announcement = Database['public']['Tables']['announcements']['Row']

interface Props {
  initialAnnouncements: Announcement[]
}

export function AnnouncementsManager({ initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(formData: FormData) {
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const priority = formData.get('priority') as Announcement['priority']
    const startsAt = formData.get('starts_at') as string
    const endsAt = formData.get('ends_at') as string

    if (!title || !content) {
      toast.error('Title and content are required')
      return
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        priority: priority || 'info',
        starts_at: startsAt || new Date().toISOString(),
        ends_at: endsAt || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      return
    }
    if (data) setAnnouncements([data, ...announcements])
    toast.success('Announcement created')
    setShowForm(false)
    router.refresh()
  }

  async function handleToggleActive(announcement: Announcement) {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !announcement.is_active })
      .eq('id', announcement.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setAnnouncements(
      announcements.map((a) =>
        a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
      )
    )
  }

  async function handleDelete(announcement: Announcement) {
    if (!confirm(`Delete "${announcement.title}"?`)) return
    const { error } = await supabase.from('announcements').delete().eq('id', announcement.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setAnnouncements(announcements.filter((a) => a.id !== announcement.id))
    toast.success('Announcement deleted')
  }

  const priorityIcon = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="size-4 text-red-500" />
      case 'important': return <AlertTriangle className="size-4 text-amber-500" />
      default: return <Info className="size-4 text-blue-500" />
    }
  }

  const priorityBorder = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500'
      case 'important': return 'border-l-amber-500'
      default: return 'border-l-blue-500'
    }
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            New Announcement
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Create Announcement</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content (use Shift+Enter for new lines)</Label>
              <Textarea id="content" name="content" required className="min-h-24" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="info">Info</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts</Label>
                <Input id="starts_at" name="starts_at" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends (optional)</Label>
                <Input id="ends_at" name="ends_at" type="datetime-local" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-2">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={cn(
                'flex items-start gap-3 p-4 border border-border rounded-lg bg-card border-l-4',
                priorityBorder(ann.priority),
                !ann.is_active && 'opacity-50'
              )}
            >
              {priorityIcon(ann.priority)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ann.title}</span>
                  {!ann.is_active && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line mt-0.5">{ann.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ann.starts_at).toLocaleDateString()}
                  {ann.ends_at && ` to ${new Date(ann.ends_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleToggleActive(ann)}
                  title={ann.is_active ? 'Deactivate' : 'Activate'}
                >
                  {ann.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(ann)}
                  className="text-destructive"
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
