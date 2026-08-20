<?php

namespace App\Http\Resources\V1;

use App\Models\Professional;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Professional
 */
class ProfessionalResource extends JsonResource
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
            'name' => $this->name,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'priority' => $this->priority,
            'service_ids' => $this->whenLoaded('services', fn () => $this->services->pluck('id')->values()),
        ];
    }
}
