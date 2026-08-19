<?php

namespace Tests\Unit;

use App\Domain\Scheduling\AppointmentStatus;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AppointmentStatusTest extends TestCase
{
    /**
     * Full 4x4 transition matrix. Scheduled is the only initial state;
     * Cancelled and Completed are terminal (no outgoing transitions,
     * including to themselves).
     *
     * @return array<string, array{0: AppointmentStatus, 1: AppointmentStatus, 2: bool}>
     */
    public static function transitionProvider(): array
    {
        return [
            'Scheduled -> Confirmed' => [AppointmentStatus::Scheduled, AppointmentStatus::Confirmed, true],
            'Scheduled -> Cancelled' => [AppointmentStatus::Scheduled, AppointmentStatus::Cancelled, true],
            'Scheduled -> Completed' => [AppointmentStatus::Scheduled, AppointmentStatus::Completed, true],
            'Scheduled -> Scheduled' => [AppointmentStatus::Scheduled, AppointmentStatus::Scheduled, false],

            'Confirmed -> Scheduled' => [AppointmentStatus::Confirmed, AppointmentStatus::Scheduled, false],
            'Confirmed -> Cancelled' => [AppointmentStatus::Confirmed, AppointmentStatus::Cancelled, true],
            'Confirmed -> Completed' => [AppointmentStatus::Confirmed, AppointmentStatus::Completed, true],
            'Confirmed -> Confirmed' => [AppointmentStatus::Confirmed, AppointmentStatus::Confirmed, false],

            'Cancelled -> Scheduled' => [AppointmentStatus::Cancelled, AppointmentStatus::Scheduled, false],
            'Cancelled -> Confirmed' => [AppointmentStatus::Cancelled, AppointmentStatus::Confirmed, false],
            'Cancelled -> Completed' => [AppointmentStatus::Cancelled, AppointmentStatus::Completed, false],
            'Cancelled -> Cancelled' => [AppointmentStatus::Cancelled, AppointmentStatus::Cancelled, false],

            'Completed -> Scheduled' => [AppointmentStatus::Completed, AppointmentStatus::Scheduled, false],
            'Completed -> Confirmed' => [AppointmentStatus::Completed, AppointmentStatus::Confirmed, false],
            'Completed -> Cancelled' => [AppointmentStatus::Completed, AppointmentStatus::Cancelled, false],
            'Completed -> Completed' => [AppointmentStatus::Completed, AppointmentStatus::Completed, false],
        ];
    }

    #[DataProvider('transitionProvider')]
    public function test_can_transition_to_follows_the_lifecycle_matrix(
        AppointmentStatus $from,
        AppointmentStatus $to,
        bool $expected,
    ): void {
        $this->assertSame($expected, $from->canTransitionTo($to));
    }

    public function test_backing_values_are_stable_strings(): void
    {
        $this->assertSame('scheduled', AppointmentStatus::Scheduled->value);
        $this->assertSame('confirmed', AppointmentStatus::Confirmed->value);
        $this->assertSame('cancelled', AppointmentStatus::Cancelled->value);
        $this->assertSame('completed', AppointmentStatus::Completed->value);
    }
}
