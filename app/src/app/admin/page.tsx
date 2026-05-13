import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, FileText, ClipboardList, MessageSquare } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: userCount },
    { count: approvedCount },
    { count: bookCount },
    { count: sessionCount },
    { count: publishedSessionCount },
    { count: quizCount },
    { count: discussionCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase.from('discussion_posts').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      title: 'Users',
      value: approvedCount ?? 0,
      subtitle: `${(userCount ?? 0) - (approvedCount ?? 0)} pending`,
      icon: Users,
    },
    {
      title: 'Books',
      value: bookCount ?? 0,
      icon: BookOpen,
    },
    {
      title: 'Sessions',
      value: publishedSessionCount ?? 0,
      subtitle: `${(sessionCount ?? 0) - (publishedSessionCount ?? 0)} drafts`,
      icon: FileText,
    },
    {
      title: 'Quizzes',
      value: quizCount ?? 0,
      icon: ClipboardList,
    },
    {
      title: 'Discussion Posts',
      value: discussionCount ?? 0,
      icon: MessageSquare,
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
