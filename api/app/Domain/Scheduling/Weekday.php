<?php

namespace App\Domain\Scheduling;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * ISO-8601 weekday: Monday = 1 .. Sunday = 7.
 *
 * This is the single authority for weekday semantics in the app. Callers
 * MUST use `weekRange()` for Monday-start/Sunday-end bounds instead of
 * calling the equivalent Carbon week-boundary helpers directly — enforced
 * by `tests/Unit/WeekdayConventionTest.php`.
 */
enum Weekday: int
{
    case Monday = 1;
    case Tuesday = 2;
    case Wednesday = 3;
    case Thursday = 4;
    case Friday = 5;
    case Saturday = 6;
    case Sunday = 7;

    public static function fromDate(CarbonInterface $date): self
    {
        return self::from($date->isoWeekday());
    }

    public function label(): string
    {
        return match ($this) {
            self::Monday => 'Monday',
            self::Tuesday => 'Tuesday',
            self::Wednesday => 'Wednesday',
            self::Thursday => 'Thursday',
            self::Friday => 'Friday',
            self::Saturday => 'Saturday',
            self::Sunday => 'Sunday',
        };
    }

    /**
     * Monday-start, Sunday-end bounds for the week containing `$date`,
     * in `$date`'s own timezone.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public static function weekRange(CarbonImmutable $date): array
    {
        $daysSinceMonday = self::fromDate($date)->value - self::Monday->value;

        $start = $date->subDays($daysSinceMonday)->startOfDay();
        $end = $start->addDays(6)->endOfDay();

        return [$start, $end];
    }
}
