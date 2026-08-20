import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelAppointment,
  createAppointment,
  fetchAppointment,
  fetchAvailability,
  rescheduleAppointment,
  type AvailabilityParams,
  type BookAppointmentPayload,
  type RescheduleAppointmentPayload,
} from '@/features/appointments/api'

export const appointmentKeys = {
  detail: (id: number) => ['appointments', id] as const,
}

export const availabilityKeys = {
  search: (params: AvailabilityParams) => ['availability', params] as const,
}

export function useAvailability(params: AvailabilityParams) {
  return useQuery({
    queryKey: availabilityKeys.search(params),
    queryFn: () => fetchAvailability(params),
    // Keeps the previous grid on screen while the user tweaks the date or
    // professional instead of flashing back to the loading skeleton.
    placeholderData: keepPreviousData,
  })
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => fetchAppointment(id),
  })
}

/** Every appointment mutation invalidates both the agenda and availability
 * caches — a booking, reschedule, or cancellation changes what the next
 * availability search or agenda view should show. See the query key
 * convention documented in `sdd/scheduling-core/design-addendum-api-spa`. */
function invalidateBookingCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['agenda'] })
  queryClient.invalidateQueries({ queryKey: ['availability'] })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookAppointmentPayload) => createAppointment(payload),
    onSuccess: () => {
      invalidateBookingCaches(queryClient)
      // The client may have just been `firstOrCreate`'d server-side.
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useRescheduleAppointment(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RescheduleAppointmentPayload) => rescheduleAppointment(id, payload),
    onSuccess: (appointment) => {
      queryClient.setQueryData(appointmentKeys.detail(id), appointment)
      invalidateBookingCaches(queryClient)
    },
  })
}

export function useCancelAppointment(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelAppointment(id),
    onSuccess: (appointment) => {
      queryClient.setQueryData(appointmentKeys.detail(id), appointment)
      invalidateBookingCaches(queryClient)
    },
  })
}
