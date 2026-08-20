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
          <AlertDialogTitle>¿Cancelar este turno?</AlertDialogTitle>
          <AlertDialogDescription>
            El horario se libera de inmediato para volver a reservarse. El turno sigue visible con
            estado &quot;Cancelado&quot; — no se elimina.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mantener turno</AlertDialogCancel>
          <AlertDialogAction
            disabled={cancelAppointment.isPending}
            onClick={() =>
              cancelAppointment.mutate(undefined, {
                onSuccess: () => {
                  toast.success('Turno cancelado.')
                  onCancelled?.()
                },
                onError: (error) => toast.error(extractErrorMessage(error)),
              })
            }
          >
            Cancelar turno
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
