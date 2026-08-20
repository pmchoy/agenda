import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { qualifiedProfessionals } from '@/features/appointments/lib'
import { useCategories, useServices } from '@/features/catalog/queries'
import { useProfessionals } from '@/features/professionals/queries'
import { todayInMontevideo } from '@/lib/datetime'

export type BookingSelection = {
  categoryId: number | null
  serviceId: number
  professionalId: number | 'any'
  date: string
}

type BookingStepOneProps = {
  initial?: Partial<BookingSelection>
  onNext: (selection: BookingSelection) => void
}

/**
 * Step 1: category → service → professional (or an explicit "no preference")
 * → date. Plain local state, not react-hook-form — this is a narrowing
 * selection that gates step 2's real search, not a persisted record.
 */
export function BookingStepOne({ initial, onNext }: BookingStepOneProps) {
  const { data: categories } = useCategories()
  const { data: services } = useServices()
  const { data: professionals } = useProfessionals()

  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [serviceId, setServiceId] = useState<number | null>(initial?.serviceId ?? null)
  const [professionalId, setProfessionalId] = useState<number | 'any'>(initial?.professionalId ?? 'any')
  const [date, setDate] = useState(initial?.date ?? todayInMontevideo())

  const filteredServices = useMemo(() => {
    if (!services) return []
    return categoryId ? services.filter((service) => service.service_category_id === categoryId) : services
  }, [services, categoryId])

  const eligibleProfessionals = useMemo(
    () => qualifiedProfessionals(professionals ?? [], serviceId),
    [professionals, serviceId],
  )

  const canSubmit = serviceId !== null && date !== ''

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (serviceId === null || !canSubmit) return
        onNext({ categoryId, serviceId, professionalId, date })
      }}
    >
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={categoryId ? String(categoryId) : 'all'}
          onValueChange={(value) => {
            setCategoryId(value === 'all' ? null : Number(value))
            setServiceId(null)
            setProfessionalId('any')
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Cualquier categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier categoría</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Servicio</Label>
        <Select
          value={serviceId !== null ? String(serviceId) : ''}
          onValueChange={(value) => {
            setServiceId(Number(value))
            setProfessionalId('any')
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Elija un servicio" />
          </SelectTrigger>
          <SelectContent>
            {filteredServices.map((service) => (
              <SelectItem key={service.id} value={String(service.id)}>
                {service.name} · {service.duration_minutes} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Profesional</Label>
        <Select
          value={String(professionalId)}
          onValueChange={(value) => setProfessionalId(value === 'any' ? 'any' : Number(value))}
          disabled={serviceId === null}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sin preferencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Sin preferencia</SelectItem>
            {eligibleProfessionals.map((professional) => (
              <SelectItem key={professional.id} value={String(professional.id)}>
                {professional.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          &quot;Sin preferencia&quot; busca entre todos los profesionales habilitados y muestra
          exactamente con quién sería cada horario disponible.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-date">Fecha</Label>
        <Input
          id="booking-date"
          type="date"
          min={todayInMontevideo()}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canSubmit}>
          Buscar horarios disponibles
        </Button>
      </div>
    </form>
  )
}
