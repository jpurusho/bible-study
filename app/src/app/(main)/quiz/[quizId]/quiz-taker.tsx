'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface QuizTakerProps {
  quiz: { id: string; title: string; description: string | null }
  questions: Array<{
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'true_false' | 'fill_blank'
    options: string[] | null
    correct_answer: string
    display_order: number
  }>
  userId: string
}

interface QuizResult {
  score: number
  total: number
  answers: Record<string, { given: string; correct: string; isCorrect: boolean }>
}

export function QuizTaker({ quiz, questions, userId }: QuizTakerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    const unanswered = questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions. ${unanswered.length} remaining.`)
      return
    }

    setSubmitting(true)

    try {
      let score = 0
      const detailedAnswers: QuizResult['answers'] = {}

      for (const question of questions) {
        const given = answers[question.id]?.trim() ?? ''
        const correct = question.correct_answer.trim()
        const isCorrect =
          question.question_type === 'fill_blank'
            ? given.toLowerCase() === correct.toLowerCase()
            : given === correct

        if (isCorrect) score++

        detailedAnswers[question.id] = { given, correct, isCorrect }
      }

      const total = questions.length
      const supabase = createClient()

      const { error } = await supabase.from('quiz_attempts').insert({
        quiz_id: quiz.id,
        user_id: userId,
        answers: answers,
        score,
        total,
        completed_at: new Date().toISOString(),
      })

      if (error) {
        toast.error('Failed to save quiz attempt.')
        console.error(error)
        return
      }

      setResult({ score, total, answers: detailedAnswers })
      toast.success(`Quiz completed! You scored ${score}/${total}.`)
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setAnswers({})
    setResult(null)
  }

  if (result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Quiz Results: {result.score}/{result.total}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You answered {result.score} out of {result.total} questions correctly.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const detail = result.answers[question.id]
            return (
              <Card
                key={question.id}
                className={cn(
                  'border-l-4',
                  detail?.isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {detail?.isCorrect ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <div className="space-y-2">
                      <p className="font-medium">
                        {index + 1}. {question.question_text}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Your answer: {detail?.given || '(no answer)'}
                      </p>
                      {!detail?.isCorrect && (
                        <p className="text-sm font-medium text-green-700">
                          Correct answer: {detail?.correct}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleRetake} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="mt-2 text-muted-foreground">{quiz.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}. {question.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {question.question_type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                        answers[question.id] === option && 'border-primary bg-primary/5'
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === 'true_false' && (
                <div className="space-y-2">
                  {['True', 'False'].map((option) => (
                    <label
                      key={option}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                        answers[question.id] === option && 'border-primary bg-primary/5'
                      )}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="h-4 w-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === 'fill_blank' && (
                <Input
                  placeholder="Type your answer..."
                  value={answers[question.id] ?? ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  )
}
