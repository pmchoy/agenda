import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/layout/DataState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { isSlotConflictError } from '@/features/appointments/api'
import { qualifiedProfessionals } from '@/features/appointments/lib'
import { SlotGrid } from '@/features/appointments/components/SlotGrid'
import { useAvailability, useRescheduleAppointment } from '@/features/appointments/queries'
import { useProfessionals } from '@/features/professionals/queries'
import { todayInMontevideo } from '@/lib/datetime'
import { extractErrorMessage } from '@/lib/form-errors'
import type { Appointment, Slot } from '@/types/api'

type RescheduleDialogProps = {
  appointment: Appointment
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Reschedule re-runs the exact same slot-picking step as a fresh booking,
 * scoped to the appointment's existing service — `UpdateAppointmentRequest`
 * rejects changing `service_id` on an existing appointment (cancel and
 * rebook instead), so this dialog never offers that. It starts from the
 * appointment's current professional but still allows switching to "no
 * preference", matching the booking flow.
 */
export function RescheduleDialog({ appointment, open, onOpenChange }: RescheduleDialogProps) {
  const [date, setDate] = useState(appointment.starts_at.slice(0, 10))
  const [professionalId, setProfessionalId] = useState<number | 'any'>(appointment.professional_id)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDate(appointment.starts_at.slice(0, 10))
      setProfessionalId(appointment.professional_id)
      setSelectedSlot(null)
      setConflictMessage(null)
    }
  }, [open, appointment])

  const { data: professionals } = useProfessionals()
  const eligibleProfessionals = qualifiedProfessionals(professionals ?? [], appointment.service_id)

  const availability = useAvailability({
    serviceId: appointment.service_id,
    professionalId,
    date,
  })
  const reschedule = useRescheduleAppointment(appointment.id)

  function handleSubmit() {
    if (!selectedSlot) return
    setConflictMessage(null)

    reschedule.mutate(
      { starts_at: selectedSlot.starts_at, professional_id: selectedSlot.professional_id },
      {
        onSuccess: () => {
          toast.success('Turno reprogramado.')
          onOpenChange(false)
        },
        onError: (error) => {
          if (isSlotConflictError(error)) {
            setSelectedSlot(null)
            setConflictMessage('Ese horario acaba de ser reservado por otra persona — elija otro a continuación.')
            void availability.refetch()
            return
          }
          toast.error(extractErrorMessage(error))
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reprogramar turno</DialogTitle>
          <DialogDescription>
            Elija una nueva fecha y hora para el turno de {appointment.service?.name} de{' '}
            {appointment.client?.name ?? 'este cliente'}.
          </DialogDescription>
        </DialogHeader>

        {conflictMessage && (
          <Alert variant="destructive">
            <AlertDescription>{conflictMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">Fecha</Label>
            <Input
              id="reschedule-date"
              type="date"
              min={todayInMontevideo()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                setSelectedSlot(null)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Profesional</Label>
            <Select
              value={String(professionalId)}
              onValueChange={(value) => {
                setProfessionalId(value === 'any' ? 'any' : Number(value))
                setSelectedSlot(null)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Sin preferencia</SelectItem>
                {eligibleProfessionals.map((professional) => (
                  <SelectItem key={professional.id} value={String(professional.id)}>
                    {professional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataState
          isLoading={availability.isPending}
          isError={availability.isError}
          error={availability.error}
          onRetry={() => void availability.refetch()}
          isEmpty={!!availability.data && availability.data.slots.length === 0}
          emptyTitle="No hay disponibilidad ese día"
          emptyDescription="Pruebe con otra fecha o profesional."
        >
          {availability.data && (
            <SlotGrid
              slots={availability.data.slots}
              selected={selectedSlot}
              onSelect={(slot) => {
                setSelectedSlot(slot)
                setConflictMessage(null)
              }}
              showProfessionalName={professionalId === 'any'}
            />
          )}
        </DataState>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!selectedSlot || reschedule.isPending}>
            Confirmar nuevo horario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
