<?php

namespace App\Domain\Scheduling;

use App\Domain\Scheduling\Data\Slot;
use App\Domain\Scheduling\Data\SlotCollection;
use App\Domain\Scheduling\Data\TimeWindow;
use App\Models\Appointment;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Setting;
use Carbon\CarbonImmutable;

/**
 * Computes bookable slots for a service on a date, either for one concrete
 * professional or across every professional qualified for the service
 * ("no preference"). Every returned Slot always carries a concrete
 * professionalId — the "no preference" ambiguity is resolved here, before
 * any booking attempt.
 */
final class AvailabilityEngine
{
    public function __construct(private readonly WorkingHoursResolver $resolver) {}

    public function forProfessional(Service $service, Professional $professional, CarbonImmutable $date): SlotCollection
    {
        $now = CarbonImmutable::now();

        if ($date->startOfDay()->lt($now->startOfDay())) {
            return SlotCollection::fromSlots([]);
        }

        $windows = $this->resolver->resolve($professional, $date);

        if ($windows === []) {
            return SlotCollection::fromSlots([]);
        }

        $busy = $this->busyWindowsFor($professional, $date);
        $grid = (int) Setting::get('slot_grid_minutes', '15');
        $duration = $service->duration_minutes;
        $midnight = $date->startOfDay();
        $earliest = $date->isToday() ? $now : $midnight;

        $slots = [];

        foreach ($windows as $window) {
            $floor = $window->start->gt($earliest) ? $window->start : $earliest;
            $candidate = $this->firstGridAlignedAtOrAfter($midnight, $floor, $grid);

            while (true) {
                $candidateEnd = $candidate->addMinutes($duration);

                if ($candidateEnd->gt($window->end)) {
                    break;
                }

                $candidateWindow = new TimeWindow($candidate, $candidateEnd);

                if (! $candidateWindow->conflictsWithAny($busy)) {
                    $slots[] = new Slot($candidate, $candidateEnd, $professional->id, $professional->name);
                }

                $candidate = $candidate->addMinutes($grid);
            }
        }

        return SlotCollection::fromSlots($slots);
    }

    public function forAnyProfessional(Service $service, CarbonImmutable $date): SlotCollection
    {
        $professionals = $service->professionals()
            ->where('is_active', true)
            ->orderBy('priority')
            ->orderBy('professionals.id')
            ->get();

        $claimedStarts = [];
        $slots = [];

        foreach ($professionals as $professional) {
            foreach ($this->forProfessional($service, $professional, $date) as $slot) {
                $key = $slot->startsAt->getTimestamp();

                if (isset($claimedStarts[$key])) {
                    continue;
                }

                $claimedStarts[$key] = true;
                $slots[] = $slot;
            }
        }

        return SlotCollection::fromSlots($slots);
    }

    /**
     * One query per professional per date — never per candidate slot.
     *
     * @return list<TimeWindow>
     */
    private function busyWindowsFor(Professional $professional, CarbonImmutable $date): array
    {
        return Appointment::query()
            ->where('professional_id', $professional->id)
            ->whereDate('starts_at', $date->toDateString())
            ->whereIn('status', [AppointmentStatus::Scheduled, AppointmentStatus::Confirmed])
            ->get(['starts_at', 'ends_at'])
            ->map(fn (Appointment $appointment): TimeWindow => new TimeWindow($appointment->starts_at, $appointment->ends_at))
            ->all();
    }

    /**
     * Grid points are anchored to local midnight, not to the window start,
     * so slots land on round times even when a window opens off-grid.
     */
    private function firstGridAlignedAtOrAfter(CarbonImmutable $midnight, CarbonImmutable $floor, int $gridMinutes): CarbonImmutable
    {
        $minutesFromMidnight = $midnight->diffInSeconds($floor) / 60;
        $steps = (int) ceil($minutesFromMidnight / $gridMinutes);

        return $midnight->addMinutes($steps * $gridMinutes);
    }
}
