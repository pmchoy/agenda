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
            <TableHead>Name</TableHead>
            <TableHead>Sort order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium text-foreground">{category.name}</TableCell>
              <TableCell>{category.sort_order}</TableCell>
              <TableCell>
                <Badge variant={category.is_active ? 'success' : 'muted'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => setEditing(category)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`Delete "${category.name}"?`}
                    description="Services in this category are not deleted, but the category will no longer be available to assign."
                    onConfirm={() =>
                      deleteCategory.mutate(category.id, {
                        onSuccess: () => toast.success('Category deleted.'),
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
