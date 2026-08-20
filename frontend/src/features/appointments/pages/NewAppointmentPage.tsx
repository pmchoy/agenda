import { PageHeader } from '@/components/layout/PageHeader'
import { BookingWizard } from '@/features/appointments/components/BookingWizard'

export function NewAppointmentPage() {
  return (
    <div>
      <PageHeader
        title="New appointment"
        description="Book a client for a service, with a specific professional or no preference."
      />
      <BookingWizard />
    </div>
  )
}
