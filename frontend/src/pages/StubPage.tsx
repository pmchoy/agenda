import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Placeholder for screens delivered in a later batch (7b: CRUD screens, 7c:
 * booking/agenda screens). Keeps the route map navigable end-to-end while
 * this batch only builds the scaffold, auth, and shared shell.
 */
export function StubPage({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <PageHeader title={title} description="This screen ships in a later batch." />
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {note ?? 'Coming soon.'}
      </div>
    </div>
  )
}
