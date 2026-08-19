<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * NOTE: `status`/`origin` are not yet cast through the
 * `App\Domain\Scheduling\AppointmentStatus` / `AppointmentOrigin` backed
 * enums — those ship in Phase 2 (task 2.8). Until then these columns
 * read/write as raw strings.
 */
#[Fillable(['client_id', 'service_id', 'professional_id', 'starts_at', 'ends_at', 'status', 'origin', 'notes', 'cancelled_at'])]
class Appointment extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'immutable_datetime',
            'ends_at' => 'immutable_datetime',
            'cancelled_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * @return BelongsTo<Service, $this>
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * @return BelongsTo<Professional, $this>
     */
    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }
}
