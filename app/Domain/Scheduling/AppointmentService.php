<?php

namespace App\Domain\Scheduling;

use App\Domain\Scheduling\Data\BookingRequest;
use App\Domain\Scheduling\Data\TimeWindow;
use App\Domain\Scheduling\Exceptions\InvalidStatusTransitionException;
use App\Domain\Scheduling\Exceptions\OutsideWorkingHoursException;
use App\Domain\Scheduling\Exceptions\SlotUnavailableException;
use App\Models\Appointment;
use App\Models\Professional;
use App\Models\Service;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * The only write path for appointments. Every create/reschedule re-validates
 * the overlap/working-hours invariant under a per-professional row lock —
 * there is no `$force`/`$override` parameter anywhere in this class, for any
 * caller.
 */
final class AppointmentService
{
    public function __construct(private readonly WorkingHoursResolver $resolver) {}

    public function book(BookingRequest $request): Appointment
    {
        return DB::transaction(function () use ($request): Appointment {
            $professional = Professional::whereKey($request->professionalId)->lockForUpdate()->firstOrFail();
            $service = Service::findOrFail($request->serviceId);
            $endsAt = $request->startsAt->addMinutes($service->duration_minutes);
            $window = new TimeWindow($request->startsAt, $endsAt);

            $this->assertBookable($professional->id, $window, excluding: null);

            return Appointment::create([
                'client_id' => $request->clientId,
                'service_id' => $service->id,
                'professional_id' => $professional->id,
                'starts_at' => $request->startsAt,
                'ends_at' => $endsAt,
                'status' => AppointmentStatus::Scheduled,
                'origin' => $request->origin,
                'notes' => $request->notes,
            ]);
        });
    }

    public function reschedule(Appointment $appointment, CarbonImmutable $newStart, ?int $newProfessionalId = null): Appointment
    {
        return DB::transaction(function () use ($appointment, $newStart, $newProfessionalId): Appointment {
            $professionalId = $newProfessionalId ?? $appointment->professional_id;
            $professional = Professional::whereKey($professionalId)->lockForUpdate()->firstOrFail();
            $duration = $appointment->service->duration_minutes;
            $endsAt = $newStart->addMinutes($duration);
            $window = new TimeWindow($newStart, $endsAt);

            $this->assertBookable($professional->id, $window, excluding: $appointment);

            $appointment->update([
                'professional_id' => $professional->id,
                'starts_at' => $newStart,
                'ends_at' => $endsAt,
            ]);

            return $appointment->fresh();
        });
    }

    public function cancel(Appointment $appointment): Appointment
    {
        return $this->transition($appointment, AppointmentStatus::Cancelled);
    }

    public function transition(Appointment $appointment, AppointmentStatus $to): Appointment
    {
        if (! $appointment->status->canTransitionTo($to)) {
            throw new InvalidStatusTransitionException(
                sprintf('Cannot transition appointment %d from %s to %s.', $appointment->id, $appointment->status->value, $to->value)
            );
        }

        $appointment->status = $to;

        if ($to === AppointmentStatus::Cancelled) {
            $appointment->cancelled_at = CarbonImmutable::now();
        }

        $appointment->save();

        return $appointment->fresh();
    }

    /**
     * Shared by book() and reschedule(); $excluding lets a reschedule ignore
     * its own row when checking for overlap against itself.
     */
    private function assertBookable(int $professionalId, TimeWindow $window, ?Appointment $excluding): void
    {
        if ($window->start->lt(CarbonImmutable::now())) {
            throw new SlotUnavailableException('Cannot book a slot that starts in the past.');
        }

        $professional = Professional::findOrFail($professionalId);
        $effectiveWindows = $this->resolver->resolve($professional, $window->start->startOfDay());

        $fitsWithinHours = collect($effectiveWindows)
            ->contains(fn (TimeWindow $effective): bool => $window->isContainedBy($effective));

        if (! $fitsWithinHours) {
            throw new OutsideWorkingHoursException('Requested time falls outside the professional\'s working hours.');
        }

        $busy = Appointment::query()
            ->where('professional_id', $professionalId)
            ->whereDate('starts_at', $window->start->toDateString())
            ->whereIn('status', [AppointmentStatus::Scheduled, AppointmentStatus::Confirmed])
            ->when($excluding !== null, fn ($query) => $query->whereKeyNot($excluding->id))
            ->get(['starts_at', 'ends_at'])
            ->map(fn (Appointment $appointment): TimeWindow => new TimeWindow($appointment->starts_at, $appointment->ends_at));

        if ($window->conflictsWithAny($busy)) {
            throw new SlotUnavailableException('Requested time overlaps an existing appointment.');
        }
    }
}
