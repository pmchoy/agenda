import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchBusinessHours,
  updateBusinessHours,
  type BusinessHourWeekdayPatch,
} from '@/features/hours/api'

export const businessHoursKeys = {
  all: ['businessHours'] as const,
}

export function useBusinessHours() {
  return useQuery({
    queryKey: businessHoursKeys.all,
    queryFn: fetchBusinessHours,
  })
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (hours: BusinessHourWeekdayPatch[]) => updateBusinessHours(hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessHoursKeys.all })
      // Business hours changes affect every professional that inherits them —
      // stale availability results would offer slots the server now rejects.
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
