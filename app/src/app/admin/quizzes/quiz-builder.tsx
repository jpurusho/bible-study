'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Quiz = Database['public']['Tables']['quizzes']['Row']
type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
type QuestionType = QuizQuestion['question_type']

interface QuestionDraft {
  id?: string
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: string
  display_order: number
}

interface Props {
  quiz?: Quiz & { questions: QuizQuestion[] }
  sessions: { id: string; title: string; chapter_id: string; chapters: { title: string } | null }[]
  chapters: { id: string; title: string; book_id: string; books: { title: string } | null }[]
}

export function QuizBuilder({ quiz, sessions, chapters }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState(quiz?.title ?? '')
  const [description, setDescription] = useState(quiz?.description ?? '')
  const [sessionId, setSessionId] = useState<string>(quiz?.session_id ?? '')
  const [chapterId, setChapterId] = useState<string>(quiz?.chapter_id ?? '')
  const [isPublished, setIsPublished] = useState(quiz?.is_published ?? false)
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    quiz?.questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: Array.isArray(q.options) ? (q.options as string[]) : ['', '', '', ''],
      correct_answer: q.correct_answer,
      display_order: q.display_order,
    })) ?? []
  )

  const isEditing = !!quiz

  function addQuestion(type: QuestionType) {
    const newQuestion: QuestionDraft = {
      question_text: '',
      question_type: type,
      options: type === 'multiple_choice' ? ['', '', '', ''] : [],
      correct_answer: type === 'true_false' ? 'true' : '',
      display_order: questions.length + 1,
    }
    setQuestions([...questions, newQuestion])
  }

  function removeQuestion(index: number) {
    const updated = questions.filter((_, i) => i !== index)
    setQuestions(updated.map((q, i) => ({ ...q, display_order: i + 1 })))
  }

  function updateQuestion(index: number, field: keyof QuestionDraft, value: any) {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const updated = [...questions]
    const opts = [...updated[questionIndex].options]
    opts[optionIndex] = value
    updated[questionIndex] = { ...updated[questionIndex], options: opts }
    setQuestions(updated)
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return
    const updated = [...questions]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    setQuestions(updated.map((q, i) => ({ ...q, display_order: i + 1 })))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Quiz title is required')
      return
    }
    if (questions.length === 0) {
      toast.error('Add at least one question')
      return
    }

    // Validate all questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question_text.trim()) {
        toast.error(`Question ${i + 1} needs text`)
        return
      }
      if (!q.correct_answer.trim()) {
        toast.error(`Question ${i + 1} needs a correct answer`)
        return
      }
      if (q.question_type === 'multiple_choice') {
        const filledOptions = q.options.filter((o) => o.trim())
        if (filledOptions.length < 2) {
          toast.error(`Question ${i + 1} needs at least 2 options`)
          return
        }
        if (!q.options.includes(q.correct_answer)) {
          toast.error(`Question ${i + 1}: correct answer must match one of the options`)
          return
        }
      }
    }

    setSaving(true)

    try {
      let quizId = quiz?.id

      if (isEditing && quizId) {
        // Update existing quiz
        const { error } = await supabase
          .from('quizzes')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            session_id: sessionId || null,
            chapter_id: chapterId || null,
            is_published: isPublished,
          })
          .eq('id', quizId)

        if (error) throw error

        // Delete existing questions and re-insert
        await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from('quizzes')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            session_id: sessionId || null,
            chapter_id: chapterId || null,
            is_published: isPublished,
          })
          .select()
          .single()

        if (error) throw error
        quizId = data.id
      }

      // Insert questions
      const questionInserts = questions.map((q) => ({
        quiz_id: quizId!,
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options.filter((o) => o.trim()) : null,
        correct_answer: q.correct_answer.trim(),
        display_order: q.display_order,
      }))

      const { error: qError } = await supabase
        .from('quiz_questions')
        .insert(questionInserts)

      if (qError) throw qError

      toast.success(isEditing ? 'Quiz updated' : 'Quiz created')
      setDialogOpen(false)
      resetForm()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish() {
    if (!quiz) return
    const { error } = await supabase
      .from('quizzes')
      .update({ is_published: !isPublished })
      .eq('id', quiz.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setIsPublished(!isPublished)
    toast.success(isPublished ? 'Quiz unpublished' : 'Quiz published')
    router.refresh()
  }

  function resetForm() {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setSessionId('')
      setChapterId('')
      setIsPublished(false)
      setQuestions([])
    }
  }

  function openDialog() {
    if (!isEditing) resetForm()
    setDialogOpen(true)
  }

  return (
    <>
      {!isEditing && (
        <div className="flex justify-end">
          <Button onClick={openDialog}>
            <Plus className="size-4" />
            New Quiz
          </Button>
        </div>
      )}

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleTogglePublish}>
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
          <Button onClick={openDialog}>
            Edit Quiz
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Quiz' : 'Create Quiz'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quiz metadata */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Title</Label>
                <Input
                  id="quiz-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Quiz title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiz-description">Description (optional)</Label>
                <Textarea
                  id="quiz-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="min-h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quiz-session">Link to Session</Label>
                  <select
                    id="quiz-session"
                    value={sessionId}
                    onChange={(e) => {
                      setSessionId(e.target.value)
                      if (e.target.value) setChapterId('')
                    }}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    <option value="">None</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.chapters?.title ? `${s.chapters.title} — ` : ''}{s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-chapter">Link to Chapter</Label>
                  <select
                    id="quiz-chapter"
                    value={chapterId}
                    onChange={(e) => {
                      setChapterId(e.target.value)
                      if (e.target.value) setSessionId('')
                    }}
                    className="w-full h-8 rounded-lg border border-border bg-background px-2 text-sm"
                  >
                    <option value="">None</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.books?.title ? `${c.books.title} — ` : ''}{c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Questions ({questions.length})</Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('multiple_choice')}
                  >
                    <Plus className="size-3" />
                    MC
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('true_false')}
                  >
                    <Plus className="size-3" />
                    T/F
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addQuestion('fill_blank')}
                  >
                    <Plus className="size-3" />
                    Fill
                  </Button>
                </div>
              </div>

              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No questions yet. Add one using the buttons above.
                </p>
              )}

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="border border-border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0">
                        {q.question_type === 'multiple_choice' && 'Multiple Choice'}
                        {q.question_type === 'true_false' && 'True/False'}
                        {q.question_type === 'fill_blank' && 'Fill in the Blank'}
                      </span>
                      <div className="flex-1" />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => moveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          <span className="text-xs">&#9650;</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => moveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          title="Move down"
                        >
                          <span className="text-xs">&#9660;</span>
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeQuestion(idx)}
                        className="text-destructive"
                        title="Remove question"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        value={q.question_text}
                        onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                        placeholder="Question text..."
                      />
                    </div>

                    {/* Multiple Choice Options */}
                    {q.question_type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          Options (select the correct one)
                        </Label>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correct_answer === opt && opt !== ''}
                              onChange={() => updateQuestion(idx, 'correct_answer', opt)}
                              className="shrink-0"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const oldVal = opt
                                updateOption(idx, optIdx, e.target.value)
                                // Update correct_answer if it was pointing to this option
                                if (q.correct_answer === oldVal && oldVal !== '') {
                                  updateQuestion(idx, 'correct_answer', e.target.value)
                                }
                              }}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {q.question_type === 'true_false' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Correct Answer</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`tf-${idx}`}
                              checked={q.correct_answer === 'true'}
                              onChange={() => updateQuestion(idx, 'correct_answer', 'true')}
                            />
                            True
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`tf-${idx}`}
                              checked={q.correct_answer === 'false'}
                              onChange={() => updateQuestion(idx, 'correct_answer', 'false')}
                            />
                            False
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Fill in the Blank */}
                    {q.question_type === 'fill_blank' && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Correct Answer</Label>
                        <Input
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(idx, 'correct_answer', e.target.value)}
                          placeholder="Expected answer..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Quiz'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
