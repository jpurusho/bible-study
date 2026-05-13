import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { StickyNote, ChevronRight } from 'lucide-react'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notes } = await supabase
    .from('user_notes')
    .select('id, content, scope, created_at, updated_at, sessions(id, title, session_number, chapters(id, chapter_number, books(slug, title)))')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'My Notes' }]} />
      <div>
        <h1 className="text-2xl font-bold">My Notes</h1>
        <p className="text-muted-foreground">All your personal study notes in one place.</p>
      </div>

      {notes && notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => {
            const session = note.sessions as unknown as {
              id: string
              title: string
              session_number: number
              chapters: {
                id: string
                chapter_number: number
                books: { slug: string; title: string }
              }
            } | null

            const href = session
              ? `/books/${session.chapters.books.slug}/${session.chapters.id}/${session.id}`
              : '#'

            return (
              <Link key={note.id} href={href}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                  <CardHeader className="flex flex-row items-start gap-4 py-4">
                    <StickyNote className="size-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">
                        {session ? session.title : 'Global Note'}
                      </CardTitle>
                      {session && (
                        <CardDescription>
                          {session.chapters.books.title} &gt; Ch. {session.chapters.chapter_number} &gt; Session {session.session_number}
                        </CardDescription>
                      )}
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </p>
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
          <StickyNote className="size-12 mx-auto mb-4 opacity-30" />
          <p>No notes yet. Start taking notes on any session.</p>
        </div>
      )}
    </div>
  )
}
