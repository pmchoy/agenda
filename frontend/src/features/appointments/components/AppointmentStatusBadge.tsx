import { Badge } from '@/components/ui/badge'
import type { AppointmentStatusValue } from '@/types/api'

const LABEL: Record<AppointmentStatusValue, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const VARIANT: Record<AppointmentStatusValue, 'secondary' | 'success' | 'muted' | 'outline'> = {
  scheduled: 'secondary',
  confirmed: 'success',
  cancelled: 'muted',
  completed: 'outline',
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatusValue }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>
}
