<?php

namespace Tests\Unit;

use App\Domain\Scheduling\Data\Slot;
use App\Domain\Scheduling\Data\SlotCollection;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class SlotCollectionTest extends TestCase
{
    public function test_it_sorts_slots_by_start_time_ascending(): void
    {
        $later = new Slot(
            CarbonImmutable::parse('2026-08-20 11:00', 'America/Montevideo'),
            CarbonImmutable::parse('2026-08-20 11:30', 'America/Montevideo'),
            1,
            'Ana',
        );
        $earlier = new Slot(
            CarbonImmutable::parse('2026-08-20 09:00', 'America/Montevideo'),
            CarbonImmutable::parse('2026-08-20 09:30', 'America/Montevideo'),
            2,
            'Beto',
        );

        $collection = SlotCollection::fromSlots([$later, $earlier]);

        $this->assertSame(2, $collection->count());
        $this->assertTrue($collection->first()->startsAt->eq($earlier->startsAt));
        $this->assertTrue($collection->last()->startsAt->eq($later->startsAt));
    }
}
