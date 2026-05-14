import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { QuizTaker } from './quiz-taker'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, title, description')
    .eq('id', quizId)
    .eq('is_published', true)
    .single()

  if (!quiz) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_text, question_type, options, correct_answer, display_order')
    .eq('quiz_id', quizId)
    .order('display_order', { ascending: true })

  if (!questions || questions.length === 0) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Quizzes', href: '/quiz' },
          { label: quiz.title },
        ]}
      />
      <QuizTaker
        quiz={quiz}
        questions={questions.map(q => ({ ...q, options: q.options as string[] | null }))}
        userId={user.id}
      />
    </div>
  )
}
