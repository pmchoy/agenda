<?php

use App\Domain\Scheduling\AppointmentService;
use App\Domain\Scheduling\Data\BookingRequest;
use App\Domain\Scheduling\Exceptions\SlotUnavailableException;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

/**
 * Standalone worker used only by AppointmentServiceConcurrencyTest. It
 * bootstraps the full Laravel app in its own OS process — its own real DB
 * connection — so calling AppointmentService::book() here races genuinely
 * against a sibling process. This is the only way to prove the
 * professional-row `lockForUpdate()` mutex actually serializes writers
 * instead of merely asserting sequential logic within one PHP thread.
 *
 * Not a PHPUnit test class, so phpunit.xml's tests/Feature + tests/Unit
 * testsuites never discover it.
 *
 * argv: [1] client_id [2] service_id [3] professional_id [4] starts_at
 */

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';

/** @var Application $app */
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

[, $clientId, $serviceId, $professionalId, $startsAt] = $argv;

$request = new BookingRequest(
    clientId: (int) $clientId,
    serviceId: (int) $serviceId,
    professionalId: (int) $professionalId,
    startsAt: CarbonImmutable::parse($startsAt),
);

try {
    $app->make(AppointmentService::class)->book($request);
    fwrite(STDOUT, 'booked');
    exit(0);
} catch (SlotUnavailableException) {
    fwrite(STDOUT, 'slot_unavailable');
    exit(0);
} catch (Throwable $e) {
    fwrite(STDOUT, 'error:'.get_class($e).':'.$e->getMessage());
    exit(1);
}
