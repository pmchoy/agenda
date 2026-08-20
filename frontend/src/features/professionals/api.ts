import { api } from '@/lib/api-client'
import type { Professional, ProfessionalHour } from '@/types/api'

export type ProfessionalPayload = {
  name: string
  phone?: string | null
  is_active?: boolean
  priority?: number
  service_ids?: number[]
}

export type ProfessionalHourWeekdayPatch = {
  weekday: number
  state: 'inherit' | 'open' | 'closed'
  opens_at?: string | null
  closes_at?: string | null
}

export async function fetchProfessionals(): Promise<Professional[]> {
  const { data } = await api.get<{ data: Professional[] }>('/professionals')
  return data.data
}

export async function fetchProfessional(id: number): Promise<Professional> {
  const { data } = await api.get<{ data: Professional }>(`/professionals/${id}`)
  return data.data
}

export async function createProfessional(payload: ProfessionalPayload): Promise<Professional> {
  const { data } = await api.post<{ data: Professional }>('/professionals', payload)
  return data.data
}

export async function updateProfessional(
  id: number,
  payload: ProfessionalPayload,
): Promise<Professional> {
  const { data } = await api.put<{ data: Professional }>(`/professionals/${id}`, payload)
  return data.data
}

export async function deleteProfessional(id: number): Promise<void> {
  await api.delete(`/professionals/${id}`)
}

export async function fetchProfessionalHours(professionalId: number): Promise<ProfessionalHour[]> {
  const { data } = await api.get<{ data: ProfessionalHour[] }>(
    `/professionals/${professionalId}/hours`,
  )
  return data.data
}

export async function updateProfessionalHours(
  professionalId: number,
  hours: ProfessionalHourWeekdayPatch[],
): Promise<ProfessionalHour[]> {
  const { data } = await api.put<{ data: ProfessionalHour[] }>(
    `/professionals/${professionalId}/hours`,
    { hours },
  )
  return data.data
}
