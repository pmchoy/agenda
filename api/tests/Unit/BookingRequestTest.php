<?php

namespace Tests\Unit;

use App\Domain\Scheduling\AppointmentOrigin;
use App\Domain\Scheduling\Data\BookingRequest;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class BookingRequestTest extends TestCase
{
    public function test_it_exposes_its_constructor_arguments_with_a_concrete_professional_id(): void
    {
        $startsAt = CarbonImmutable::parse('2026-08-20 09:00', 'America/Montevideo');

        $request = new BookingRequest(
            clientId: 1,
            serviceId: 2,
            professionalId: 3,
            startsAt: $startsAt,
        );

        $this->assertSame(1, $request->clientId);
        $this->assertSame(2, $request->serviceId);
        $this->assertSame(3, $request->professionalId);
        $this->assertTrue($startsAt->eq($request->startsAt));
        $this->assertSame(AppointmentOrigin::Dashboard, $request->origin);
        $this->assertNull($request->notes);
    }

    public function test_origin_and_notes_can_be_overridden(): void
    {
        $request = new BookingRequest(
            clientId: 1,
            serviceId: 2,
            professionalId: 3,
            startsAt: CarbonImmutable::parse('2026-08-20 09:00', 'America/Montevideo'),
            origin: AppointmentOrigin::WhatsApp,
            notes: 'First visit',
        );

        $this->assertSame(AppointmentOrigin::WhatsApp, $request->origin);
        $this->assertSame('First visit', $request->notes);
    }
}
