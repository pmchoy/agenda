import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { ProfessionalHoursForm } from '@/features/professionals/components/ProfessionalHoursForm'
import { useProfessional, useProfessionalHours } from '@/features/professionals/queries'

export function ProfessionalHoursPage() {
  const params = useParams<{ id: string }>()
  const professionalId = Number(params.id)

  const professional = useProfessional(professionalId)
  const hours = useProfessionalHours(professionalId)

  const isLoading = professional.isPending || hours.isPending
  const isError = professional.isError || hours.isError
  const error = professional.error ?? hours.error

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/professionals">
          <ArrowLeft /> Volver a profesionales
        </Link>
      </Button>

      <PageHeader
        title={professional.data ? `Horario de ${professional.data.name}` : 'Horario laboral'}
        description="Anule el horario comercial del salón para este profesional, día por día."
      />

      <DataState
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => {
          void professional.refetch()
          void hours.refetch()
        }}
        isEmpty={false}
      >
        {hours.data && (
          <ProfessionalHoursForm professionalId={professionalId} overrides={hours.data} />
        )}
      </DataState>
    </div>
  )
}
