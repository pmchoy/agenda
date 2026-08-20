import { es } from 'date-fns/locale'
import { format, getDay, parse, startOfWeek, type Locale } from 'date-fns'
import { dateFnsLocalizer, type EventPropGetter, type Messages } from 'react-big-calendar'

import type { Appointment } from '@/types/api'
import type { AgendaView } from '@/features/agenda/api'

/** One appointment mapped to react-big-calendar's `Event` shape. `resourceId`
 * is the field name react-big-calendar's default `resourceAccessor` reads to
 * place an event in the matching resource (professional) column in day view;
 * `appointment` carries the original record through for click-through and
 * status-aware styling. */
export type AgendaCalendarEvent = {
  id: number
  title: string
  start: Date
  end: Date
  resourceId: number
  appointment: Appointment
}

/** A professional's column in the day (resource) view. */
export type AgendaResource = {
  professional_id: number
  title: string
}

const locales = { es }

/** Forces Monday-first weeks to match this app's convention (`Weekday::weekRange()`
 * on the API side, and `formatShortDateLabel`'s week headers) — date-fns's own
 * default is Sunday-first unless overridden here. */
function mondayFirstStartOfWeek(date: Date, options?: { locale?: Locale }) {
  return startOfWeek(date, { ...options, weekStartsOn: 1 })
}

export const agendaLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: mondayFirstStartOfWeek,
  getDay,
  locales,
})

export const agendaMessages: Messages<AgendaCalendarEvent> = {
  date: 'Fecha',
  time: 'Hora',
  event: 'Turno',
  allDay: 'Todo el día',
  week: 'Semana',
  work_week: 'Semana laboral',
  day: 'Día',
  month: 'Mes',
  previous: 'Atrás',
  next: 'Siguiente',
  yesterday: 'Ayer',
  tomorrow: 'Mañana',
  today: 'Hoy',
  agenda: 'Agenda',
  noEventsInRange: 'No hay turnos en este rango.',
  showMore: (count) => `+${count} más`,
}

/** Curated wine/plum-family palette (same `oklch()` technique as `index.css`'s
 * theme tokens, varied in hue/chroma around the app's `--primary` anchor) so
 * per-professional colors stay in the app's visual language instead of
 * react-big-calendar's default blue. Cycled by `professional_id`. */
const PROFESSIONAL_PALETTE = [
  'oklch(0.42 0.12 15)', // wine (matches --primary's hue)
  'oklch(0.48 0.11 55)', // terracotta
  'oklch(0.42 0.09 320)', // plum
  'oklch(0.47 0.08 200)', // slate teal — contrast accent
  'oklch(0.46 0.1 95)', // olive-gold
  'oklch(0.46 0.13 350)', // rose-magenta
]

export function professionalColor(professionalId: number): string {
  const index = professionalId % PROFESSIONAL_PALETTE.length
  return PROFESSIONAL_PALETTE[index]
}

function eventTitle(appointment: Appointment, view: AgendaView): string {
  const client = appointment.client?.name ?? 'Cliente'
  if (view === 'day') {
    return appointment.service?.name ? `${client} · ${appointment.service.name}` : client
  }
  // Week view shares one timeline across professionals, so the label must
  // carry the professional's name — color alone isn't enough to tell events
  // apart once printed or viewed by someone color-blind.
  const professional = appointment.professional?.name ?? 'Profesional'
  return `${professional}: ${client}`
}

/** Maps a day/week's appointments into react-big-calendar events. */
export function buildCalendarEvents(appointments: Appointment[], view: AgendaView): AgendaCalendarEvent[] {
  return appointments.map((appointment) => ({
    id: appointment.id,
    title: eventTitle(appointment, view),
    // `starts_at`/`ends_at` carry an explicit `-03:00` offset representing
    // Montevideo LOCAL wall-clock time (see `lib/datetime.ts`), so
    // `new Date(iso)` yields the correct absolute instant. react-big-calendar
    // then renders that instant using the BROWSER's local timezone — this
    // assumes the admin's OS/browser is set to America/Montevideo, which
    // holds for this single-location, locally-staffed Laragon deployment. No
    // timezone-conversion library is used here deliberately.
    start: new Date(appointment.starts_at),
    end: new Date(appointment.ends_at),
    resourceId: appointment.professional_id,
    appointment,
  }))
}

/** Distinct professionals among a day's appointments, sorted by name, for the
 * day view's resource columns. Derived from the agenda payload itself (no
 * separate professionals fetch) — a day with no appointments renders no
 * columns, same empty-state behaviour as the previous list view. */
export function buildResources(appointments: Appointment[]): AgendaResource[] {
  const seen = new Map<number, string>()
  for (const appointment of appointments) {
    if (!seen.has(appointment.professional_id)) {
      seen.set(appointment.professional_id, appointment.professional?.name ?? `Profesional #${appointment.professional_id}`)
    }
  }
  return [...seen.entries()]
    .map(([professional_id, title]) => ({ professional_id, title }))
    .sort((a, b) => a.title.localeCompare(b.title, 'es'))
}

/** Colors each event by professional and mutes/strikes through cancelled
 * appointments — preserves the old `AppointmentStatusBadge`'s "cancelled
 * looks different" intent without a badge widget, which doesn't fit a
 * calendar event's limited space. */
export const agendaEventPropGetter: EventPropGetter<AgendaCalendarEvent> = (event) => {
  const isCancelled = event.appointment.status === 'cancelled'
  const color = professionalColor(event.appointment.professional_id)
  return {
    className: isCancelled ? 'agenda-event--cancelled' : undefined,
    style: {
      backgroundColor: color,
      borderColor: color,
    },
  }
}

/** Converts a `YYYY-MM-DD` date param to a local `Date` at local midnight, for
 * feeding react-big-calendar's `date` prop. Deliberately NOT the `Date.UTC`
 * construction `lib/datetime.ts` uses for pure calendar math — react-big-calendar
 * renders in the browser's local timezone, so this needs a real local Date,
 * under the same America/Montevideo browser-timezone assumption documented in
 * `buildCalendarEvents` above. */
export function parseDateParam(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** The inverse of `parseDateParam` — reads a browser-local `Date` (as produced
 * by react-big-calendar's `onNavigate`) back into a `YYYY-MM-DD` string for
 * the `?date=` search param / `GET /api/v1/agenda` query. */
export function toDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
