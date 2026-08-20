<?php

namespace Tests\Unit;

use App\Domain\Scheduling\Data\Slot;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class SlotTest extends TestCase
{
    public function test_it_exposes_its_constructor_arguments(): void
    {
        $startsAt = CarbonImmutable::parse('2026-08-20 09:00', 'America/Montevideo');
        $endsAt = CarbonImmutable::parse('2026-08-20 09:30', 'America/Montevideo');

        $slot = new Slot($startsAt, $endsAt, 7, 'Ana');

        $this->assertTrue($startsAt->eq($slot->startsAt));
        $this->assertTrue($endsAt->eq($slot->endsAt));
        $this->assertSame(7, $slot->professionalId);
        $this->assertSame('Ana', $slot->professionalName);
    }
}
