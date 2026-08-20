import axios from 'axios'

import { queryClient } from '@/lib/query-client'

/**
 * Base URL for the Laravel JSON API (e.g. http://agenda.test/api/v1 in dev).
 * Sanctum's CSRF-cookie endpoint lives one level up, at the API host root.
 */
const API_URL = import.meta.env.VITE_API_URL as string
export const API_HOST = new URL(API_URL).origin

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  // axios >= 1.6 stopped inferring X-XSRF-TOKEN from withCredentials alone —
  // without this every mutation silently 419s. Known gotcha, do not remove.
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

let csrfCookiePromise: Promise<void> | null = null

/**
 * Fetches the Sanctum CSRF cookie. Sanctum SPA (cookie/session) auth requires
 * this to run once before the first authenticated request. Safe to call
 * repeatedly — the underlying request is memoized per page load.
 */
export function ensureCsrfCookie(): Promise<void> {
  if (!csrfCookiePromise) {
    csrfCookiePromise = axios
      .get(`${API_HOST}/sanctum/csrf-cookie`, { withCredentials: true })
      .then(() => undefined)
      .catch((error) => {
        // Allow retrying on the next call if the bootstrap request itself failed.
        csrfCookiePromise = null
        throw error
      })
  }

  return csrfCookiePromise
}

export type ApiErrorBody = {
  message: string
  errors?: Record<string, string[]>
  code?: string
}

// Any 401 from an authenticated endpoint means the session is gone (expired,
// logged out elsewhere, etc). Clearing the cached user immediately flips
// RequireAuth's subscription and redirects to /login without a full reload.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      queryClient.setQueryData(['auth', 'user'], null)
    }
    return Promise.reject(error)
  },
)
