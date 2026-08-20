import type { ReactNode } from 'react'

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

type ConfirmDeleteDialogProps = {
  trigger: ReactNode
  title: string
  description: string
  onConfirm: () => void
}

/**
 * Shared destructive-action confirmation, used by every feature's delete
 * flow. Cross-feature reusable presentation, so it lives alongside DataState
 * in `components/layout/` rather than duplicated per feature folder.
 *
 * The dialog closes immediately on confirm (Radix `AlertDialogAction`'s
 * default behavior) — the caller's mutation runs in the background and
 * reports its own success/error toast, matching the async delete flows used
 * throughout this batch.
 */
export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Eliminar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
