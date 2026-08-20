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
        title="Catalog"
        description="Manage service categories and services offered by the salon."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> New service
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
        emptyTitle="No services yet"
        emptyDescription="Add a service so it can be booked."
        emptyAction={<Button onClick={() => setIsCreating(true)}>New service</Button>}
      >
        {services && <ServiceList services={services} />}
      </DataState>

      <ServiceFormDialog open={isCreating} onOpenChange={setIsCreating} service={null} />
    </div>
  )
}
