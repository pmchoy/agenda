import { api, ensureCsrfCookie } from '@/lib/api-client'
import type { User } from '@/types/api'

export type LoginPayload = {
  email: string
  password: string
  remember?: boolean
}

export type ForgotPasswordPayload = {
  email: string
}

/**
 * Fetches the currently authenticated user's session.
 * Resolves with `null` (not a rejection) on a 401 so callers can treat
 * "no session" as a normal, renderable state instead of an error boundary.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { data } = await api.get<{ data: User }>('/user')
    return data.data
  } catch (error) {
    if (isUnauthenticated(error)) {
      return null
    }
    throw error
  }
}

export async function login(payload: LoginPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await api.post<{ data: User }>('/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await ensureCsrfCookie()
  await api.post('/logout')
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<string> {
  await ensureCsrfCookie()
  const { data } = await api.post<{ message: string }>('/forgot-password', payload)
  return data.message
}

function isUnauthenticated(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  )
}
