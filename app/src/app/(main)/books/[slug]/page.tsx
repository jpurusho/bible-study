import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { NewBadge } from '@/components/new-badge'

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!book) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', book.id)
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  // Fetch sessions to determine which chapters have recently published content
  const chapterIds = chapters?.map((c) => c.id) ?? []
  const { data: sessions } = await supabase
    .from('sessions')
    .select('chapter_id, published_at')
    .in('chapter_id', chapterIds.length > 0 ? chapterIds : [''])
    .eq('is_published', true)

  // Build a map of chapter_id -> most recent published_at
  const chapterLatestPublished = new Map<string, string | null>()
  for (const s of sessions ?? []) {
    const current = chapterLatestPublished.get(s.chapter_id)
    if (!current || (s.published_at && s.published_at > current)) {
      chapterLatestPublished.set(s.chapter_id, s.published_at)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Books', href: '/home' }, { label: book.title }]} />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
        {book.description && (
          <p className="text-muted-foreground mt-1">{book.description}</p>
        )}
      </div>

      {chapters && chapters.length > 0 ? (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Link key={chapter.id} href={`/books/${slug}/${chapter.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {chapter.chapter_number}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {chapter.title}
                      <NewBadge publishedAt={chapterLatestPublished.get(chapter.id) ?? null} />
                    </CardTitle>
                    {chapter.description && (
                      <CardDescription className="line-clamp-1">
                        {chapter.description}
                      </CardDescription>
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
          Chapters coming soon.
        </p>
      )}
    </div>
  )
}
