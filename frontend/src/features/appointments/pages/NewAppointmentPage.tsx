import { PageHeader } from '@/components/layout/PageHeader'
import { BookingWizard } from '@/features/appointments/components/BookingWizard'

export function NewAppointmentPage() {
  return (
    <div>
      <PageHeader
        title="Nuevo turno"
        description="Reserve un turno para un cliente, con un profesional específico o sin preferencia."
      />
      <BookingWizard />
    </div>
  )
}
