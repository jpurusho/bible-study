import Link from 'next/link'
import Image from 'next/image'
import { Settings, Shield, Search, Home, Bookmark, StickyNote } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export function AppHeader({ profile }: { profile: Profile }) {
  const initials = profile.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : profile.email[0].toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="w-full max-w-4xl mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
        <Link href="/home" prefetch={false} className="flex items-center gap-2 font-semibold text-primary shrink-0">
          <Image src="/icons/logo.png" alt="" width={28} height={28} className="rounded-full shrink-0" priority />
          <span className="hidden md:inline text-sm">CCISR Bible Study</span>
        </Link>

        <nav className="ml-4 sm:ml-6 flex items-center gap-3 sm:gap-4 text-sm">
          <Link href="/home" prefetch={false} className="text-muted-foreground hover:text-foreground transition-colors" title="Home">
            <Home className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link href="/notes" prefetch={false} className="text-muted-foreground hover:text-foreground transition-colors" title="Notes">
            <StickyNote className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Notes</span>
          </Link>
          <Link href="/bookmarks" prefetch={false} className="text-muted-foreground hover:text-foreground transition-colors" title="Bookmarks">
            <Bookmark className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Bookmarks</span>
          </Link>
          <Link href="/search" prefetch={false} className="text-muted-foreground hover:text-foreground transition-colors" title="Search" aria-label="Search">
            <Search className="h-4 w-4" />
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {profile.role === 'admin' && (
            <Link href="/admin" prefetch={false} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <Link href="/settings" prefetch={false} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
          <SignOutButton />
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
