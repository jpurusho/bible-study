import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContentRenderer } from '@/components/content-renderer'
import { MediaPlayer } from '@/components/media-player'
import { TableOfContents } from '@/components/table-of-contents'
import { SessionNavigation } from '@/components/session-navigation'
import { UserNotes } from '@/components/user-notes'
import { BookmarkButton } from '@/components/bookmark-button'
import { DiscussionThread } from '@/components/discussion-thread'
import { HighlightToolbar } from '@/components/highlight-toolbar'
import { ScriptureExpander } from '@/components/scripture-expander'
import { ReadingTracker } from '@/components/reading-tracker'

export default async function SessionPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string; sessionId: string }>
}) {
  const { slug, chapterId, sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let userRole: 'user' | 'admin' = 'user'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile) userRole = profile.role as 'user' | 'admin'
  }

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!book) notFound()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('is_published', true)
    .single()

  if (!chapter) notFound()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('is_published', true)
    .single()

  if (!session) notFound()

  const { data: media } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })

  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id, title, session_number')
    .eq('chapter_id', chapterId)
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  const currentIndex = allSessions?.findIndex((s) => s.id === sessionId) ?? -1
  const prevSession = currentIndex > 0 ? allSessions![currentIndex - 1] : null
  const nextSession = currentIndex < (allSessions?.length ?? 0) - 1 ? allSessions![currentIndex + 1] : null

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Books', href: '/home' },
          { label: book.title, href: `/books/${slug}` },
          { label: `Ch. ${chapter.chapter_number}`, href: `/books/${slug}/${chapterId}` },
          { label: session.title },
        ]}
      />

      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{session.title}</h1>
          {user && <BookmarkButton sessionId={sessionId} userId={user.id} />}
        </div>
        {session.scripture_reference && (
          <div className="space-y-1">
            <ScriptureExpander reference={session.scripture_reference} />
          </div>
        )}
      </header>

      {media && media.length > 0 && (
        <section className="space-y-4">
          {media.map((item) => (
            <MediaPlayer key={item.id} media={item} />
          ))}
        </section>
      )}

      <div className="flex gap-8">
        <article className="flex-1 min-w-0" data-content-container>
          {session.content ? (
            <ContentRenderer html={session.content} />
          ) : (
            <p className="text-muted-foreground italic">No content yet.</p>
          )}
        </article>

        {session.content && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20">
              <TableOfContents html={session.content} />
            </div>
          </aside>
        )}
      </div>

      {user && <ReadingTracker sessionId={sessionId} userId={user.id} />}
      {user && <HighlightToolbar sessionId={sessionId} userId={user.id} />}
      {user && <UserNotes sessionId={sessionId} userId={user.id} />}

      {user && (
        <DiscussionThread sessionId={sessionId} userId={user.id} userRole={userRole} />
      )}

      <SessionNavigation
        baseUrl={`/books/${slug}/${chapterId}`}
        prevSession={prevSession}
        nextSession={nextSession}
      />
    </div>
  )
}
