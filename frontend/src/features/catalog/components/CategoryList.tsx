import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/layout/ConfirmDeleteDialog'
import { CategoryFormDialog } from '@/features/catalog/components/CategoryFormDialog'
import { useDeleteCategory } from '@/features/catalog/queries'
import { extractErrorMessage } from '@/lib/form-errors'
import type { ServiceCategory } from '@/types/api'

export function CategoryList({ categories }: { categories: ServiceCategory[] }) {
  const [editing, setEditing] = useState<ServiceCategory | null | undefined>(undefined)
  const deleteCategory = useDeleteCategory()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Orden</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium text-foreground">{category.name}</TableCell>
              <TableCell>{category.sort_order}</TableCell>
              <TableCell>
                <Badge variant={category.is_active ? 'success' : 'muted'}>
                  {category.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${category.name}`}
                    onClick={() => setEditing(category)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Eliminar ${category.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`¿Eliminar "${category.name}"?`}
                    description="Los servicios de esta categoría no se eliminan, pero la categoría dejará de estar disponible para asignar."
                    onConfirm={() =>
                      deleteCategory.mutate(category.id, {
                        onSuccess: () => toast.success('Categoría eliminada.'),
                        onError: (error) => toast.error(extractErrorMessage(error)),
                      })
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CategoryFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        category={editing}
      />
    </>
  )
}
