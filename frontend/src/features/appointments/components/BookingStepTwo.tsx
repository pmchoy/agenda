import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DataState } from '@/components/layout/DataState'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { isSlotConflictError } from '@/features/appointments/api'
import type { BookingSelection } from '@/features/appointments/components/BookingStepOne'
import { SlotGrid } from '@/features/appointments/components/SlotGrid'
import { useAvailability, useCreateAppointment } from '@/features/appointments/queries'
import { useClients } from '@/features/clients/queries'
import { formatDateLabel } from '@/lib/datetime'
import { applyServerErrors, extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { Slot } from '@/types/api'

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio.').max(255),
  phone: z.string().min(1, 'El teléfono es obligatorio.'),
  notes: z.string().optional(),
})

type ClientValues = z.infer<typeof clientSchema>

type BookingStepTwoProps = {
  selection: BookingSelection
  serviceName: string
  onBack: () => void
  onBooked: (appointmentId: number) => void
}

/**
 * Step 2: real availability for the step-1 selection, an obviously-clickable
 * slot picker, client name/phone/notes, and submit. A 409 `slot_unavailable`
 * (someone else booked it first) clears the stale selection and re-fetches
 * availability with an inline explanation instead of a raw error — this is
 * the one screen in the app where that race is genuinely expected.
 */
export function BookingStepTwo({ selection, serviceName, onBack, onBooked }: BookingStepTwoProps) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)

  const availability = useAvailability({
    serviceId: selection.serviceId,
    professionalId: selection.professionalId,
    date: selection.date,
  })
  const { data: clients } = useClients()
  const createAppointment = useCreateAppointment()

  const form = useForm<ClientValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', phone: '', notes: '' },
  })

  const nameValue = form.watch('name')
  const phoneValue = form.watch('phone')

  // Cheap client lookup: no dedicated endpoint call, just filters the
  // already-fetched client list client-side as the encargado types. Not a
  // real autocomplete API — skipped if the list is empty or the query is
  // too short to be useful.
  const suggestions = useMemo(() => {
    const query = (phoneValue || nameValue || '').trim().toLowerCase()
    if (!clients || query.length < 2) return []
    return clients
      .filter(
        (client) => client.name.toLowerCase().includes(query) || client.phone.includes(query),
      )
      .slice(0, 5)
  }, [clients, phoneValue, nameValue])

  const onSubmit = form.handleSubmit((values) => {
    if (!selectedSlot) return
    setConflictMessage(null)

    createAppointment
      .mutateAsync({
        service_id: selection.serviceId,
        professional_id: selectedSlot.professional_id,
        starts_at: selectedSlot.starts_at,
        client: { name: values.name, phone: values.phone },
        notes: values.notes || null,
      })
      .then((appointment) => {
        toast.success('Turno reservado.')
        onBooked(appointment.id)
      })
      .catch((error: unknown) => {
        if (isSlotConflictError(error)) {
          setSelectedSlot(null)
          setConflictMessage('Ese horario acaba de ser reservado por otra persona — elija otro a continuación.')
          void availability.refetch()
          return
        }
        applyServerErrors(error, form)
      })
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{serviceName}</p>
          <p className="text-sm text-muted-foreground">
            {selection.professionalId === 'any' ? 'Sin preferencia' : 'Profesional preferido'} ·{' '}
            {formatDateLabel(selection.date)}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft /> Cambiar
        </Button>
      </div>

      {conflictMessage && (
        <Alert variant="destructive">
          <AlertDescription>{conflictMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Horarios disponibles</p>
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
              showProfessionalName={selection.professionalId === 'any'}
            />
          )}
        </DataState>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {createAppointment.isError && !hasFieldErrors(createAppointment.error) && !conflictMessage && (
            <Alert variant="destructive">
              <AlertDescription>{extractErrorMessage(createAppointment.error)}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del cliente</FormLabel>
                <FormControl>
                  <Input placeholder="ej. Lucía Fernández" {...field} />
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
                <FormMessage />
              </FormItem>
            )}
          />

          {suggestions.length > 0 && (
            <div className="rounded-lg border border-border p-2">
              <p className="px-1 pb-1 text-xs font-medium text-muted-foreground">Clientes existentes</p>
              <div className="flex flex-col">
                {suggestions.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      form.setValue('name', client.name)
                      form.setValue('phone', client.phone)
                    }}
                  >
                    <span className="font-medium text-foreground">{client.name}</span>{' '}
                    <span className="text-muted-foreground">{client.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Opcional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={!selectedSlot || createAppointment.isPending}>
              {createAppointment.isPending && <Loader2 className="animate-spin" />}
              Confirmar reserva
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
