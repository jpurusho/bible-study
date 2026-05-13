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
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnnouncementsBanner userId={user.id} />
        <main>
          {children}
        </main>
      </div>
      <AppFooter />
      <BackToTop />
    </div>
  )
}
