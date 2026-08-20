import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateClient, useUpdateClient } from '@/features/clients/queries'
import { applyServerErrors, extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { Client } from '@/types/api'

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  phone: z.string().min(1, 'El teléfono es obligatorio.'),
  notes: z.string().optional().nullable(),
})

type ClientValues = z.infer<typeof clientSchema>

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
}

/** Phone is entered in any natural format here (e.g. `099 123 456`) — the API
 * normalizes it to E.164 in `StoreClientRequest::prepareForValidation()`
 * before validating uniqueness, so this form intentionally does not attempt
 * client-side normalization or format validation. */
export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const isEditing = !!client
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const mutation = isEditing ? updateClient : createClient

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', phone: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name ?? '',
        phone: client?.phone ?? '',
        notes: client?.notes ?? '',
      })
    }
  }, [open, client, form])

  const onSubmit = form.handleSubmit((values) => {
    const payload = { ...values, notes: values.notes || null }
    const action = isEditing
      ? updateClient.mutateAsync({ id: client.id, payload })
      : createClient.mutateAsync(payload)

    action
      .then(() => {
        toast.success(isEditing ? 'Cliente actualizado.' : 'Cliente creado.')
        onOpenChange(false)
      })
      .catch((error: unknown) => applyServerErrors(error, form))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>Los clientes se identifican por número de teléfono en todas las reservas.</DialogDescription>
        </DialogHeader>

        {mutation.isError && !hasFieldErrors(mutation.error) && (
          <Alert variant="destructive">
            <AlertDescription>{extractErrorMessage(mutation.error)}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="ej. Lucía Fernández" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="ej. 099 123 456" {...field} />
                  </FormControl>
                  <FormDescription>
                    Funciona cualquier formato — lo normalizaremos automáticamente. Un número de
                    teléfono por cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Opcional" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear cliente'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
