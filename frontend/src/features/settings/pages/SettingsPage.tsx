import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { SettingsForm } from '@/features/settings/components/SettingsForm'
import { useSettings } from '@/features/settings/queries'

export function SettingsPage() {
  const { data: settings, isPending, isError, error, refetch } = useSettings()

  return (
    <div>
      <PageHeader title="Configuración" description="Configuración general de la aplicación." />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!settings && settings.length === 0}
        emptyTitle="No hay configuración definida"
        emptyDescription="La configuración aparecerá aquí una vez que se cargue en el backend."
      >
        {settings && <SettingsForm settings={settings} />}
      </DataState>
    </div>
  )
}
