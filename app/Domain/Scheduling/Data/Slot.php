<?php

namespace App\Domain\Scheduling\Data;

use Carbon\CarbonImmutable;

final readonly class Slot
{
    public function __construct(
        public CarbonImmutable $startsAt,
        public CarbonImmutable $endsAt,
        public int $professionalId,
        public string $professionalName,
    ) {}
}
