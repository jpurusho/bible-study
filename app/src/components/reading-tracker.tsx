'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ReadingTracker({
  sessionId,
  userId,
}: {
  sessionId: string
  userId: string
}) {
  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('reading_progress')
      .upsert(
        { user_id: userId, session_id: sessionId, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,session_id' }
      )
      .then() // fire and forget

  }, [sessionId, userId])

  return null
}
