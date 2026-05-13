import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SessionsManager } from './sessions-manager'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AdminChapterDetailPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>
}) {
  const { bookId, chapterId } = await params
  const supabase = await createClient()

  const { data: chapter } = await supabase
    .from('chapters')
    .select('*, books(*)')
    .eq('id', chapterId)
    .single()
  if (!chapter) notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/content/books/${bookId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">
            {(chapter as unknown as { books: { title: string } }).books?.title} &gt; Chapter {chapter.chapter_number}
          </p>
          <h1 className="text-2xl font-bold">{chapter.title}</h1>
        </div>
      </div>
      <SessionsManager chapterId={chapterId} bookId={bookId} initialSessions={sessions ?? []} />
    </div>
  )
}
