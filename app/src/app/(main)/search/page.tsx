import { Breadcrumbs } from '@/components/breadcrumbs'
import { SearchResults } from './search-results'

export const metadata = {
  title: 'Search',
}

export default function SearchPage() {
  return (
    <div className="container max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Search' }]} />
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-muted-foreground">
        Search across all sessions by title or content.
      </p>
      <div className="mt-6">
        <SearchResults />
      </div>
    </div>
  )
}
