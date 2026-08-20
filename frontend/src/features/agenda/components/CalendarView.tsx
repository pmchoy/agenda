import { useMemo } from 'react'
import { Calendar, Views, type View } from 'react-big-calendar'
import { useNavigate } from 'react-router-dom'

import { DataState } from '@/components/layout/DataState'
import type { AgendaView } from '@/features/agenda/api'
import {
  agendaEventPropGetter,
  agendaLocalizer,
  agendaMessages,
  buildCalendarEvents,
  buildResources,
  parseDateParam,
  toDateParam,
  type AgendaCalendarEvent,
  type AgendaResource,
} from '@/features/agenda/lib'
import type { Appointment } from '@/types/api'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import '@/features/agenda/calendar.css'

const CALENDAR_VIEWS: View[] = [Views.DAY, Views.WEEK]

type CalendarViewProps = {
  view: AgendaView
  /** Currently selected `YYYY-MM-DD`. */
  date: string
  /** `GET /api/v1/agenda`'s pre-grouped-by-day payload, as returned. */
  days: Record<string, Appointment[]>
  /** `meta.days` — Monday-first order for the visible week, including empty days. */
  weekOrder: string[]
  onNavigate: (date: string) => void
  onViewChange: (view: AgendaView) => void
}

/**
 * Calendar-style agenda, replacing the earlier list-based `DayAgenda`/`WeekAgenda`.
 *
 * Day view uses react-big-calendar's resource mode (one column per
 * professional, `resourceIdAccessor` → `professional_id`). Week view is the
 * standard shared timeline, with events colored and labelled per professional
 * instead. Both keep the server-side windowed-fetch strategy: `days`/`weekOrder`
 * come straight from `GET /api/v1/agenda`'s `view`/`date` params, never a
 * broad client-side range.
 */
export function CalendarView({ view, date, days, weekOrder, onNavigate, onViewChange }: CalendarViewProps) {
  const navigate = useNavigate()

  const appointments = useMemo(() => {
    if (view === 'day') return days[date] ?? []
    return weekOrder.flatMap((day) => days[day] ?? [])
  }, [view, date, days, weekOrder])

  const events = useMemo(() => buildCalendarEvents(appointments, view), [appointments, view])
  const resources: AgendaResource[] | undefined = useMemo(
    () => (view === 'day' ? buildResources(appointments) : undefined),
    [view, appointments],
  )

  return (
    <DataState
      isLoading={false}
      isError={false}
      isEmpty={appointments.length === 0}
      emptyTitle="Nada reservado"
      emptyDescription={
        view === 'day' ? 'Todavía no hay turnos para este día.' : 'Todavía no hay turnos para esta semana.'
      }
    >
      <div className="agenda-calendar rounded-lg border border-border bg-card p-2 shadow-xs">
        <Calendar<AgendaCalendarEvent, AgendaResource>
          localizer={agendaLocalizer}
          culture="es"
          messages={agendaMessages}
          events={events}
          date={parseDateParam(date)}
          view={view}
          views={CALENDAR_VIEWS}
          onView={(nextView) => {
            if (nextView === 'day' || nextView === 'week') onViewChange(nextView)
          }}
          onNavigate={(nextDate) => onNavigate(toDateParam(nextDate))}
          resources={view === 'day' ? resources : undefined}
          resourceIdAccessor="professional_id"
          resourceTitleAccessor="title"
          eventPropGetter={agendaEventPropGetter}
          onSelectEvent={(event) => navigate(`/appointments/${event.appointment.id}`)}
          style={{ height: 640 }}
        />
      </div>
    </DataState>
  )
}
