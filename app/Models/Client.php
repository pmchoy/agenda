<?php

namespace App\Models;

use App\Casts\PhoneNumberCast;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'phone', 'notes'])]
class Client extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'phone' => PhoneNumberCast::class,
        ];
    }

    /**
     * @return HasMany<Appointment, $this>
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
