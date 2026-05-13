'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  sessionId: string
  userId: string
}

export function BookmarkButton({ sessionId, userId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .maybeSingle()

      setIsBookmarked(!!data)
      setLoading(false)
    }
    check()
  }, [sessionId, userId, supabase])

  async function toggle() {
    if (isBookmarked) {
      const { error } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) {
        toast.error('Failed to remove bookmark')
        return
      }
      setIsBookmarked(false)
    } else {
      const { error } = await supabase
        .from('user_bookmarks')
        .insert({ session_id: sessionId, user_id: userId })

      if (error) {
        toast.error('Failed to add bookmark')
        return
      }
      setIsBookmarked(true)
    }
  }

  if (loading) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn(
        'gap-1.5',
        isBookmarked && 'text-primary'
      )}
    >
      <Bookmark className={cn('size-4', isBookmarked && 'fill-current')} />
      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
    </Button>
  )
}
