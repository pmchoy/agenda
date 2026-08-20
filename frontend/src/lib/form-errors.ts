import axios from 'axios'
import type { useForm } from 'react-hook-form'

import type { ApiErrorBody } from '@/lib/api-client'

/**
 * Maps Laravel's 422 `{errors: {field: [...]}}` onto matching react-hook-form
 * fields, so validation feedback appears field-by-field instead of only as a
 * generic toast. Shared across every feature's create/edit forms.
 *
 * Typed as `ReturnType<typeof useForm<TValues>>` (not `UseFormReturn<TValues>`
 * directly) — the latter drops the resolver's inferred `TFieldValues`
 * generic and produces spurious "TFieldValues is not assignable" build
 * errors wherever a zodResolver is used. Matches the pattern already used
 * locally in `features/auth/pages/LoginPage.tsx`.
 */
export function applyServerErrors<TValues extends Record<string, unknown>>(
  error: unknown,
  form: ReturnType<typeof useForm<TValues>>,
) {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.status === 422) {
    const errors = error.response.data.errors ?? {}
    for (const [field, messages] of Object.entries(errors)) {
      form.setError(field as never, { type: 'server', message: messages[0] })
    }
  }
}

/** True if the error is a 422 with field-level validation errors already
 * surfaced via `applyServerErrors` — used to decide whether a generic
 * top-of-form alert is also needed. */
export function hasFieldErrors(error: unknown): boolean {
  return axios.isAxiosError<ApiErrorBody>(error) && error.response?.status === 422
}

/** Human-readable fallback message for any non-field-level API error. */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
