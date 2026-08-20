import { api } from '@/lib/api-client'
import type { BusinessHour } from '@/types/api'

export type BusinessHourWeekdayPatch = {
  weekday: number
  is_closed: boolean
  opens_at?: string | null
  closes_at?: string | null
}

export async function fetchBusinessHours(): Promise<BusinessHour[]> {
  const { data } = await api.get<{ data: BusinessHour[] }>('/business-hours')
  return data.data
}

export async function updateBusinessHours(
  hours: BusinessHourWeekdayPatch[],
): Promise<BusinessHour[]> {
  const { data } = await api.put<{ data: BusinessHour[] }>('/business-hours', { hours })
  return data.data
}
