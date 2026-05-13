import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'

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

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Books', href: '/' }, { label: book.title }]} />

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
                    <CardTitle className="text-base">{chapter.title}</CardTitle>
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
