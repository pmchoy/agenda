import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { CatalogNav } from '@/features/catalog/components/CatalogNav'
import { CategoryList } from '@/features/catalog/components/CategoryList'
import { CategoryFormDialog } from '@/features/catalog/components/CategoryFormDialog'
import { useCategories } from '@/features/catalog/queries'

export function CategoriesPage() {
  const [isCreating, setIsCreating] = useState(false)
  const { data: categories, isPending, isError, error, refetch } = useCategories()

  return (
    <div>
      <PageHeader
        title="Catálogo"
        description="Administre las categorías de servicios y los servicios que ofrece el salón."
        actions={
          <Button onClick={() => setIsCreating(true)}>
            <Plus /> Nueva categoría
          </Button>
        }
      />

      <CatalogNav />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!categories && categories.length === 0}
        emptyTitle="Todavía no hay categorías"
        emptyDescription="Cree su primera categoría para empezar a armar el catálogo de servicios."
        emptyAction={<Button onClick={() => setIsCreating(true)}>Nueva categoría</Button>}
      >
        {categories && <CategoryList categories={categories} />}
      </DataState>

      <CategoryFormDialog open={isCreating} onOpenChange={setIsCreating} category={null} />
    </div>
  )
}
