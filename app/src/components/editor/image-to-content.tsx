'use client'

import { useState, useRef } from 'react'
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
import { ImageIcon, Upload, Loader2, Trash2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface ImageToContentProps {
  sessionTitle: string
  bookContext?: string
  onGenerated: (html: string) => void
}

export function ImageToContent({ sessionTitle, bookContext, onGenerated }: ImageToContentProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const valid = selected.filter((f) =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)
    )
    if (valid.length !== selected.length) {
      toast.error('Only JPEG and PNG images are supported')
    }
    setFiles((prev) => [...prev, ...valid])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleGenerate() {
    if (files.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    const supabase = createClient()
    setUploading(true)
    setProgress('Uploading images...')

    const uploadedPaths: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading image ${i + 1} of ${files.length}...`)
        const file = files[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${Date.now()}_${i}.${ext}`

        const { error } = await supabase.storage
          .from('temp-uploads')
          .upload(path, file)

        if (error) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
          // Clean up any already uploaded
          if (uploadedPaths.length > 0) {
            await supabase.storage.from('temp-uploads').remove(uploadedPaths)
          }
          setUploading(false)
          setProgress('')
          return
        }
        uploadedPaths.push(path)
      }

      setUploading(false)
      setGenerating(true)
      setProgress('Generating study notes with AI... This may take 30-60 seconds.')

      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: uploadedPaths,
          sessionTitle,
          bookContext: bookContext || 'Acts of the Apostles Bible study',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Generation failed')
        setGenerating(false)
        setProgress('')
        return
      }

      onGenerated(data.html)
      toast.success(`Content generated! (${data.tokensUsed.input + data.tokensUsed.output} tokens used)`)
      setFiles([])
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
      setGenerating(false)
      setProgress('')
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Generate from Images
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Study Notes from Images</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload photos of book pages (JPEG/PNG). AI will transcribe and format them into study notes matching the app style.
            </p>

            <div className="space-y-2">
              <Label>Select Images</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to select or drag images here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG (up to 20 pages)
                </p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Selected ({files.length} pages)</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                      <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)}KB</span>
                      <button onClick={() => removeFile(i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {progress && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="size-4 animate-spin" />
                {progress}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading || generating}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={files.length === 0 || uploading || generating}>
                <Sparkles className="size-4" />
                {generating ? 'Generating...' : 'Generate Notes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
