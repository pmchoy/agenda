<?php

namespace App\Domain\Scheduling\Data;

use Carbon\CarbonImmutable;

/**
 * A half-open interval [start, end). Two windows that only touch at a
 * boundary (e.g. 10:00-10:30 and 10:30-11:00) do NOT overlap.
 */
final readonly class TimeWindow
{
    public function __construct(
        public CarbonImmutable $start,
        public CarbonImmutable $end,
    ) {}

    public function overlaps(TimeWindow $other): bool
    {
        return $this->start->lt($other->end) && $other->start->lt($this->end);
    }

    /**
     * @param  iterable<TimeWindow>  $others
     */
    public function conflictsWithAny(iterable $others): bool
    {
        foreach ($others as $other) {
            if ($this->overlaps($other)) {
                return true;
            }
        }

        return false;
    }

    public function isContainedBy(TimeWindow $window): bool
    {
        return $this->start->gte($window->start) && $this->end->lte($window->end);
    }

    public function durationMinutes(): int
    {
        return $this->start->diffInMinutes($this->end);
    }
}
