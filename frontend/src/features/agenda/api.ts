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
      include_cancelled: params.includeCancelled,
    },
  })
  return { days: data.data, meta: data.meta }
}
