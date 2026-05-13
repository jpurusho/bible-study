import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AnnouncementsBanner } from '@/components/announcements-banner'
import { BackToTop } from '@/components/back-to-top'
import { AppFooter } from '@/components/app-footer'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.is_approved) {
    redirect('/pending')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader profile={profile} />
      <AnnouncementsBanner userId={user.id} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
      <AppFooter />
      <BackToTop />
    </div>
  )
}
