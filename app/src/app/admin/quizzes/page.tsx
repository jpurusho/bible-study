import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { QuizBuilder } from './quiz-builder'

export default async function AdminQuizzesPage() {
  const supabase = await createClient()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*, sessions(title), chapters(title)')
    .order('created_at', { ascending: false })

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, chapter_id, chapters(title)')
    .order('title')

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, book_id, books(title)')
    .order('title')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Create and manage quizzes for sessions and chapters.</p>
        </div>
      </div>

      <QuizBuilder
        sessions={sessions ?? []}
        chapters={chapters ?? []}
      />

      {!quizzes || quizzes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No quizzes yet. Create your first quiz above.
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/admin/quizzes/${quiz.id}`}
              className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{quiz.title}</span>
                  {!quiz.is_published && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Draft</span>
                  )}
                </div>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {quiz.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {quiz.session_id && (quiz as unknown as { sessions: { title: string } | null }).sessions?.title && (
                    <span>Session: {(quiz as unknown as { sessions: { title: string } }).sessions.title}</span>
                  )}
                  {quiz.chapter_id && (quiz as unknown as { chapters: { title: string } | null }).chapters?.title && (
                    <span>Chapter: {(quiz as unknown as { chapters: { title: string } }).chapters.title}</span>
                  )}
                  {!quiz.session_id && !quiz.chapter_id && (
                    <span>No linked content</span>
                  )}
                  <span className="ml-3">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div className="shrink-0">
                {quiz.is_published ? (
                  <Eye className="size-4 text-green-500" />
                ) : (
                  <EyeOff className="size-4 text-muted-foreground" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
