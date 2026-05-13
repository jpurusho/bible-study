import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SessionNavProps {
  baseUrl: string
  prevSession: { id: string; title: string; session_number: number } | null
  nextSession: { id: string; title: string; session_number: number } | null
}

export function SessionNavigation({ baseUrl, prevSession, nextSession }: SessionNavProps) {
  if (!prevSession && !nextSession) return null

  return (
    <nav className="flex items-center justify-between border-t border-border pt-6 mt-8">
      {prevSession ? (
        <Link href={`${baseUrl}/${prevSession.id}`}>
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="size-4" />
            <span className="hidden sm:inline">Session {prevSession.session_number}:</span>
            <span className="truncate max-w-[150px]">{prevSession.title}</span>
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {nextSession ? (
        <Link href={`${baseUrl}/${nextSession.id}`}>
          <Button variant="ghost" className="gap-2">
            <span className="hidden sm:inline">Session {nextSession.session_number}:</span>
            <span className="truncate max-w-[150px]">{nextSession.title}</span>
            <ChevronRight className="size-4" />
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
