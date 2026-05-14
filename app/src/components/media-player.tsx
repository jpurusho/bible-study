import type { Database } from '@/types/database'
import { Video, Music, FileText, Image as ImageIcon, ExternalLink, Play } from 'lucide-react'

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
      const driveLink = `https://drive.google.com/file/d/${driveId}/view`
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w640`
      return (
        <div className="space-y-2">
          {media.title && (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Video className="size-4" />
              {media.title}
            </div>
          )}
          {/* Mobile: thumbnail + play link */}
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block sm:hidden relative w-full rounded-xl overflow-hidden border border-border bg-muted aspect-video"
          >
            <img
              src={thumbnailUrl}
              alt={media.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex items-center gap-2 bg-white/90 text-black rounded-full px-4 py-2 text-sm font-medium shadow-lg">
                <Play className="size-4 fill-current" />
                Play Video
              </div>
            </div>
          </a>
          {/* Desktop: embedded player */}
          <div className="hidden sm:block relative w-full rounded-xl overflow-hidden border border-border bg-muted aspect-video">
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview`}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
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
        <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted aspect-[4/3] sm:aspect-video">
          <iframe
            src={media.url}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
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
      const driveLink = `https://drive.google.com/file/d/${driveId}/view`
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {media.title && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Music className="size-4" />
                {media.title}
              </div>
            )}
            <a
              href={driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open in Drive
              <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border border-border bg-muted h-24">
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
