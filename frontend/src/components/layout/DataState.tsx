import type { ReactNode } from 'react'
import { AlertTriangle, Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type DataStateProps = {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
  error?: unknown
  onRetry?: () => void
  loadingFallback?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  children: ReactNode
}

/**
 * Four-state wrapper every data-fetching screen should use: loading skeleton,
 * empty-with-CTA, error-with-retry, content. Keeping this shared makes an
 * omitted state visible in review instead of silently missing.
 */
export function DataState({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  loadingFallback,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'There is no data to show right now.',
  emptyAction,
  children,
}: DataStateProps) {
  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      )
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <div>
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">{extractMessage(error)}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
        <Inbox className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        {emptyAction}
      </div>
    )
  }

  return <>{children}</>
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? 'Please try again.')
  }
  return 'Please try again.'
}
