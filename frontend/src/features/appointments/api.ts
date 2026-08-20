import axios from 'axios'

import { api, type ApiErrorBody } from '@/lib/api-client'
import type { Appointment, Slot } from '@/types/api'

export type AvailabilityParams = {
  serviceId: number
  professionalId: number | 'any'
  date: string
}

export type AvailabilityMeta = {
  date: string
  service_id: number
  duration_minutes: number
  grid_minutes: number
}

export type AvailabilityResult = {
  slots: Slot[]
  meta: AvailabilityMeta
}

export async function fetchAvailability(params: AvailabilityParams): Promise<AvailabilityResult> {
  const { data } = await api.get<{ data: Slot[]; meta: AvailabilityMeta }>('/availability', {
    params: {
      service_id: params.serviceId,
      professional_id: String(params.professionalId),
      date: params.date,
    },
  })
  return { slots: data.data, meta: data.meta }
}

export type BookAppointmentPayload = {
  service_id: number
  professional_id: number
  starts_at: string
  client: { name: string; phone: string }
  notes?: string | null
}

export async function createAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  const { data } = await api.post<{ data: Appointment }>('/appointments', payload)
  return data.data
}

export async function fetchAppointment(id: number): Promise<Appointment> {
  const { data } = await api.get<{ data: Appointment }>(`/appointments/${id}`)
  return data.data
}

export type RescheduleAppointmentPayload = {
  starts_at: string
  professional_id?: number | null
}

export async function rescheduleAppointment(
  id: number,
  payload: RescheduleAppointmentPayload,
): Promise<Appointment> {
  const { data } = await api.put<{ data: Appointment }>(`/appointments/${id}`, payload)
  return data.data
}

export async function cancelAppointment(id: number): Promise<Appointment> {
  const { data } = await api.delete<{ data: Appointment }>(`/appointments/${id}`)
  return data.data
}

/**
 * `AppointmentService::book()`/`reschedule()` re-validate the overlap/hours
 * invariant under a per-professional row lock — a slot that looked open when
 * the availability grid was fetched can legitimately be gone by the time the
 * form submits (two people booking at once really can hit this). The backend
 * maps that race to `409 {code: 'slot_unavailable' | 'outside_working_hours'}`;
 * the UI must react by clearing the stale slot and re-fetching availability,
 * never by showing a raw error message.
 */
export function isSlotConflictError(error: unknown): boolean {
  return (
    axios.isAxiosError<ApiErrorBody>(error) &&
    error.response?.status === 409 &&
    (error.response.data?.code === 'slot_unavailable' ||
      error.response.data?.code === 'outside_working_hours')
  )
}
