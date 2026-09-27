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

  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub ? String(claimsData.claims.sub) : null

  if (!userId) {
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

  const { data: questions } = await supabase.rpc('get_published_quiz_questions', {
    target_quiz_id: quizId,
  })

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
        questions={questions.map(q => ({
          ...q,
          question_type: q.question_type as 'multiple_choice' | 'true_false' | 'fill_blank',
          options: q.options as string[] | null,
        }))}
      />
    </div>
  )
}
