'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Check, X, Shield, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function UserManagement({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState(initialUsers)

  async function updateUser(userId: string, updates: Partial<Profile>) {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update user')
      return
    }

    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, ...updates } as Profile : u)
    )
    toast.success('User updated')
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="flex items-center gap-4 py-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>
                {user.display_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.display_name ?? 'No name'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <Badge variant="secondary">Admin</Badge>
              )}
              <Badge variant={user.is_approved ? 'default' : 'destructive'}>
                {user.is_approved ? 'Approved' : 'Pending'}
              </Badge>
            </div>

            <div className="flex items-center gap-1">
              {!user.is_approved ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateUser(user.id, { is_approved: true })}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateUser(user.id, { is_approved: false })}
                >
                  <X className="h-4 w-4 mr-1" />
                  Revoke
                </Button>
              )}

              {user.role !== 'admin' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateUser(user.id, { role: 'admin' })}
                  title="Promote to admin"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateUser(user.id, { role: 'user' })}
                  title="Demote to user"
                >
                  <ShieldOff className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No users registered yet.
        </p>
      )}
    </div>
  )
}
