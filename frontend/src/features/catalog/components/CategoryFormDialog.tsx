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
import { useCreateCategory, useUpdateCategory } from '@/features/catalog/queries'
import { applyServerErrors, extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { ServiceCategory } from '@/types/api'

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
})

type CategoryValues = z.infer<typeof categorySchema>

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: ServiceCategory | null
}

/** Create/edit dialog for a service category. Dedicated pages weren't used for
 * catalog CRUD per the design addendum's route map (`/catalog/categories`,
 * `/catalog/services` — no `/new` or `/:id/edit` routes), so create/edit is a
 * dialog over the list, matching the pattern the route map already implies. */
export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const isEditing = !!category
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const mutation = isEditing ? updateCategory : createCategory

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', sort_order: 0, is_active: true },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active ?? true,
      })
    }
  }, [open, category, form])

  const onSubmit = form.handleSubmit((values) => {
    const action = isEditing
      ? updateCategory.mutateAsync({ id: category.id, payload: values })
      : createCategory.mutateAsync(values)

    action
      .then(() => {
        toast.success(isEditing ? 'Categoría actualizada.' : 'Categoría creada.')
        onOpenChange(false)
      })
      .catch((error: unknown) => applyServerErrors(error, form))
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            Las categorías agrupan servicios en el catálogo y en el flujo de reserva.
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
                    <Input autoFocus placeholder="ej. Cabello" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      Las categorías inactivas se ocultan en la reserva de turnos.
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
                {isEditing ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
