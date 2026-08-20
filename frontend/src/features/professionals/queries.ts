import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createProfessional,
  deleteProfessional,
  fetchProfessional,
  fetchProfessionalHours,
  fetchProfessionals,
  updateProfessional,
  updateProfessionalHours,
  type ProfessionalHourWeekdayPatch,
  type ProfessionalPayload,
} from '@/features/professionals/api'

export const professionalKeys = {
  all: ['professionals'] as const,
  detail: (id: number) => ['professionals', id] as const,
  hours: (id: number) => ['professionals', id, 'hours'] as const,
}

export function useProfessionals() {
  return useQuery({
    queryKey: professionalKeys.all,
    queryFn: fetchProfessionals,
  })
}

export function useProfessional(id: number) {
  return useQuery({
    queryKey: professionalKeys.detail(id),
    queryFn: () => fetchProfessional(id),
  })
}

export function useCreateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProfessionalPayload) => createProfessional(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: professionalKeys.all }),
  })
}

export function useUpdateProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProfessionalPayload }) =>
      updateProfessional(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: professionalKeys.all }),
  })
}

export function useDeleteProfessional() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProfessional(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: professionalKeys.all }),
  })
}

export function useProfessionalHours(professionalId: number) {
  return useQuery({
    queryKey: professionalKeys.hours(professionalId),
    queryFn: () => fetchProfessionalHours(professionalId),
  })
}

export function useUpdateProfessionalHours(professionalId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (hours: ProfessionalHourWeekdayPatch[]) =>
      updateProfessionalHours(professionalId, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: professionalKeys.hours(professionalId) })
      // Hours overrides change bookability — the availability query must not
      // keep serving slots computed under the old schedule.
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
