<?php

namespace App\Domain\Scheduling\Exceptions;

use RuntimeException;

/**
 * Thrown when a booking attempt conflicts with an existing appointment for
 * the same professional. The slot was valid at search time but is no
 * longer available by the time the booking is confirmed.
 */
final class SlotUnavailableException extends RuntimeException {}
