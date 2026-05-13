'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  content: string | null
  scripture_reference: string | null
  chapter_id: string
  chapters: {
    id: string
    title: string
    chapter_number: number
    book_id: string
    books: {
      title: string
      slug: string
    }
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function getSnippet(content: string | null, maxLength = 200): string {
  if (!content) return ''
  const text = stripHtml(content)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '...'
}

export function SearchResults() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const supabase = createClient()

  const performSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      if (!trimmed) {
        setResults([])
        setHasSearched(false)
        return
      }

      setIsLoading(true)
      setHasSearched(true)

      const { data, error } = await supabase
        .from('sessions')
        .select(
          'id, title, content, scripture_reference, chapter_id, chapters(id, title, chapter_number, book_id, books(title, slug))'
        )
        .textSearch('search_vector', trimmed, { type: 'websearch' })
        .limit(20)

      if (error) {
        console.error('Search error:', error)
        setResults([])
      } else {
        setResults((data as unknown as SearchResult[]) ?? [])
      }

      setIsLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search sessions by title or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {!isLoading && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            No results found
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search terms
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => {
            const book = result.chapters?.books
            const chapter = result.chapters
            const href = book && chapter
              ? `/books/${book.slug}/${chapter.id}/${result.id}`
              : '#'

            return (
              <Link key={result.id} href={href}>
                <Card
                  className={cn(
                    'transition-colors hover:bg-accent/50 cursor-pointer'
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-base">
                      {result.title}
                    </CardTitle>
                    <CardDescription className="space-y-1">
                      {book && chapter && (
                        <span className="block text-xs font-medium text-primary/70">
                          {book.title} &middot; Chapter {chapter.chapter_number}
                          {result.scripture_reference &&
                            ` &middot; ${result.scripture_reference}`}
                        </span>
                      )}
                      <span className="block text-sm">
                        {getSnippet(result.content)}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
