import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { ClientList } from '@/features/clients/components/ClientList'
import { ClientFormDialog } from '@/features/clients/components/ClientFormDialog'
import { useClients } from '@/features/clients/queries'

export function ClientsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const { data: clients, isPending, isError, error, refetch } = useClients()

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Everyone who has booked or been booked for an appointment."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> New client
          </Button>
        }
      />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!clients && clients.length === 0}
        emptyTitle="No clients yet"
        emptyDescription="Clients are usually created automatically when booking an appointment, but you can add one manually here."
        emptyAction={<Button onClick={() => setIsCreating(true)}>New client</Button>}
      >
        {clients && <ClientList clients={clients} />}
      </DataState>

      <ClientFormDialog open={isCreating} onOpenChange={setIsCreating} client={null} />
    </div>
  )
}
