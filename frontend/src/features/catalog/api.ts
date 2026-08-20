import { api } from '@/lib/api-client'
import type { Service, ServiceCategory } from '@/types/api'

export type CategoryPayload = {
  name: string
  sort_order?: number
  is_active?: boolean
}

export type ServicePayload = {
  service_category_id: number
  name: string
  duration_minutes: number
  price?: number | null
  is_active?: boolean
  sort_order?: number
}

export async function fetchCategories(): Promise<ServiceCategory[]> {
  const { data } = await api.get<{ data: ServiceCategory[] }>('/service-categories')
  return data.data
}

export async function createCategory(payload: CategoryPayload): Promise<ServiceCategory> {
  const { data } = await api.post<{ data: ServiceCategory }>('/service-categories', payload)
  return data.data
}

export async function updateCategory(
  id: number,
  payload: CategoryPayload,
): Promise<ServiceCategory> {
  const { data } = await api.put<{ data: ServiceCategory }>(`/service-categories/${id}`, payload)
  return data.data
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/service-categories/${id}`)
}

export async function fetchServices(): Promise<Service[]> {
  const { data } = await api.get<{ data: Service[] }>('/services')
  return data.data
}

export async function createService(payload: ServicePayload): Promise<Service> {
  const { data } = await api.post<{ data: Service }>('/services', payload)
  return data.data
}

export async function updateService(id: number, payload: ServicePayload): Promise<Service> {
  const { data } = await api.put<{ data: Service }>(`/services/${id}`, payload)
  return data.data
}

export async function deleteService(id: number): Promise<void> {
  await api.delete(`/services/${id}`)
}
