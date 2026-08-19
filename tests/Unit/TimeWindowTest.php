<?php

namespace Tests\Unit;

use App\Domain\Scheduling\Data\TimeWindow;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class TimeWindowTest extends TestCase
{
    private function window(string $start, string $end): TimeWindow
    {
        return new TimeWindow(
            CarbonImmutable::parse($start, 'America/Montevideo'),
            CarbonImmutable::parse($end, 'America/Montevideo'),
        );
    }

    public function test_overlapping_windows_overlap(): void
    {
        $a = $this->window('2026-08-19 10:00', '2026-08-19 11:00');
        $b = $this->window('2026-08-19 10:30', '2026-08-19 11:30');

        $this->assertTrue($a->overlaps($b));
        $this->assertTrue($b->overlaps($a));
    }

    public function test_back_to_back_windows_do_not_overlap(): void
    {
        $a = $this->window('2026-08-19 10:00', '2026-08-19 10:30');
        $b = $this->window('2026-08-19 10:30', '2026-08-19 11:00');

        $this->assertFalse($a->overlaps($b));
        $this->assertFalse($b->overlaps($a));
    }

    public function test_identical_windows_overlap(): void
    {
        $a = $this->window('2026-08-19 10:00', '2026-08-19 11:00');
        $b = $this->window('2026-08-19 10:00', '2026-08-19 11:00');

        $this->assertTrue($a->overlaps($b));
    }

    public function test_zero_gap_between_end_and_start_does_not_overlap(): void
    {
        $a = $this->window('2026-08-19 09:00', '2026-08-19 09:00');
        $b = $this->window('2026-08-19 09:00', '2026-08-19 10:00');

        $this->assertFalse($a->overlaps($b));
    }

    public function test_window_is_contained_by_a_larger_window(): void
    {
        $inner = $this->window('2026-08-19 10:00', '2026-08-19 10:30');
        $outer = $this->window('2026-08-19 09:00', '2026-08-19 18:00');

        $this->assertTrue($inner->isContainedBy($outer));
        $this->assertFalse($outer->isContainedBy($inner));
    }

    public function test_window_extending_past_the_boundary_is_not_contained(): void
    {
        $candidate = $this->window('2026-08-19 17:45', '2026-08-19 18:15');
        $workingHours = $this->window('2026-08-19 09:00', '2026-08-19 18:00');

        $this->assertFalse($candidate->isContainedBy($workingHours));
    }

    public function test_conflicts_with_any_detects_a_hit_in_a_list(): void
    {
        $candidate = $this->window('2026-08-19 10:00', '2026-08-19 10:30');
        $busy = [
            $this->window('2026-08-19 08:00', '2026-08-19 09:00'),
            $this->window('2026-08-19 10:15', '2026-08-19 10:45'),
        ];

        $this->assertTrue($candidate->conflictsWithAny($busy));
    }

    public function test_conflicts_with_any_is_false_when_no_window_overlaps(): void
    {
        $candidate = $this->window('2026-08-19 10:00', '2026-08-19 10:30');
        $busy = [
            $this->window('2026-08-19 08:00', '2026-08-19 09:00'),
            $this->window('2026-08-19 10:30', '2026-08-19 11:00'),
        ];

        $this->assertFalse($candidate->conflictsWithAny($busy));
    }

    public function test_duration_minutes_computes_the_span(): void
    {
        $window = $this->window('2026-08-19 09:00', '2026-08-19 10:15');

        $this->assertSame(75, $window->durationMinutes());
    }
}
