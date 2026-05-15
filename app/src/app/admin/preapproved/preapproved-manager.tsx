'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface PreapprovedEmail {
  id: string
  email: string
  created_at: string
}

export function PreapprovedManager({ initialEmails }: { initialEmails: PreapprovedEmail[] }) {
  const [emails, setEmails] = useState(initialEmails)
  const [newEmail, setNewEmail] = useState('')
  const supabase = createClient()

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    if (emails.some((e) => e.email === email)) {
      toast.error('Email already in the list')
      return
    }

    const { data, error } = await supabase
      .from('preapproved_emails')
      .insert({ email })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
      return
    }

    if (data) setEmails([data, ...emails])
    setNewEmail('')
    toast.success(`${email} added to pre-approved list`)
  }

  async function handleRemove(id: string, email: string) {
    const { error } = await supabase.from('preapproved_emails').delete().eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    setEmails(emails.filter((e) => e.id !== id))
    toast.success(`${email} removed`)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {emails.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          No pre-approved emails yet. Add emails above.
        </p>
      ) : (
        <div className="space-y-2">
          {emails.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
            >
              <Mail className="size-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{item.email}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemove(item.id, item.email)}
                className="text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
