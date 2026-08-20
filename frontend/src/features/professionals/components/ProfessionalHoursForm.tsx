import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUpdateProfessionalHours } from '@/features/professionals/queries'
import { extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { ProfessionalHour, ProfessionalHourState } from '@/types/api'

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

type DayRow = {
  weekday: number
  state: ProfessionalHourState
  opens_at: string
  closes_at: string
}

/** Builds the full 7-day tri-state view. A weekday with no override row in
 * the API response means "inherit base business hours" — the resource never
 * returns an explicit `inherit` state, so absence has to be synthesized here. */
function buildRows(overrides: ProfessionalHour[]): DayRow[] {
  return WEEKDAYS.map(({ value }) => {
    const override = overrides.find((row) => row.weekday === value)
    if (!override) {
      return { weekday: value, state: 'inherit', opens_at: '09:00', closes_at: '18:00' }
    }
    return {
      weekday: value,
      state: override.state,
      opens_at: override.opens_at ?? '09:00',
      closes_at: override.closes_at ?? '18:00',
    }
  })
}

export function ProfessionalHoursForm({
  professionalId,
  overrides,
}: {
  professionalId: number
  overrides: ProfessionalHour[]
}) {
  const [rows, setRows] = useState<DayRow[]>(() => buildRows(overrides))
  const updateHours = useUpdateProfessionalHours(professionalId)

  useEffect(() => {
    setRows(buildRows(overrides))
  }, [overrides])

  function updateRow(weekday: number, patch: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)))
  }

  function handleSave() {
    const hasInvalidWindow = rows.some(
      (row) => row.state === 'open' && row.opens_at >= row.closes_at,
    )
    if (hasInvalidWindow) {
      toast.error('Closing time must be after opening time for every open day.')
      return
    }

    updateHours.mutate(
      rows.map((row) => ({
        weekday: row.weekday,
        state: row.state,
        opens_at: row.state === 'open' ? row.opens_at : null,
        closes_at: row.state === 'open' ? row.closes_at : null,
      })),
      {
        onSuccess: () => toast.success('Hours updated.'),
      },
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        &quot;Inherit&quot; follows the salon&apos;s business hours for that day. Choose
        &quot;Closed&quot; to override a normally-open day as off, or &quot;Open&quot; to set
        custom hours just for this professional.
      </p>

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

            <Select
              value={row.state}
              onValueChange={(value) => updateRow(row.weekday, { state: value as ProfessionalHourState })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inherit">Inherit</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {row.state === 'open' ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={row.opens_at}
                  onChange={(event) => updateRow(row.weekday, { opens_at: event.target.value })}
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={row.closes_at}
                  onChange={(event) => updateRow(row.weekday, { closes_at: event.target.value })}
                  className="w-32"
                />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground sm:w-[17.5rem]">
                {row.state === 'inherit' ? 'Follows business hours' : 'Closed all day'}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateHours.isPending}>
          {updateHours.isPending && <Loader2 className="animate-spin" />}
          Save hours
        </Button>
      </div>
    </div>
  )
}
