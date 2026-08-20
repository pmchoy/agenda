import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useCurrentUser } from '@/features/auth/queries'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Route guard for everything except /login. Renders a skeleton while the
 * session probe (`GET /api/v1/user`) is in flight, redirects unauthenticated
 * visitors to /login (preserving the attempted location), and renders the
 * protected subtree once a session is confirmed.
 */
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
