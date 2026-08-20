import { describe, expect, it } from 'vitest'

import { qualifiedProfessionals } from '@/features/appointments/lib'
import type { Professional } from '@/types/api'

const professionals: Professional[] = [
  { id: 3, name: 'Beatriz', phone: null, is_active: true, priority: 1, service_ids: [10] },
  { id: 1, name: 'Ana', phone: null, is_active: true, priority: 1, service_ids: [10, 20] },
  { id: 2, name: 'Carla', phone: null, is_active: false, priority: 0, service_ids: [10] },
  { id: 4, name: 'Diego', phone: null, is_active: true, priority: 2, service_ids: [20] },
]

describe('qualifiedProfessionals', () => {
  it('excludes professionals not qualified for the service', () => {
    const result = qualifiedProfessionals(professionals, 20)
    expect(result.map((professional) => professional.id)).toEqual([1, 4])
  })

  it('excludes inactive professionals even when qualified', () => {
    const result = qualifiedProfessionals(professionals, 10)
    expect(result.some((professional) => professional.id === 2)).toBe(false)
  })

  it('orders ties by priority ascending then id ascending, mirroring forAnyProfessional()', () => {
    const result = qualifiedProfessionals(professionals, 10)
    expect(result.map((professional) => professional.id)).toEqual([1, 3])
  })

  it('returns an empty list before a service has been selected', () => {
    expect(qualifiedProfessionals(professionals, null)).toEqual([])
  })
})
