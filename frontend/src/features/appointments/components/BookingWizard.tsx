import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BookingStepOne, type BookingSelection } from '@/features/appointments/components/BookingStepOne'
import { BookingStepTwo } from '@/features/appointments/components/BookingStepTwo'
import { useServices } from '@/features/catalog/queries'
import { cn } from '@/lib/utils'

/**
 * Two-step booking flow: step 1 narrows service + professional preference +
 * date, step 2 searches real availability and captures the client. Modeled
 * as an explicit state machine (`selection: BookingSelection | null`) rather
 * than a shared step index plus one big form — step 2 can never render
 * without a fully-formed search, the type system enforces it, and "back"
 * (step 1's memory of the previous choice) is just `initial={selection}`.
 */
export function BookingWizard() {
  const [selection, setSelection] = useState<BookingSelection | null>(null)
  const { data: services } = useServices()
  const navigate = useNavigate()

  const serviceName = services?.find((service) => service.id === selection?.serviceId)?.name ?? ''

  return (
    <div className="max-w-2xl">
      <ol className="mb-6 flex items-center gap-2 text-sm font-medium">
        <li className={cn(selection ? 'text-muted-foreground' : 'text-foreground')}>
          1. Servicio y fecha
        </li>
        <li className="text-muted-foreground">→</li>
        <li className={cn(selection ? 'text-foreground' : 'text-muted-foreground')}>
          2. Horario y cliente
        </li>
      </ol>

      {!selection ? (
        <BookingStepOne onNext={setSelection} />
      ) : (
        <BookingStepTwo
          selection={selection}
          serviceName={serviceName}
          onBack={() => setSelection(null)}
          onBooked={(appointmentId) => navigate(`/appointments/${appointmentId}`)}
        />
      )}
    </div>
  )
}
