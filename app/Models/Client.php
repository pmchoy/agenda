<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * NOTE: `phone` is not yet cast through `App\Casts\PhoneNumberCast` — that cast
 * ships in Phase 2 (task 2.6) alongside the `PhoneNumber` value object. Until
 * then this column stores/reads the raw string as posted.
 */
#[Fillable(['name', 'phone', 'notes'])]
class Client extends Model
{
    /**
     * @return HasMany<Appointment, $this>
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
