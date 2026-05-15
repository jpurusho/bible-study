import { Skeleton } from '@/components/ui/skeleton'

export default function ChapterLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div>
        <Skeleton className="h-8 w-72 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-18 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
