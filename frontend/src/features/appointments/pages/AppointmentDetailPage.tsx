import { useState } from 'react'
import { ArrowLeft, CalendarClock } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DataState } from '@/components/layout/DataState'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppointmentStatusBadge } from '@/features/appointments/components/AppointmentStatusBadge'
import { CancelAppointmentDialog } from '@/features/appointments/components/CancelAppointmentDialog'
import { RescheduleDialog } from '@/features/appointments/components/RescheduleDialog'
import { useAppointment } from '@/features/appointments/queries'
import { formatDateLabel, formatTime } from '@/lib/datetime'

export function AppointmentDetailPage() {
  const params = useParams<{ id: string }>()
  const appointmentId = Number(params.id)
  const [isRescheduling, setIsRescheduling] = useState(false)

  const { data: appointment, isPending, isError, error, refetch } = useAppointment(appointmentId)

  const isActionable = appointment?.status === 'scheduled' || appointment?.status === 'confirmed'

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/agenda">
          <ArrowLeft /> Back to agenda
        </Link>
      </Button>

      <PageHeader title="Appointment" description="Details, reschedule, and cancellation." />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={false}
      >
        {appointment && (
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {formatDateLabel(appointment.starts_at.slice(0, 10))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(appointment.starts_at)}–{formatTime(appointment.ends_at)}
                    </p>
                  </div>
                </div>
                <AppointmentStatusBadge status={appointment.status} />
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Client</dt>
                  <dd className="text-sm text-foreground">{appointment.client?.name}</dd>
                  <dd className="text-sm text-muted-foreground">{appointment.client?.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Service</dt>
                  <dd className="text-sm text-foreground">{appointment.service?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Professional</dt>
                  <dd className="text-sm text-foreground">{appointment.professional?.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                  <dd className="text-sm text-foreground">{appointment.notes ?? '—'}</dd>
                </div>
              </dl>

              {isActionable && (
                <div className="flex gap-2 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setIsRescheduling(true)}>
                    Reschedule
                  </Button>
                  <CancelAppointmentDialog
                    appointmentId={appointment.id}
                    trigger={<Button variant="outline">Cancel appointment</Button>}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {appointment && (
          <RescheduleDialog
            appointment={appointment}
            open={isRescheduling}
            onOpenChange={setIsRescheduling}
          />
        )}
      </DataState>
    </div>
  )
}
