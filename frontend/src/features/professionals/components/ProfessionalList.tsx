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
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
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
                  {professional.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Horario de ${professional.name}`} asChild>
                    <Link to={`/professionals/${professional.id}/hours`}>
                      <Clock />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${professional.name}`}
                    onClick={() => setEditing(professional)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Eliminar ${professional.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`¿Eliminar "${professional.name}"?`}
                    description="Esta acción no se puede deshacer. Los turnos existentes de este profesional no se ven afectados."
                    onConfirm={() =>
                      deleteProfessional.mutate(professional.id, {
                        onSuccess: () => toast.success('Profesional eliminado.'),
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
