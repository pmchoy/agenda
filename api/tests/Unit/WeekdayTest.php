<?php

namespace Tests\Unit;

use App\Domain\Scheduling\Weekday;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class WeekdayTest extends TestCase
{
    /**
     * @return array<string, array{0: string, 1: Weekday}>
     */
    public static function dateProvider(): array
    {
        return [
            'Monday' => ['2026-08-17', Weekday::Monday],
            'Tuesday' => ['2026-08-18', Weekday::Tuesday],
            'Wednesday' => ['2026-08-19', Weekday::Wednesday],
            'Thursday' => ['2026-08-20', Weekday::Thursday],
            'Friday' => ['2026-08-21', Weekday::Friday],
            'Saturday' => ['2026-08-22', Weekday::Saturday],
            'Sunday' => ['2026-08-23', Weekday::Sunday],
        ];
    }

    #[DataProvider('dateProvider')]
    public function test_from_date_maps_iso_weekday(string $date, Weekday $expected): void
    {
        $carbon = CarbonImmutable::parse($date, 'America/Montevideo');

        $this->assertSame($expected, Weekday::fromDate($carbon));
    }

    public function test_week_range_for_a_monday_returns_same_week(): void
    {
        $monday = CarbonImmutable::parse('2026-08-17 10:00:00', 'America/Montevideo');

        [$start, $end] = Weekday::weekRange($monday);

        $this->assertSame('2026-08-17 00:00:00', $start->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-23 23:59:59', $end->format('Y-m-d H:i:s'));
    }

    public function test_week_range_for_a_sunday_still_returns_the_monday_starting_week(): void
    {
        $sunday = CarbonImmutable::parse('2026-08-23 23:00:00', 'America/Montevideo');

        [$start, $end] = Weekday::weekRange($sunday);

        $this->assertSame('2026-08-17 00:00:00', $start->format('Y-m-d H:i:s'));
        $this->assertSame('2026-08-23 23:59:59', $end->format('Y-m-d H:i:s'));
    }

    public function test_week_range_bounds_stay_in_the_given_timezone(): void
    {
        $wednesday = CarbonImmutable::parse('2026-08-19 12:00:00', 'America/Montevideo');

        [$start, $end] = Weekday::weekRange($wednesday);

        $this->assertSame('America/Montevideo', $start->getTimezone()->getName());
        $this->assertSame('America/Montevideo', $end->getTimezone()->getName());
    }
}
