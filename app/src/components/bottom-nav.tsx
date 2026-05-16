'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, StickyNote, Bookmark, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav data-slot="bottom-nav" className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/80 backdrop-blur-lg border-t">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('size-5', isActive && 'stroke-[2.5]')} />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
