<?php

namespace Tests\Unit;

use App\Domain\Scheduling\AppointmentOrigin;
use PHPUnit\Framework\TestCase;

class AppointmentOriginTest extends TestCase
{
    public function test_backing_values_are_stable_strings(): void
    {
        $this->assertSame('dashboard', AppointmentOrigin::Dashboard->value);
        $this->assertSame('whatsapp', AppointmentOrigin::WhatsApp->value);
    }
}
