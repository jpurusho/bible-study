'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Menu,
  Home,
  StickyNote,
  Bookmark,
  Search,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'

interface MobileNavProps {
  isAdmin: boolean
  displayName: string | null
  email: string
}

export function MobileNav({ isAdmin, displayName, email }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
  }

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/notes', label: 'Notes', icon: StickyNote },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          <div className="mt-auto px-4 pb-4">
            <Separator className="mb-4" />
            <div className="flex flex-col gap-1 mb-3">
              {displayName && (
                <p className="text-sm font-medium">{displayName}</p>
              )}
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
