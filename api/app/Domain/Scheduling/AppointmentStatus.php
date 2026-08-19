<?php

namespace App\Domain\Scheduling;

/**
 * Lifecycle: `Scheduled` (initial) -> `Confirmed` | `Cancelled` | `Completed`;
 * `Confirmed` -> `Cancelled` | `Completed`. `Cancelled` and `Completed` are
 * terminal — no outgoing transitions, including to themselves.
 */
enum AppointmentStatus: string
{
    case Scheduled = 'scheduled';
    case Confirmed = 'confirmed';
    case Cancelled = 'cancelled';
    case Completed = 'completed';

    /**
     * @return array<self>
     */
    private function allowedTargets(): array
    {
        return match ($this) {
            self::Scheduled => [self::Confirmed, self::Cancelled, self::Completed],
            self::Confirmed => [self::Cancelled, self::Completed],
            self::Cancelled, self::Completed => [],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->allowedTargets(), true);
    }
}
