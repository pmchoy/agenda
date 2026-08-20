import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
  type ClientPayload,
} from '@/features/clients/api'

export const clientKeys = {
  all: ['clients'] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: fetchClients,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClient(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientPayload }) =>
      updateClient(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  })
}
