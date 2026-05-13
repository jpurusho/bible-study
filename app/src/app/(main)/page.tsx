import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ChevronRight } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="text-muted-foreground mt-1">
          Access your weekly study materials, notes, and discussions.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-4">Books</h2>
        {books && books.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      {book.description && (
                        <CardDescription className="line-clamp-1">
                          {book.description}
                        </CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No study materials available yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
