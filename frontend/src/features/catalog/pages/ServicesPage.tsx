import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { CatalogNav } from '@/features/catalog/components/CatalogNav'
import { ServiceList } from '@/features/catalog/components/ServiceList'
import { ServiceFormDialog } from '@/features/catalog/components/ServiceFormDialog'
import { useServices } from '@/features/catalog/queries'

export function ServicesPage() {
  const [isCreating, setIsCreating] = useState(false)
  const { data: services, isPending, isError, error, refetch } = useServices()

  return (
    <div>
      <PageHeader
        title="Catálogo"
        description="Administre las categorías de servicios y los servicios que ofrece el salón."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nuevo servicio
          </Button>
        }
      />

      <CatalogNav />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!services && services.length === 0}
        emptyTitle="Todavía no hay servicios"
        emptyDescription="Agregue un servicio para que pueda reservarse."
        emptyAction={<Button onClick={() => setIsCreating(true)}>Nuevo servicio</Button>}
      >
        {services && <ServiceList services={services} />}
      </DataState>

      <ServiceFormDialog open={isCreating} onOpenChange={setIsCreating} service={null} />
    </div>
  )
}
