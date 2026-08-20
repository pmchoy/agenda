import { PageHeader } from '@/components/layout/PageHeader'
import { DataState } from '@/components/layout/DataState'
import { SettingsForm } from '@/features/settings/components/SettingsForm'
import { useSettings } from '@/features/settings/queries'

export function SettingsPage() {
  const { data: settings, isPending, isError, error, refetch } = useSettings()

  return (
    <div>
      <PageHeader title="Settings" description="Application-wide configuration." />

      <DataState
        isLoading={isPending}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isEmpty={!!settings && settings.length === 0}
        emptyTitle="No settings configured"
        emptyDescription="Settings will appear here once seeded on the backend."
      >
        {settings && <SettingsForm settings={settings} />}
      </DataState>
    </div>
  )
}
