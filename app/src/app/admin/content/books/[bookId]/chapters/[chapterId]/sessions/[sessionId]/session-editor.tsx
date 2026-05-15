'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { TiptapEditor } from '@/components/editor/tiptap-editor'
import { Save, Plus, Trash2, Video, Music, Image as ImageIcon, FileText, Code, Eye, EyeOff, Megaphone, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { markdownToHtml } from '@/lib/markdown-to-html'
import type { Database } from '@/types/database'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionMedia = Database['public']['Tables']['session_media']['Row']

interface SessionEditorProps {
  session: Session
  initialMedia: SessionMedia[]
}

export function SessionEditor({ session, initialMedia }: SessionEditorProps) {
  const [content, setContent] = useState(session.content ?? '')
  const [media, setMedia] = useState(initialMedia)
  const [saving, setSaving] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const [isPublished, setIsPublished] = useState(session.is_published)
  const [publishing, setPublishing] = useState(false)
  const [markdownDialogOpen, setMarkdownDialogOpen] = useState(false)
  const [markdownInput, setMarkdownInput] = useState('')
  const supabase = createClient()

  const handleSaveContent = useCallback(async () => {
    setSaving(true)
    const { error } = await supabase
      .from('sessions')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', session.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Content saved')
    }
    setSaving(false)
  }, [content, session.id, supabase])

  const handleTogglePublish = useCallback(async () => {
    const newState = !isPublished
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('sessions')
      .update({
        is_published: newState,
        published_at: newState ? now : null,
        updated_at: now,
      })
      .eq('id', session.id)

    if (error) {
      toast.error(error.message)
    } else {
      setIsPublished(newState)
      toast.success(newState ? 'Session published' : 'Session unpublished')
    }
  }, [isPublished, session.id, supabase])

  const handlePublishAndAnnounce = useCallback(async () => {
    setPublishing(true)
    const now = new Date().toISOString()

    // Update session to published
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ is_published: true, published_at: now, updated_at: now })
      .eq('id', session.id)

    if (updateError) {
      toast.error(updateError.message)
      setPublishing(false)
      return
    }

    // Create announcement
    const announcementContent = session.scripture_reference || 'New study session available'
    const { error: announceError } = await supabase
      .from('announcements')
      .insert({
        title: `New: ${session.title}`,
        content: announcementContent,
        priority: 'info' as const,
        starts_at: now,
        is_active: true,
      })

    if (announceError) {
      toast.error(`Published but announcement failed: ${announceError.message}`)
    } else {
      setIsPublished(true)
      toast.success('Published and announcement created!')
    }
    setPublishing(false)
  }, [session.id, session.title, session.scripture_reference, supabase])

  const handleImportMarkdown = useCallback(() => {
    if (!markdownInput.trim()) {
      toast.error('Please paste some Markdown content')
      return
    }
    const confirmed = content.trim()
      ? window.confirm('This will replace the current content. Continue?')
      : true
    if (!confirmed) return

    const html = markdownToHtml(markdownInput)
    setContent(html)
    setMarkdownInput('')
    setMarkdownDialogOpen(false)
    toast.success('Markdown imported successfully')
  }, [markdownInput, content])

  async function handleAddMedia(formData: FormData) {
    const type = formData.get('type') as SessionMedia['type']
    const title = formData.get('media_title') as string
    const url = formData.get('url') as string

    if (!url || !type) {
      toast.error('URL and type are required')
      return
    }

    const maxOrder = media.length > 0 ? Math.max(...media.map((m) => m.display_order)) : 0
    const { data, error } = await supabase
      .from('session_media')
      .insert({
        session_id: session.id,
        type,
        title: title || null,
        url,
        display_order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      return
    }
    if (data) setMedia([...media, data])
    toast.success('Media added')
  }

  async function handleDeleteMedia(id: string) {
    const { error } = await supabase.from('session_media').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setMedia(media.filter((m) => m.id !== id))
    toast.success('Media removed')
  }

  const mediaIcon = (type: SessionMedia['type']) => {
    switch (type) {
      case 'video': return <Video className="size-4" />
      case 'audio': return <Music className="size-4" />
      case 'image': return <ImageIcon className="size-4" />
      case 'slides': return <FileText className="size-4" />
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Study Notes</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMarkdownDialogOpen(true)}>
              <Upload className="size-4" />
              Import Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSource(!showSource)}>
              <Code className="size-4" />
              {showSource ? 'Visual' : 'Source'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleTogglePublish}>
              {isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {isPublished ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePublishAndAnnounce}
              disabled={publishing}
            >
              <Megaphone className="size-4" />
              {publishing ? 'Publishing...' : 'Publish & Announce'}
            </Button>
            <Button onClick={handleSaveContent} disabled={saving}>
              <Save className="size-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
        {showSource ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[400px] p-4 font-mono text-sm border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        ) : (
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your study notes here..."
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Media</h2>

        {media.length > 0 && (
          <div className="space-y-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 border border-border rounded-lg bg-card"
              >
                {mediaIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.title || item.type}</span>
                  <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                </div>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">
                  {item.type}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDeleteMedia(item.id)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form action={handleAddMedia} className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">Add Media</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm"
                required
              >
                <option value="video">Video (Google Drive)</option>
                <option value="audio">Audio (Google Drive)</option>
                <option value="image">Image</option>
                <option value="slides">Slides (PDF)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="media_title">Title</Label>
              <Input id="media_title" name="media_title" placeholder="Optional title" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" placeholder="https://..." required />
            </div>
          </div>
          <Button type="submit" variant="outline" size="sm">
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </section>

      <Dialog open={markdownDialogOpen} onOpenChange={setMarkdownDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Markdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste your Markdown content below. It will be converted to HTML and replace the current editor content.
            </p>
            <Textarea
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="# Heading&#10;&#10;Your markdown here..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkdownDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportMarkdown}>
              <FileText className="size-4" />
              Convert &amp; Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
