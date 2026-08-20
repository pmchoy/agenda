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
          toast.success('Appointment rescheduled.')
          onOpenChange(false)
        },
        onError: (error) => {
          if (isSlotConflictError(error)) {
            setSelectedSlot(null)
            setConflictMessage('That time was just booked by someone else — pick another one below.')
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
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            Pick a new date and time for {appointment.client?.name ?? 'this client'}&apos;s{' '}
            {appointment.service?.name}.
          </DialogDescription>
        </DialogHeader>

        {conflictMessage && (
          <Alert variant="destructive">
            <AlertDescription>{conflictMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">Date</Label>
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
            <Label>Professional</Label>
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
                <SelectItem value="any">No preference</SelectItem>
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
          emptyTitle="No availability that day"
          emptyDescription="Try a different date or professional."
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
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!selectedSlot || reschedule.isPending}>
            Confirm new time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
