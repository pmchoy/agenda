/**
 * Hand-written response types mirroring the Laravel API Resources.
 * Kept in sync manually with `api/app/Http/Resources/V1/*`.
 */

export type User = {
  id: number
  name: string
  email: string
}

export type ServiceCategory = {
  id: number
  name: string
  sort_order: number
  is_active: boolean
}

export type Service = {
  id: number
  service_category_id: number
  name: string
  duration_minutes: number
  price: string | null
  is_active: boolean
  sort_order: number
  category?: ServiceCategory
}

export type Professional = {
  id: number
  name: string
  phone: string | null
  is_active: boolean
  priority: number
  service_ids?: number[]
}

/** Tri-state per-weekday override: `open` and `closed` are real API states; `inherit` is a
 * frontend-only synthesized state for weekdays absent from the API response (no override row). */
export type ProfessionalHourState = 'inherit' | 'open' | 'closed'

export type ProfessionalHour = {
  id: number
  professional_id: number
  weekday: number
  state: 'open' | 'closed'
  opens_at: string | null
  closes_at: string | null
}

export type BusinessHour = {
  id: number
  weekday: number
  opens_at: string | null
  closes_at: string | null
  is_closed: boolean
}

export type Client = {
  id: number
  name: string
  phone: string
  notes: string | null
}

export type Setting = {
  key: string
  value: string
}
