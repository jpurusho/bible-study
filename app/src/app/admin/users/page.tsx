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
      <UserManagement initialUsers={users ?? []} />
    </div>
  )
}
