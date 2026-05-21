import { BookOpen } from 'lucide-react'
import { DAILY_VERSES } from '@/data/daily-verses'

function getVerseForToday(): { text: string; ref: string } {
  const start = new Date(2025, 0, 1).getTime()
  const now = new Date().getTime()
  const dayIndex = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return DAILY_VERSES[dayIndex % DAILY_VERSES.length]
}

export function VerseOfTheDay() {
  const verse = getVerseForToday()

  return (
    <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-0.5">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">Verse of the Day</p>
          <p className="text-base sm:text-lg leading-7 text-foreground/85 italic">
            &ldquo;{verse.text}&rdquo;
          </p>
          <p className="text-sm font-medium text-primary/70">{verse.ref} (ESV)</p>
        </div>
      </div>
    </div>
  )
}
