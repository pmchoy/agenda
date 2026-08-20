import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDeleteDialog } from '@/components/layout/ConfirmDeleteDialog'
import { ClientFormDialog } from '@/features/clients/components/ClientFormDialog'
import { useDeleteClient } from '@/features/clients/queries'
import { extractErrorMessage } from '@/lib/form-errors'
import type { Client } from '@/types/api'

export function ClientList({ clients }: { clients: Client[] }) {
  const [editing, setEditing] = useState<Client | null | undefined>(undefined)
  const deleteClient = useDeleteClient()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell className="font-medium text-foreground">{client.name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {client.notes ?? '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${client.name}`}
                    onClick={() => setEditing(client)}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDeleteDialog
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Eliminar ${client.name}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`¿Eliminar "${client.name}"?`}
                    description="Esta acción no se puede deshacer. Los turnos pasados de este cliente no se ven afectados."
                    onConfirm={() =>
                      deleteClient.mutate(client.id, {
                        onSuccess: () => toast.success('Cliente eliminado.'),
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

      <ClientFormDialog
        open={editing !== undefined}
        onOpenChange={(open) => !open && setEditing(undefined)}
        client={editing}
      />
    </>
  )
}
