import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, FileText, ClipboardList, MessageSquare, Bell, MailCheck, ChevronRight, Wrench } from 'lucide-react'
import Link from 'next/link'

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

  const adminLinks = [
    { href: '/admin/users', label: 'Manage Users', description: 'Approve, revoke, promote users', icon: Users },
    { href: '/admin/preapproved', label: 'Pre-Approve Emails', description: 'Auto-approve users by email', icon: MailCheck },
    { href: '/admin/content', label: 'Manage Content', description: 'Books, chapters, sessions', icon: BookOpen },
    { href: '/admin/quizzes', label: 'Manage Quizzes', description: 'Create and edit quizzes', icon: ClipboardList },
    { href: '/admin/announcements', label: 'Announcements', description: 'Create notifications for users', icon: Bell },
    { href: '/admin/settings', label: 'Settings', description: 'API keys, AI configuration', icon: Wrench },
  ]

  return (
    <div className="space-y-8">
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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="flex items-center gap-3 p-4 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <link.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
