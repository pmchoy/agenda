<?php

namespace App\Domain\Scheduling\Data;

use App\Domain\Scheduling\AppointmentOrigin;
use Carbon\CarbonImmutable;

final readonly class BookingRequest
{
    public function __construct(
        public int $clientId,
        public int $serviceId,
        public int $professionalId,
        public CarbonImmutable $startsAt,
        public AppointmentOrigin $origin = AppointmentOrigin::Dashboard,
        public ?string $notes = null,
    ) {}
}
