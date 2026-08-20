import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { BusinessHoursForm } from '@/features/hours/components/BusinessHoursForm'
import { useBusinessHours } from '@/features/hours/queries'

export function BusinessHoursPage() {
  const { data: hours, isPending, isError, error, refetch } = useBusinessHours()

  return (
    <div>
      <PageHeader
        title="Horario comercial"
        description="El horario semanal predeterminado del salón. Los profesionales heredan este horario salvo que tengan una anulación propia."
      />

      <DataState isLoading={isPending} isError={isError} error={error} onRetry={() => refetch()} isEmpty={false}>
        {hours && <BusinessHoursForm hours={hours} />}
      </DataState>
    </div>
  )
}
