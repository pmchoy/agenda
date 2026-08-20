import { api } from '@/lib/api-client'
import type { Client } from '@/types/api'

export type ClientPayload = {
  name: string
  phone: string
  notes?: string | null
}

export async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<{ data: Client[] }>('/clients')
  return data.data
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const { data } = await api.post<{ data: Client }>('/clients', payload)
  return data.data
}

export async function updateClient(id: number, payload: ClientPayload): Promise<Client> {
  const { data } = await api.put<{ data: Client }>(`/clients/${id}`, payload)
  return data.data
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`)
}
