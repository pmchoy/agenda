import { api } from '@/lib/api-client'
import type { Appointment } from '@/types/api'

export type AgendaView = 'day' | 'week'

export type AgendaParams = {
  view: AgendaView
  date: string
  includeCancelled: boolean
}

export type AgendaMeta = {
  view: AgendaView
  from: string
  to: string
  days: string[]
}

export type AgendaResult = {
  days: Record<string, Appointment[]>
  meta: AgendaMeta
}

/** The API pre-groups appointments by day, including empty days, so the
 * caller never has to gap-fill a week/day view client-side. Week bounds
 * come exclusively from `Weekday::weekRange()` server-side (Monday-first). */
export async function fetchAgenda(params: AgendaParams): Promise<AgendaResult> {
  const { data } = await api.get<{ data: Record<string, Appointment[]>; meta: AgendaMeta }>('/agenda', {
    params: {
      view: params.view,
      date: params.date,
      // Sent as 0/1, not the JS boolean, so axios's default params
      // serializer produces "0"/"1" rather than the literal strings
      // "true"/"false" — Laravel's `boolean` validation rule (see
      // AgendaQueryRequest) only accepts 1/0/'1'/'0'/true/false, not the
      // string forms "true"/"false", so passing the raw boolean 422s on
      // every request (discovered during Phase 8 end-to-end smoke testing).
      include_cancelled: params.includeCancelled ? 1 : 0,
    },
  })
  return { days: data.data, meta: data.meta }
}
