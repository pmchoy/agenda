import type { Professional } from '@/types/api'

/**
 * Professionals qualified for a service, active only, ordered the same way
 * `AvailabilityEngine::forAnyProfessional()` breaks "no preference" ties —
 * priority ascending, then id ascending (see `sdd/scheduling-core/design`).
 * Used to populate the booking flow's professional picker so its order
 * matches what the engine would actually assign, and to keep an inactive or
 * unqualified professional from ever being offered as a choice.
 */
export function qualifiedProfessionals(
  professionals: Professional[],
  serviceId: number | null,
): Professional[] {
  if (serviceId === null) return []

  return professionals
    .filter((professional) => professional.is_active && professional.service_ids?.includes(serviceId))
    .sort((a, b) => a.priority - b.priority || a.id - b.id)
}
