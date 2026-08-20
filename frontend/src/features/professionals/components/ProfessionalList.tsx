import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/layout/ConfirmDeleteDialog'
import { ProfessionalFormDialog } from '@/features/professionals/components/ProfessionalFormDialog'
import { useDeleteProfessional } from '@/features/professionals/queries'
import { extractErrorMessage } from '@/lib/form-errors'
import type { Professional } from '@/types/api'

export function ProfessionalList({ professionals }: { professionals: Professional[] }) {
  const [editing, setEditing] = useState<Professional | null | undefined>(undefined)
  const deleteProfessional = useDeleteProfessional()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {professionals.map((professional) => (
            <TableRow key={professional.id}>
              <TableCell className="font-medium text-foreground">{professional.name}</TableCell>
              <TableCell>{professional.phone ?? '—'}</TableCell>
              <TableCell>{professional.priority}</TableCell>
              <TableCell>
                <Badge variant={professional.is_active ? 'success' : 'muted'}>
                  {professional.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Hours for ${professional.name}`} asChild>
                    <Link to={`/professionals/${professional.id}/hours`}>
                      <Clock />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${professional.name}`}
                    onClick={() => setEditing(professional)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Delete ${professional.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`Delete "${professional.name}"?`}
                    description="This cannot be undone. Existing appointments for this professional are not affected."
                    onConfirm={() =>
                      deleteProfessional.mutate(professional.id, {
                        onSuccess: () => toast.success('Professional deleted.'),
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

      <ProfessionalFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        professional={editing}
      />
    </>
  )
}
