<?php

namespace App\Domain\Scheduling\Exceptions;

use RuntimeException;

/**
 * Thrown when an appointment status transition is not allowed by
 * `AppointmentStatus::canTransitionTo()` (e.g. moving out of a terminal
 * state such as Cancelled or Completed).
 */
final class InvalidStatusTransitionException extends RuntimeException {}
