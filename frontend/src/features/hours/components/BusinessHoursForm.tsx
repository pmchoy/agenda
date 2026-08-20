import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUpdateBusinessHours } from '@/features/hours/queries'
import { extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { BusinessHour } from '@/types/api'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

type DayRow = {
  weekday: number
  is_closed: boolean
  opens_at: string
  closes_at: string
}

function buildRows(hours: BusinessHour[]): DayRow[] {
  return WEEKDAYS.map(({ value }) => {
    const day = hours.find((row) => row.weekday === value)
    return {
      weekday: value,
      is_closed: day?.is_closed ?? false,
      opens_at: day?.opens_at ?? '09:00',
      closes_at: day?.closes_at ?? '18:00',
    }
  })
}

/** Bulk 7-weekday editor. The API requires the full week in one call
 * (`UpdateBusinessHoursRequest`'s `size:7` rule) — this always submits all 7
 * rows, never a partial patch. */
export function BusinessHoursForm({ hours }: { hours: BusinessHour[] }) {
  const [rows, setRows] = useState<DayRow[]>(() => buildRows(hours))
  const updateHours = useUpdateBusinessHours()

  useEffect(() => {
    setRows(buildRows(hours))
  }, [hours])

  function updateRow(weekday: number, patch: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)))
  }

  function handleSave() {
    const hasInvalidWindow = rows.some(
      (row) => !row.is_closed && row.opens_at >= row.closes_at,
    )
    if (hasInvalidWindow) {
      toast.error('La hora de cierre debe ser posterior a la hora de apertura en todos los días abiertos.')
      return
    }

    updateHours.mutate(
      rows.map((row) => ({
        weekday: row.weekday,
        is_closed: row.is_closed,
        opens_at: row.is_closed ? null : row.opens_at,
        closes_at: row.is_closed ? null : row.closes_at,
      })),
      { onSuccess: () => toast.success('Horario comercial actualizado.') },
    )
  }

  return (
    <div className="space-y-4">
      {updateHours.isError && !hasFieldErrors(updateHours.error) && (
        <Alert variant="destructive">
          <AlertDescription>{extractErrorMessage(updateHours.error)}</AlertDescription>
        </Alert>
      )}

      <div className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => (
          <div
            key={row.weekday}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="w-28 shrink-0 font-medium text-foreground">
              {WEEKDAYS.find((day) => day.value === row.weekday)?.label}
            </span>

            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <Switch
                checked={!row.is_closed}
                onCheckedChange={(checked) => updateRow(row.weekday, { is_closed: !checked })}
              />
              {row.is_closed ? 'Cerrado' : 'Abierto'}
            </label>

            {row.is_closed ? (
              <span className="text-sm text-muted-foreground sm:w-[17.5rem]">Cerrado todo el día</span>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={row.opens_at}
                  onChange={(event) => updateRow(row.weekday, { opens_at: event.target.value })}
                  className="w-32"
                />
                <span className="text-muted-foreground">a</span>
                <Input
                  type="time"
                  value={row.closes_at}
                  onChange={(event) => updateRow(row.weekday, { closes_at: event.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateHours.isPending}>
          {updateHours.isPending && <Loader2 className="animate-spin" />}
          Guardar horario comercial
        </Button>
      </div>
    </div>
  )
}
