import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import type { Slot } from '@/types/api'

type SlotGridProps = {
  slots: Slot[]
  selected: Slot | null
  onSelect: (slot: Slot) => void
  showProfessionalName: boolean
}

/**
 * The slot picker is a deliberate button grid, not a calendar-grid widget —
 * every slot is an unambiguous, obviously-clickable target (the booking flow
 * is the single most important screen in this app). When the search was "no
 * preference", each button also surfaces which professional it would
 * actually book with, since the engine resolves that at search time.
 */
export function SlotGrid({ slots, selected, onSelect, showProfessionalName }: SlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => {
        const isSelected =
          selected?.starts_at === slot.starts_at && selected.professional_id === slot.professional_id

        return (
          <Button
            key={`${slot.starts_at}-${slot.professional_id}`}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'h-auto flex-col gap-0.5 py-2',
              isSelected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
            )}
            onClick={() => onSelect(slot)}
          >
            <span className="text-sm font-semibold">{formatTime(slot.starts_at)}</span>
            {showProfessionalName && (
              <span className="text-xs font-normal opacity-80">{slot.professional_name}</span>
            )}
          </Button>
        )
      })}
    </div>
  )
}
