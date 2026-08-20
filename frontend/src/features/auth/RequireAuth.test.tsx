import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { RequireAuth } from '@/features/auth/RequireAuth'
import * as authQueries from '@/features/auth/queries'
import type { User } from '@/types/api'

vi.mock('@/features/auth/queries', () => ({
  useCurrentUser: vi.fn(),
}))

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/agenda']}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/agenda" element={<div>Agenda content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

const mockUseCurrentUser = vi.mocked(authQueries.useCurrentUser)

describe('RequireAuth', () => {
  it('redirects unauthenticated visitors to /login', () => {
    mockUseCurrentUser.mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof authQueries.useCurrentUser>)

    renderProtectedRoute()

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Agenda content')).not.toBeInTheDocument()
  })

  it('renders the protected content once a session is confirmed', () => {
    const user: User = { id: 1, name: 'Ana', email: 'ana@omluruguay.com' }
    mockUseCurrentUser.mockReturnValue({
      data: user,
      isPending: false,
    } as ReturnType<typeof authQueries.useCurrentUser>)

    renderProtectedRoute()

    expect(screen.getByText('Agenda content')).toBeInTheDocument()
    expect(screen.queryByText('Login screen')).not.toBeInTheDocument()
  })
})
