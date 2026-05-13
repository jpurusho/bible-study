import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SessionEditor } from './session-editor'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function AdminSessionEditorPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string; sessionId: string }>
}) {
  const { bookId, chapterId, sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  if (!session) notFound()

  const { data: media } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', sessionId)
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/content/books/${bookId}/chapters/${chapterId}`}>
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">
            Session #{session.session_number}
            {session.scripture_reference && ` — ${session.scripture_reference}`}
          </p>
          <h1 className="text-2xl font-bold">{session.title}</h1>
        </div>
      </div>
      <SessionEditor session={session} initialMedia={media ?? []} />
    </div>
  )
}
