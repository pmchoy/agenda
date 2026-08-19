<?php

namespace App\Domain\Scheduling\Exceptions;

use RuntimeException;

/**
 * Thrown when a booking attempt falls outside the professional's resolved
 * working hours for the requested day.
 */
final class OutsideWorkingHoursException extends RuntimeException {}
