import type { Database } from '@/types/database'
import { Video, Music, FileText, Image as ImageIcon } from 'lucide-react'

type SessionMedia = Database['public']['Tables']['session_media']['Row']

function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function MediaPlayer({ media }: { media: SessionMedia }) {
  if (media.type === 'video') {
    const driveId = extractGoogleDriveId(media.url)
    if (driveId) {
      return (
        <div className="space-y-2">
          {media.title && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Video className="size-4" />
              {media.title}
            </div>
          )}
          <div className="aspect-video rounded-xl overflow-hidden border border-border bg-muted">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={media.title || 'Video'}
            />
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {media.title && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Video className="size-4" />
            {media.title}
          </div>
        )}
        <div className="aspect-video rounded-xl overflow-hidden border border-border bg-muted">
          <iframe
            src={media.url}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={media.title || 'Video'}
          />
        </div>
      </div>
    )
  }

  if (media.type === 'audio') {
    const driveId = extractGoogleDriveId(media.url)
    const audioSrc = driveId
      ? `https://drive.google.com/file/d/${driveId}/preview`
      : media.url

    if (driveId) {
      return (
        <div className="space-y-2">
          {media.title && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Music className="size-4" />
              {media.title}
            </div>
          )}
          <div className="rounded-xl overflow-hidden border border-border bg-muted h-20">
            <iframe
              src={audioSrc}
              className="w-full h-full"
              allow="autoplay"
              title={media.title || 'Audio'}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {media.title && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Music className="size-4" />
            {media.title}
          </div>
        )}
        <audio controls className="w-full">
          <source src={media.url} />
        </audio>
      </div>
    )
  }

  if (media.type === 'image') {
    return (
      <div className="space-y-2">
        {media.title && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ImageIcon className="size-4" />
            {media.title}
          </div>
        )}
        <img
          src={media.url}
          alt={media.title || 'Session image'}
          className="rounded-xl border border-border max-w-full h-auto"
        />
      </div>
    )
  }

  if (media.type === 'slides') {
    return (
      <div className="space-y-2">
        {media.title && (
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileText className="size-4" />
            {media.title}
          </div>
        )}
        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
          <iframe
            src={media.url}
            className="w-full h-full"
            title={media.title || 'Slides'}
          />
        </div>
      </div>
    )
  }

  return null
}
