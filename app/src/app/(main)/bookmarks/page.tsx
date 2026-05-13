import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Bookmark, ChevronRight } from 'lucide-react'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookmarks } = await supabase
    .from('user_bookmarks')
    .select('id, created_at, sessions(id, title, scripture_reference, session_number, chapters(id, chapter_number, title, books(slug, title)))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Bookmarks' }]} />
      <div>
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved sessions for quick access.</p>
      </div>

      {bookmarks && bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((bm) => {
            const session = bm.sessions as unknown as {
              id: string
              title: string
              scripture_reference: string | null
              session_number: number
              chapters: {
                id: string
                chapter_number: number
                title: string
                books: { slug: string; title: string }
              }
            }
            if (!session) return null
            const chapter = session.chapters
            const book = chapter.books

            return (
              <Link
                key={bm.id}
                href={`/books/${book.slug}/${chapter.id}/${session.id}`}
              >
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                  <CardHeader className="flex flex-row items-center gap-4 py-4">
                    <Bookmark className="size-5 text-primary fill-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <CardDescription>
                        {book.title} &gt; Ch. {chapter.chapter_number} &gt; Session {session.session_number}
                        {session.scripture_reference && ` — ${session.scripture_reference}`}
                      </CardDescription>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Bookmark className="size-12 mx-auto mb-4 opacity-30" />
          <p>No bookmarks yet. Bookmark a session to find it quickly later.</p>
        </div>
      )}
    </div>
  )
}
