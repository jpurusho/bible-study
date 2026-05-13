import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ChevronRight, Sparkles } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  return (
    <div className="space-y-10 py-4">
      {/* Hero section */}
      <section className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="size-4" />
          Weekly Bible Study
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          Welcome to Bible Study
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Access your weekly study materials, take personal notes, participate in discussions, and grow together.
        </p>
      </section>

      {/* Books section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Current Studies</h2>
        </div>

        {books && books.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {books.map((book) => (
              <Link key={book.id} href={`/books/${book.slug}`}>
                <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {book.title}
                      </CardTitle>
                      {book.description && (
                        <CardDescription className="line-clamp-2 mt-0.5">
                          {book.description}
                        </CardDescription>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                No study materials available yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon — new content is added weekly.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
