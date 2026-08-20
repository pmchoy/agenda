/**
 * Small date/time helpers shared by the booking flow and agenda views.
 *
 * `appointments.starts_at`/`ends_at` are stored as local `America/Montevideo`
 * wall-clock time and serialized with an explicit `-03:00` offset (see
 * `AppointmentResource`) — reading the `HH:mm` substring directly avoids any
 * reinterpretation through the browser's own timezone.
 */

export function formatTime(iso: string): string {
  return iso.slice(11, 16)
}

/** Today's date in the salon's timezone, as `YYYY-MM-DD` — independent of
 * whatever timezone the admin's browser happens to be in. */
export function todayInMontevideo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Adds `days` (may be negative) to a `YYYY-MM-DD` date string, returning a
 * new `YYYY-MM-DD` string. Built on `Date.UTC` and treated as pure calendar
 * math, not wall-clock time in any timezone — avoids the common
 * `new Date(dateOnlyString)` pitfall of shifting a day near midnight in the
 * browser's local timezone. */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Human-readable label for a `YYYY-MM-DD` date string, e.g. "miércoles, 20 de agosto". */
export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Short weekday + day label used in the compact weekly agenda headers, e.g. "lun 18". */
export function formatShortDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
