<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * NOTE: `weekday` is not yet cast through `App\Domain\Scheduling\Weekday` —
 * that backed enum ships in Phase 2 (task 2.2). Until then this column
 * reads/writes as a raw integer (1 = Monday .. 7 = Sunday, ISO-8601).
 */
#[Fillable(['weekday', 'opens_at', 'closes_at', 'is_closed'])]
class BusinessHour extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'is_closed' => 'boolean',
        ];
    }
}
