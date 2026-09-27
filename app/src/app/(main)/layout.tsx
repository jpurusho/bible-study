import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/app-header'
import { AnnouncementsBanner } from '@/components/announcements-banner'
import { BackToTop } from '@/components/back-to-top'
import { BottomNav } from '@/components/bottom-nav'
import { AppFooter } from '@/components/app-footer'
import { ThemeLoader } from '@/components/theme-loader'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null

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
