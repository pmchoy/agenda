import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DataState } from '@/components/layout/DataState'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Switch } from '@/components/ui/switch'
import type { AgendaView } from '@/features/agenda/api'
import { DayAgenda } from '@/features/agenda/components/DayAgenda'
import { WeekAgenda } from '@/features/agenda/components/WeekAgenda'
import { useAgenda } from '@/features/agenda/queries'
import { addDays, formatDateLabel, todayInMontevideo } from '@/lib/datetime'
import { cn } from '@/lib/utils'

/**
 * Daily/weekly agenda — both list-based views, never a calendar-grid widget
 * (deliberate design decision, see `sdd/scheduling-core/design`). State
 * lives in the URL (`?view=day|week&date=&include_cancelled=`) so the agenda
 * is bookmarkable and survives a refresh, matching the booking flow's
 * GET-based step convention.
 */
export function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view: AgendaView = searchParams.get('view') === 'week' ? 'week' : 'day'
  const date = searchParams.get('date') ?? todayInMontevideo()
  const includeCancelled = searchParams.get('include_cancelled') === 'true'

  const agenda = useAgenda({ view, date, includeCancelled })

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next)
  }

  function step(direction: -1 | 1) {
    setParam('date', addDays(date, direction * (view === 'week' ? 7 : 1)))
  }

  const viewLabels: Record<AgendaView, string> = { day: 'Día', week: 'Semana' }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description={view === 'week' ? 'La semana de un vistazo, de lunes a domingo.' : formatDateLabel(date)}
        actions={
          <Button asChild>
            <Link to="/appointments/new">
              <Plus /> Nuevo turno
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-md border border-border p-1">
          {(['day', 'week'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setParam('view', value)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                view === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {viewLabels[value]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label="Anterior">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setParam('date', todayInMontevideo())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={() => step(1)} aria-label="Siguiente">
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="include-cancelled"
            checked={includeCancelled}
            onCheckedChange={(checked) => setParam('include_cancelled', String(checked))}
          />
          <Label htmlFor="include-cancelled" className="text-sm font-normal text-muted-foreground">
            Mostrar cancelados
          </Label>
        </div>
      </div>

      <DataState
        isLoading={agenda.isPending}
        isError={agenda.isError}
        error={agenda.error}
        onRetry={() => void agenda.refetch()}
        isEmpty={false}
      >
        {agenda.data &&
          (view === 'day' ? (
            <DayAgenda appointments={agenda.data.days[date] ?? []} />
          ) : (
            <WeekAgenda days={agenda.data.days} order={agenda.data.meta.days} />
          ))}
      </DataState>
    </div>
  )
}
