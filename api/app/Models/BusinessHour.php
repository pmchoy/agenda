<?php

namespace App\Models;

use App\Domain\Scheduling\Weekday;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['weekday', 'opens_at', 'closes_at', 'is_closed'])]
class BusinessHour extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'weekday' => Weekday::class,
            'is_closed' => 'boolean',
        ];
    }
}
