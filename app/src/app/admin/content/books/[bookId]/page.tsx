import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChaptersManager } from './chapters/chapters-manager'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const { bookId } = await params
  const supabase = await createClient()

  const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single()
  if (!book) notFound()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/content/books">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{book.title}</h1>
          <p className="text-muted-foreground">Manage chapters for this book.</p>
        </div>
      </div>
      <ChaptersManager bookId={bookId} initialChapters={chapters ?? []} />
    </div>
  )
}
