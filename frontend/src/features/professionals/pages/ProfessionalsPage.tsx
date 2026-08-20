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
        title="Professionals"
        description="Manage staff, their booking priority, and qualified services."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> New professional
          </Button>
        }
      />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!professionals && professionals.length === 0}
        emptyTitle="No professionals yet"
        emptyDescription="Add a professional so services can be booked with them."
        emptyAction={<Button onClick={() => setIsCreating(true)}>New professional</Button>}
      >
        {professionals && <ProfessionalList professionals={professionals} />}
      </DataState>

      <ProfessionalFormDialog open={isCreating} onOpenChange={setIsCreating} professional={null} />
    </div>
  )
}
