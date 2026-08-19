<?php

namespace App\Http\Resources\V1;

use App\Models\BusinessHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BusinessHour
 */
class BusinessHourResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'weekday' => $this->weekday->value,
            'opens_at' => $this->opens_at,
            'closes_at' => $this->closes_at,
            'is_closed' => $this->is_closed,
        ];
    }
}
