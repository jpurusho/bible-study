import { createClient } from '@/lib/supabase/server'
import { AnnouncementsManager } from './announcements-manager'

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">Create and manage announcements shown to users.</p>
      </div>
      <AnnouncementsManager initialAnnouncements={announcements ?? []} />
    </div>
  )
}
