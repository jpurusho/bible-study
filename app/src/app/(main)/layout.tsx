import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AnnouncementsBanner } from '@/components/announcements-banner'
import { BackToTop } from '@/components/back-to-top'
import { BottomNav } from '@/components/bottom-nav'
import { AppFooter } from '@/components/app-footer'
import { ThemeLoader } from '@/components/theme-loader'
import { Suspense } from 'react'
import { PwaReturnBanner } from '@/components/pwa-return-banner'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  // getUser() is authoritative — middleware already refreshed the token so this
  // reads the valid session that was just written to cookies.
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  if (!userId) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) throw new Error('Profile lookup unavailable')

  if (!profile?.is_approved) {
    redirect('/pending')
  }

  const themePrefs = profile.theme as { mode?: string; fontSize?: string } | null

  return (
    <div className="min-h-screen flex flex-col">
      <ThemeLoader
        savedTheme={themePrefs?.mode ?? null}
        savedFontSize={themePrefs?.fontSize ?? null}
      />
      <Suspense><PwaReturnBanner /></Suspense>
      <AppHeader profile={profile} />
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16 sm:pb-0">
      <AnnouncementsBanner userId={userId} />
        <main>
          {children}
        </main>
      </div>
      <AppFooter />
      <BackToTop />
      <BottomNav />
    </div>
  )
}
