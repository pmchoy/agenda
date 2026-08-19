<?php

namespace App\Domain\Scheduling;

/**
 * Where a booking originated. `Dashboard` covers the encargado's manual
 * bookings; `WhatsApp` is reserved for the Phase 3 bot integration.
 */
enum AppointmentOrigin: string
{
    case Dashboard = 'dashboard';
    case WhatsApp = 'whatsapp';
}
