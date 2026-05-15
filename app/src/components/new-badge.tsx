import { cn } from '@/lib/utils'

export function NewBadge({ publishedAt }: { publishedAt: string | null }) {
  if (!publishedAt) return null

  const published = new Date(publishedAt)
  const now = new Date()
  const diffMs = now.getTime() - published.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays > 7) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground'
      )}
    >
      New
    </span>
  )
}
