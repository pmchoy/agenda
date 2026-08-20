import { useEffect } from 'react'

import { AppRouter } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import { ensureCsrfCookie } from '@/lib/api-client'

export function App() {
  useEffect(() => {
    // Sanctum SPA bootstrap: fetch the XSRF-TOKEN cookie once up front so it
    // is already present by the time the first mutation (or the session
    // probe in RequireAuth/LoginPage) fires.
    void ensureCsrfCookie()
  }, [])

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </>
  )
}
