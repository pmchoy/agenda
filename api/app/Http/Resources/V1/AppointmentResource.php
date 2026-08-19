<?php

namespace App\Http\Resources\V1;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Appointment
 */
class AppointmentResource extends JsonResource
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
            'service_id' => $this->service_id,
            'professional_id' => $this->professional_id,
            'client_id' => $this->client_id,
            'starts_at' => $this->starts_at->toIso8601String(),
            'ends_at' => $this->ends_at->toIso8601String(),
            'status' => $this->status->value,
            'origin' => $this->origin->value,
            'notes' => $this->notes,
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'client' => ClientResource::make($this->whenLoaded('client')),
            'service' => ServiceResource::make($this->whenLoaded('service')),
            'professional' => ProfessionalResource::make($this->whenLoaded('professional')),
        ];
    }
}
