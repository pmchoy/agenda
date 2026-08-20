/**
 * Hand-written response types mirroring the Laravel API Resources.
 * Kept in sync manually with `api/app/Http/Resources/V1/*`.
 */

export type User = {
  id: number
  name: string
  email: string
}
