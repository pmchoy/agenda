import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { ProfessionalList } from '@/features/professionals/components/ProfessionalList'
import { ProfessionalFormDialog } from '@/features/professionals/components/ProfessionalFormDialog'
import { useProfessionals } from '@/features/professionals/queries'

export function ProfessionalsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const { data: professionals, isPending, isError, error, refetch } = useProfessionals()

  return (
    <div>
      <PageHeader
        title="Profesionales"
        description="Administre al personal, su prioridad de reserva y los servicios habilitados."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nuevo profesional
          </Button>
        }
      />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!professionals && professionals.length === 0}
        emptyTitle="Todavía no hay profesionales"
        emptyDescription="Agregue un profesional para poder reservar turnos con él o ella."
        emptyAction={<Button onClick={() => setIsCreating(true)}>Nuevo profesional</Button>}
      >
        {professionals && <ProfessionalList professionals={professionals} />}
      </DataState>

      <ProfessionalFormDialog open={isCreating} onOpenChange={setIsCreating} professional={null} />
    </div>
  )
}
