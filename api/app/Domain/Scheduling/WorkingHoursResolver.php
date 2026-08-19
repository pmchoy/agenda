<?php

namespace App\Domain\Scheduling;

use App\Domain\Scheduling\Data\TimeWindow;
use App\Models\BusinessHour;
use App\Models\Professional;
use App\Models\ProfessionalHour;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Resolves the effective open windows for a professional on a date.
 *
 * Day-level replace: any `professional_hours` row for that professional and
 * weekday fully replaces base `business_hours` for that day — including a
 * lone `is_closed` row, which closes the day even though the base schedule
 * is open. Absence of any override row means "follow base", never "closed".
 */
final class WorkingHoursResolver
{
    /**
     * @return list<TimeWindow>
     */
    public function resolve(Professional $professional, CarbonImmutable $date): array
    {
        $weekday = Weekday::fromDate($date);

        $overrideRows = ProfessionalHour::query()
            ->where('professional_id', $professional->id)
            ->where('weekday', $weekday->value)
            ->get();

        if ($overrideRows->isNotEmpty()) {
            return $this->windowsFromRows($overrideRows, $date);
        }

        $baseRows = BusinessHour::query()
            ->where('weekday', $weekday->value)
            ->get();

        return $this->windowsFromRows($baseRows, $date);
    }

    /**
     * @param  Collection<int, BusinessHour|ProfessionalHour>  $rows
     * @return list<TimeWindow>
     */
    private function windowsFromRows(Collection $rows, CarbonImmutable $date): array
    {
        if ($rows->contains(fn (BusinessHour|ProfessionalHour $row): bool => $row->is_closed)) {
            return [];
        }

        return $rows
            ->map(fn (BusinessHour|ProfessionalHour $row): TimeWindow => new TimeWindow(
                CarbonImmutable::parse($date->toDateString().' '.$row->opens_at),
                CarbonImmutable::parse($date->toDateString().' '.$row->closes_at),
            ))
            ->sortBy(fn (TimeWindow $window): int => $window->start->getTimestamp())
            ->values()
            ->all();
    }
}
