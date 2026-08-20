import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useServices } from '@/features/catalog/queries'
import { useCreateProfessional, useUpdateProfessional } from '@/features/professionals/queries'
import { applyServerErrors, extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { Professional } from '@/types/api'

const professionalSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  phone: z.string().max(32).optional().nullable(),
  is_active: z.boolean(),
  priority: z.number().int().min(0),
  service_ids: z.array(z.number()),
})

type ProfessionalValues = z.infer<typeof professionalSchema>

type ProfessionalFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  professional?: Professional | null
}

export function ProfessionalFormDialog({
  open,
  onOpenChange,
  professional,
}: ProfessionalFormDialogProps) {
  const isEditing = !!professional
  const { data: services } = useServices()
  const createProfessional = useCreateProfessional()
  const updateProfessional = useUpdateProfessional()
  const mutation = isEditing ? updateProfessional : createProfessional

  const form = useForm<ProfessionalValues>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: '', phone: '', is_active: true, priority: 0, service_ids: [] },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: professional?.name ?? '',
        phone: professional?.phone ?? '',
        is_active: professional?.is_active ?? true,
        priority: professional?.priority ?? 0,
        service_ids: professional?.service_ids ?? [],
      })
    }
  }, [open, professional, form])

  const onSubmit = form.handleSubmit((values) => {
    const payload = { ...values, phone: values.phone || null }
    const action = isEditing
      ? updateProfessional.mutateAsync({ id: professional.id, payload })
      : createProfessional.mutateAsync(payload)

    action
      .then(() => {
        toast.success(isEditing ? 'Profesional actualizado.' : 'Profesional creado.')
        onOpenChange(false)
      })
      .catch((error: unknown) => applyServerErrors(error, form))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar profesional' : 'Nuevo profesional'}</DialogTitle>
          <DialogDescription>
            Los profesionales realizan servicios y tienen su propio horario laboral.
          </DialogDescription>
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
                    <Input autoFocus placeholder="ej. Ana" {...field} />
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
                    <Input placeholder="Opcional" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      name={field.name}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(event) => field.onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Se usa solo cuando un cliente no tiene preferencia de profesional: gana el
                    número de prioridad más bajo en caso de empate, y luego el id del profesional.
                    No afecta nada más.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {services && services.length > 0 && (
              <FormField
                control={form.control}
                name="service_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicios habilitados</FormLabel>
                    <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                      {services.map((service) => {
                        const checked = field.value.includes(service.id)
                        return (
                          <label
                            key={service.id}
                            className="flex items-center gap-2 text-sm select-none"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input text-primary accent-primary"
                              checked={checked}
                              onChange={(event) => {
                                field.onChange(
                                  event.target.checked
                                    ? [...field.value, service.id]
                                    : field.value.filter((id) => id !== service.id),
                                )
                              }}
                            />
                            {service.name}
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Los profesionales inactivos se excluyen de la búsqueda de disponibilidad.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear profesional'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
