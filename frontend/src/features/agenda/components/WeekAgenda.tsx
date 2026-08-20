import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentRow } from '@/features/agenda/components/AppointmentRow'
import { formatShortDateLabel } from '@/lib/datetime'
import type { Appointment } from '@/types/api'

type WeekAgendaProps = {
  days: Record<string, Appointment[]>
  /** `meta.days` from the API — Monday-first order, including empty days,
   * straight from `Weekday::weekRange()`. Never re-derived client-side. */
  order: string[]
}

/** The week's 7 days, Monday-first, each a compact appointment list —
 * including days with no bookings, so the week is never silently gap-filled. */
export function WeekAgenda({ days, order }: WeekAgendaProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {order.map((day) => {
        const appointments = days[day] ?? []
        return (
          <Card key={day} className="gap-3 py-4">
            <CardHeader className="px-4">
              <CardTitle className="text-sm">{formatShortDateLabel(day)}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {appointments.length === 0 ? (
                <p className="px-4 text-xs text-muted-foreground">No appointments</p>
              ) : (
                <div className="border-t border-border">
                  {appointments.map((appointment) => (
                    <AppointmentRow key={appointment.id} appointment={appointment} compact />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
