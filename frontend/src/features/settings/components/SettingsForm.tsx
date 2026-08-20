import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useUpdateSettings } from '@/features/settings/queries'
import { extractErrorMessage, hasFieldErrors } from '@/lib/form-errors'
import type { Setting } from '@/types/api'

/**
 * Presentation metadata for known setting keys. The form itself is fully
 * data-driven off whatever `GET /api/v1/settings` returns — a key with no
 * entry here still renders with a generic label. This is what lets the
 * screen pick up new settings (e.g. reminder timing, message templates) the
 * moment a future backend batch seeds and validates them, with zero
 * frontend changes.
 */
const SETTINGS_METADATA: Record<
  string,
  { label: string; description?: string; type?: 'number' | 'text'; min?: number; max?: number }
> = {
  slot_grid_minutes: {
    label: 'Slot grid (minutes)',
    description: 'Availability search rounds bookable times to this interval.',
    type: 'number',
    min: 5,
    max: 120,
  },
}

function labelFor(key: string): string {
  return (
    SETTINGS_METADATA[key]?.label ??
    key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const updateSettings = useUpdateSettings()

  const form = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
  })

  useEffect(() => {
    form.reset(Object.fromEntries(settings.map((setting) => [setting.key, setting.value])))
  }, [settings, form])

  const onSubmit = form.handleSubmit((values) => {
    updateSettings.mutate(values, {
      onSuccess: () => toast.success('Settings updated.'),
    })
  })

  return (
    <div className="space-y-6">
      {updateSettings.isError && !hasFieldErrors(updateSettings.error) && (
        <Alert variant="destructive">
          <AlertDescription>{extractErrorMessage(updateSettings.error)}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {settings.map((setting) => {
            const meta = SETTINGS_METADATA[setting.key]
            return (
              <FormField
                key={setting.key}
                control={form.control}
                name={setting.key}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labelFor(setting.key)}</FormLabel>
                    <FormControl>
                      <Input
                        type={meta?.type === 'number' ? 'number' : 'text'}
                        min={meta?.min}
                        max={meta?.max}
                        {...field}
                      />
                    </FormControl>
                    {meta?.description && (
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )
          })}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettings.isPending}>
              {updateSettings.isPending && <Loader2 className="animate-spin" />}
              Save settings
            </Button>
          </div>
        </form>
      </Form>

      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Reminder timing and confirmation/reminder message templates aren&apos;t configurable here
        yet — they&apos;ll appear automatically once that backend support ships. This screen
        manages every setting the API currently exposes.
      </p>
    </div>
  )
}
