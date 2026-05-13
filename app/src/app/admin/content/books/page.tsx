import { createClient } from '@/lib/supabase/server'
import { BooksManager } from './books-manager'

export default async function AdminBooksPage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('display_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Books</h1>
        <p className="text-muted-foreground">Manage study books and their display order.</p>
      </div>
      <BooksManager initialBooks={books ?? []} />
    </div>
  )
}
