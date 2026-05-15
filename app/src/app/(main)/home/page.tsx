import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'

interface ReadingProgressRow {
  session_id: string
  last_read_at: string
  sessions: {
    id: string
    title: string
    session_number: number
    scripture_reference: string | null
    chapters: {
      id: string
      chapter_number: number
      title: string
      books: {
        slug: string
        title: string
      }
    }
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  // Fetch the user's most recent reading progress
  let recentProgress: ReadingProgressRow | null = null
  if (user) {
    const { data } = await supabase
      .from('reading_progress')
      .select('session_id, last_read_at, sessions(id, title, session_number, scripture_reference, chapters(id, chapter_number, title, books(slug, title)))')
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false })
      .limit(1)
      .single() as unknown as { data: ReadingProgressRow | null }

    recentProgress = data
  }

  return (
    <div className="space-y-10 py-4">
      {/* Hero section */}
      <section className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          Weekly Bible Study
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Welcome to CCI San Ramon Bible Study
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Access your weekly study materials, take personal notes, participate in discussions, and grow together.
        </p>
      </section>

      {/* Continue Reading section */}
      {recentProgress && (
        <section className="max-w-2xl mx-auto">
          <Link
            href={`/books/${recentProgress.sessions.chapters.books.slug}/${recentProgress.sessions.chapters.id}/${recentProgress.sessions.id}`}
            className="block"
          >
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                    Continue Reading
                  </p>
                  <CardTitle className="text-lg">
                    {recentProgress.sessions.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {recentProgress.sessions.chapters.books.title} &rsaquo; {recentProgress.sessions.chapters.title}
                    {recentProgress.sessions.scripture_reference && (
                      <span className="ml-2 text-primary/70">
                        &mdash; {recentProgress.sessions.scripture_reference}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-primary" />
              </CardHeader>
            </Card>
          </Link>
        </section>
      )}

      {/* Books section */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-center text-muted-foreground uppercase tracking-wider">
          Current Studies
        </h2>

        {books && books.length > 0 ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`} className="block">
                <Card className="group hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4 p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <BookOpen className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {book.title}
                      </CardTitle>
                      {book.description && (
                        <CardDescription className="mt-1 text-sm">
                          {book.description}
                        </CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No study materials available yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon — new content is added weekly.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
