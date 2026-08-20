import { Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DataState } from '@/components/layout/DataState'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { Switch } from '@/components/ui/switch'
import type { AgendaView } from '@/features/agenda/api'
import { CalendarView } from '@/features/agenda/components/CalendarView'
import { useAgenda } from '@/features/agenda/queries'
import { formatDateLabel, todayInMontevideo } from '@/lib/datetime'

/**
 * Daily/weekly agenda, rendered as a professional calendar view via
 * `react-big-calendar` — day view is one column per professional, week view
 * is a single shared timeline colored per professional. Replaces the earlier
 * list-based agenda (`DayAgenda`/`WeekAgenda`); navigation now comes from
 * react-big-calendar's own toolbar (Hoy/Atrás/Siguiente + Día/Semana) instead
 * of custom prev/next buttons. State still lives in the URL
 * (`?view=day|week&date=&include_cancelled=`) so the agenda stays
 * bookmarkable and survives a refresh, matching the booking flow's
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

      {/* react-big-calendar has no built-in slot for a custom toggle, so this
          sits just above its toolbar rather than inside it. */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <Switch
          id="include-cancelled"
          checked={includeCancelled}
          onCheckedChange={(checked) => setParam('include_cancelled', String(checked))}
        />
        <Label htmlFor="include-cancelled" className="text-sm font-normal text-muted-foreground">
          Mostrar cancelados
        </Label>
      </div>

      <DataState
        isLoading={agenda.isPending}
        isError={agenda.isError}
        error={agenda.error}
        onRetry={() => void agenda.refetch()}
        isEmpty={false}
      >
        {agenda.data && (
          <CalendarView
            view={view}
            date={date}
            days={agenda.data.days}
            weekOrder={agenda.data.meta.days}
            onNavigate={(nextDate) => setParam('date', nextDate)}
            onViewChange={(nextView) => setParam('view', nextView)}
          />
        )}
      </DataState>
    </div>
  )
}
