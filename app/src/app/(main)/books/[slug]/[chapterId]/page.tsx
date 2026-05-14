import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapterId: string }>
}) {
  const { slug, chapterId } = await params
  const supabase = await createClient()

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

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Books', href: '/home' },
          { label: book.title, href: `/books/${slug}` },
          { label: `Chapter ${chapter.chapter_number}: ${chapter.title}` },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{chapter.title}</h1>
        {chapter.description && (
          <p className="text-muted-foreground mt-1">{chapter.description}</p>
        )}
      </div>

      {sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/books/${slug}/${chapterId}/${session.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {session.session_number}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{session.title}</CardTitle>
                    {session.scripture_reference && (
                      <CardDescription>{session.scripture_reference}</CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-12">
          Sessions coming soon.
        </p>
      )}
    </div>
  )
}
