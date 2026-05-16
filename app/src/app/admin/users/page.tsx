import { createClient } from '@/lib/supabase/server'
import { UserManagement } from './user-management'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Approve, revoke, or promote users.</p>
      </div>
      <div className="text-xs text-muted-foreground border border-border rounded-lg p-3 bg-muted/30 space-y-1">
        <p><strong>Approve/Revoke:</strong> Controls whether a user can access study content</p>
        <p><strong>Shield icon (outlined):</strong> Tap to make this user an Admin (can manage content, users, announcements)</p>
        <p><strong>Shield icon (filled/colored):</strong> This user is currently an Admin. Tap to remove admin privileges</p>
      </div>
      <UserManagement initialUsers={users ?? []} />
    </div>
  )
}
