import { DataState } from '@/components/layout/DataState'
import { AppointmentRow } from '@/features/agenda/components/AppointmentRow'
import type { Appointment } from '@/types/api'

/** Simple ordered list of one day's appointments — a deliberate design
 * decision, not a time-grid calendar widget. */
export function DayAgenda({ appointments }: { appointments: Appointment[] }) {
  return (
    <DataState
      isLoading={false}
      isError={false}
      isEmpty={appointments.length === 0}
      emptyTitle="Nothing booked"
      emptyDescription="No appointments for this day yet."
    >
      <div className="rounded-lg border border-border">
        {appointments.map((appointment) => (
          <AppointmentRow key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </DataState>
  )
}
