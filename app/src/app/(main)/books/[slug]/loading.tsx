import { Skeleton } from '@/components/ui/skeleton'

export default function BookLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-48" />
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
