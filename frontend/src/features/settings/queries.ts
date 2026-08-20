import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchSettings, updateSettings } from '@/features/settings/api'

export const settingsKeys = {
  all: ['settings'] as const,
}

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, string>) => updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
      // slot_grid_minutes directly changes the availability grid.
      queryClient.invalidateQueries({ queryKey: ['availability'] })
    },
  })
}
