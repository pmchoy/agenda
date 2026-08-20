import { api } from '@/lib/api-client'
import type { Setting } from '@/types/api'

export async function fetchSettings(): Promise<Setting[]> {
  const { data } = await api.get<{ data: Setting[] }>('/settings')
  return data.data
}

/** Partial key => value patch, per `UpdateSettingsRequest`. */
export async function updateSettings(settings: Record<string, string>): Promise<Setting[]> {
  const { data } = await api.put<{ data: Setting[] }>('/settings', { settings })
  return data.data
}
