import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  fetchCategories,
  fetchServices,
  updateCategory,
  updateService,
  type CategoryPayload,
  type ServicePayload,
} from '@/features/catalog/api'

export const catalogKeys = {
  categories: ['categories'] as const,
  services: ['services'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: fetchCategories,
  })
}

export function useServices() {
  return useQuery({
    queryKey: catalogKeys.services,
    queryFn: fetchServices,
  })
}

/** Category CRUD invalidates `['services']` too — `ServiceResource` embeds the
 * full category object, so a renamed/deactivated category must refresh the
 * services list, not just the categories list. */
function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: catalogKeys.categories })
  queryClient.invalidateQueries({ queryKey: catalogKeys.services })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => createCategory(payload),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryPayload }) =>
      updateCategory(id, payload),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ServicePayload) => createService(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.services }),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ServicePayload }) =>
      updateService(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.services }),
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.services }),
  })
}
