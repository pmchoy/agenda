import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import { CancelAppointmentDialog } from '@/features/appointments/components/CancelAppointmentDialog'
import { formatTime } from '@/lib/datetime'
import type { Appointment } from '@/types/api'

type AppointmentRowProps = {
  appointment: Appointment
  /** Week view rows are compact — time + client + status only. */
  compact?: boolean
}

/**
 * One row of the agenda, shared by the day and week views. Links to the
 * detail page and offers a quick inline cancel — both list views are plain
 * chronological lists per the spec's "list/table view" requirement, not a
 * calendar-grid widget.
 *
 * Cross-feature import: reuses `appointments/components/{AppointmentStatusBadge,
 * CancelAppointmentDialog}` and their `useCancelAppointment` hook, the same
 * pattern already established by `professionals/components/ProfessionalFormDialog`
 * importing `useServices` from `catalog` — a feature consuming another
 * feature's public component/hook surface, not reaching into its internals.
 */
export function AppointmentRow({ appointment, compact = false }: AppointmentRowProps) {
  const isCancellable = appointment.status === 'scheduled' || appointment.status === 'confirmed'

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
      <Link to={`/appointments/${appointment.id}`} className="flex min-w-0 flex-1 items-center gap-3 text-sm">
        <span className="w-12 shrink-0 font-medium text-foreground">{formatTime(appointment.starts_at)}</span>
        <span className="min-w-0 flex-1 truncate text-foreground">{appointment.client?.name}</span>
        {!compact && (
          <>
            <span className="hidden min-w-0 flex-1 truncate text-muted-foreground sm:inline">
              {appointment.service?.name}
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-muted-foreground md:inline">
              {appointment.professional?.name}
            </span>
          </>
        )}
        <AppointmentStatusBadge status={appointment.status} />
      </Link>

      {isCancellable && (
        <CancelAppointmentDialog
          appointmentId={appointment.id}
          trigger={
            <Button variant="ghost" size="sm" className="shrink-0">
              Cancel
            </Button>
          }
        />
      )}
    </div>
  )
}
