'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Priority = 'info' | 'important' | 'urgent'

interface Announcement {
  id: string
  title: string
  content: string
  priority: Priority
  starts_at: string
  ends_at: string | null
  is_active: boolean
  created_at: string
}

interface AnnouncementsBannerProps {
  userId: string
}

const priorityStyles: Record<Priority, { border: string; bg: string; icon: string }> = {
  info: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-500',
  },
  important: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-500',
  },
  urgent: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'text-red-500',
  },
}

const priorityIcons: Record<Priority, typeof Info> = {
  info: Info,
  important: AlertTriangle,
  urgent: AlertCircle,
}

export function AnnouncementsBanner({ userId }: AnnouncementsBannerProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissing, setDismissing] = useState(false)
  const [visible, setVisible] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    const supabase = createClient()
    const now = new Date().toISOString()

    // Fetch active announcements
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('created_at', { ascending: false })

    if (!announcements || announcements.length === 0) return

    // Fetch user's dismissals
    const { data: dismissals } = await supabase
      .from('announcement_dismissals')
      .select('announcement_id')
      .eq('user_id', userId)

    const dismissedIds = new Set(
      (dismissals || []).map((d) => d.announcement_id)
    )

    // Find first undismissed announcement
    const undismissed = announcements.find((a) => !dismissedIds.has(a.id))

    if (undismissed) {
      setAnnouncement(undismissed)
      // Trigger animation in
      requestAnimationFrame(() => setVisible(true))
    }
  }, [userId])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleDismiss = async () => {
    if (!announcement) return

    setDismissing(true)
    setVisible(false)

    // Wait for animation out
    await new Promise((resolve) => setTimeout(resolve, 300))

    const supabase = createClient()
    await supabase.from('announcement_dismissals').insert({
      announcement_id: announcement.id,
      user_id: userId,
    })

    setAnnouncement(null)
    setDismissing(false)
  }

  if (!announcement) return null

  const styles = priorityStyles[announcement.priority]
  const Icon = priorityIcons[announcement.priority]

  return (
    <div
      className={cn(
        'relative rounded-lg border-l-4 p-4 pr-12 shadow-sm transition-all duration-300',
        styles.border,
        styles.bg,
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles.icon)} />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground">{announcement.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {announcement.content}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        onClick={handleDismiss}
        disabled={dismissing}
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
