<?php

namespace App\Http\Resources\V1;

use App\Models\ProfessionalHour;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ProfessionalHour
 */
class ProfessionalHourResource extends JsonResource
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
            'professional_id' => $this->professional_id,
            'weekday' => $this->weekday->value,
            'state' => $this->is_closed ? 'closed' : 'open',
            'opens_at' => $this->opens_at,
            'closes_at' => $this->closes_at,
        ];
    }
}
