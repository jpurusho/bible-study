import { createClient } from '@/lib/supabase/server'
import { PreapprovedManager } from './preapproved-manager'

export default async function PreapprovedPage() {
  const supabase = await createClient()
  const { data: emails } = await supabase
    .from('preapproved_emails')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pre-Approved Emails</h1>
        <p className="text-muted-foreground">
          Users with these emails will be automatically approved on first sign-in.
        </p>
      </div>
      <PreapprovedManager initialEmails={emails ?? []} />
    </div>
  )
}
