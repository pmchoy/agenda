import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { useCategories, useCreateService, useUpdateService } from '@/features/catalog/queries'
import { applyServerErrors, extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { Service } from '@/types/api'

const serviceSchema = z.object({
  service_category_id: z.number().int('Elija una categoría.').positive('Elija una categoría.'),
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  duration_minutes: z.number().int().min(1, 'La duración debe ser de al menos 1 minuto.'),
  price: z.number().min(0).nullable(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

type ServiceValues = z.infer<typeof serviceSchema>

type ServiceFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
}

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const isEditing = !!service
  const { data: categories } = useCategories()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const mutation = isEditing ? updateService : createService

  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_category_id: 0,
      name: '',
      duration_minutes: 30,
      price: null,
      sort_order: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        service_category_id: service?.service_category_id ?? 0,
        name: service?.name ?? '',
        duration_minutes: service?.duration_minutes ?? 30,
        price: service?.price ? Number(service.price) : null,
        sort_order: service?.sort_order ?? 0,
        is_active: service?.is_active ?? true,
      })
    }
  }, [open, service, form])

  const onSubmit = form.handleSubmit((values) => {
    const payload = values
    const action = isEditing
      ? updateService.mutateAsync({ id: service.id, payload })
      : createService.mutateAsync(payload)

    action
      .then(() => {
        toast.success(isEditing ? 'Servicio actualizado.' : 'Servicio creado.')
        onOpenChange(false)
      })
      .catch((error: unknown) => applyServerErrors(error, form))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>Los servicios son lo que los clientes reservan como turnos.</DialogDescription>
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
              name="service_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elija una categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="ej. Corte de cabello" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Opcional"
                        name={field.name}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(event.target.value === '' ? null : event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Activo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Los servicios inactivos se ocultan en la reserva de turnos.
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
                {isEditing ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
