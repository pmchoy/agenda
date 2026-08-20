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
        title="Clientes"
        description="Todas las personas que reservaron o fueron reservadas para un turno."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nuevo cliente
          </Button>
        }
      />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!clients && clients.length === 0}
        emptyTitle="Todavía no hay clientes"
        emptyDescription="Los clientes suelen crearse automáticamente al reservar un turno, pero puede agregar uno manualmente aquí."
        emptyAction={<Button onClick={() => setIsCreating(true)}>Nuevo cliente</Button>}
      >
        {clients && <ClientList clients={clients} />}
      </DataState>

      <ClientFormDialog open={isCreating} onOpenChange={setIsCreating} client={null} />
    </div>
  )
}
