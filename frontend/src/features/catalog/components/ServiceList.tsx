import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/layout/ConfirmDeleteDialog'
import { ServiceFormDialog } from '@/features/catalog/components/ServiceFormDialog'
import { useDeleteService } from '@/features/catalog/queries'
import { extractErrorMessage } from '@/lib/form-errors'
import type { Service } from '@/types/api'

export function ServiceList({ services }: { services: Service[] }) {
  const [editing, setEditing] = useState<Service | null | undefined>(undefined)
  const deleteService = useDeleteService()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium text-foreground">{service.name}</TableCell>
              <TableCell>{service.category?.name ?? '—'}</TableCell>
              <TableCell>{service.duration_minutes} min</TableCell>
              <TableCell>{service.price ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={service.is_active ? 'success' : 'muted'}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${service.name}`}
                    onClick={() => setEditing(service)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Delete ${service.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`Delete "${service.name}"?`}
                    description="This cannot be undone. Professionals qualified for this service will no longer offer it."
                    onConfirm={() =>
                      deleteService.mutate(service.id, {
                        onSuccess: () => toast.success('Service deleted.'),
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

      <ServiceFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        service={editing}
      />
    </>
  )
}
