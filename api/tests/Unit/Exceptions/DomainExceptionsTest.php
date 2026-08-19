<?php

namespace Tests\Unit\Exceptions;

use App\Domain\Scheduling\Exceptions\InvalidStatusTransitionException;
use App\Domain\Scheduling\Exceptions\OutsideWorkingHoursException;
use App\Domain\Scheduling\Exceptions\SlotUnavailableException;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class DomainExceptionsTest extends TestCase
{
    public function test_slot_unavailable_exception_is_a_runtime_exception_with_message(): void
    {
        $exception = new SlotUnavailableException('The requested slot is no longer available.');

        $this->assertInstanceOf(RuntimeException::class, $exception);
        $this->assertSame('The requested slot is no longer available.', $exception->getMessage());
    }

    public function test_invalid_status_transition_exception_is_a_runtime_exception_with_message(): void
    {
        $exception = new InvalidStatusTransitionException('Cannot move from Cancelled to Confirmed.');

        $this->assertInstanceOf(RuntimeException::class, $exception);
        $this->assertSame('Cannot move from Cancelled to Confirmed.', $exception->getMessage());
    }

    public function test_outside_working_hours_exception_is_a_runtime_exception_with_message(): void
    {
        $exception = new OutsideWorkingHoursException('The requested time falls outside working hours.');

        $this->assertInstanceOf(RuntimeException::class, $exception);
        $this->assertSame('The requested time falls outside working hours.', $exception->getMessage());
    }

    public function test_the_three_exceptions_are_distinct_types(): void
    {
        $this->assertNotInstanceOf(InvalidStatusTransitionException::class, new SlotUnavailableException);
        $this->assertNotInstanceOf(OutsideWorkingHoursException::class, new InvalidStatusTransitionException);
        $this->assertNotInstanceOf(SlotUnavailableException::class, new OutsideWorkingHoursException);
    }
}
