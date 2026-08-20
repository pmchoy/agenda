import type { ReactNode } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useCancelAppointment } from '@/features/appointments/queries'
import { extractErrorMessage } from '@/lib/form-errors'

type CancelAppointmentDialogProps = {
  appointmentId: number
  trigger: ReactNode
  onCancelled?: () => void
}

/**
 * Cancellation is free and immediate per the appointment-booking spec — no
 * lead-time restriction, and the slot is available again right away. This is
 * a status transition, not a delete, so the copy is explicit that the
 * appointment record stays around with a "Cancelled" status rather than
 * disappearing. Shared by the appointment detail page and every agenda row's
 * inline quick-cancel action.
 */
export function CancelAppointmentDialog({
  appointmentId,
  trigger,
  onCancelled,
}: CancelAppointmentDialogProps) {
  const cancelAppointment = useCancelAppointment(appointmentId)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            The slot frees up immediately for rebooking. The appointment stays visible with a
            &quot;Cancelled&quot; status — it is not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep appointment</AlertDialogCancel>
          <AlertDialogAction
            disabled={cancelAppointment.isPending}
            onClick={() =>
              cancelAppointment.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Appointment cancelled.')
                  onCancelled?.()
                },
                onError: (error) => toast.error(extractErrorMessage(error)),
              })
            }
          >
            Cancel appointment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
