<?php

namespace App\Http\Resources\V1;

use App\Domain\Scheduling\Data\Slot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Wraps a domain `Slot` DTO (not an Eloquent model) — every slot always
 * carries a concrete `professional_id`, even when the search was "any".
 *
 * @mixin Slot
 */
class SlotResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Slot $slot */
        $slot = $this->resource;

        return [
            'starts_at' => $slot->startsAt->toIso8601String(),
            'ends_at' => $slot->endsAt->toIso8601String(),
            'professional_id' => $slot->professionalId,
            'professional_name' => $slot->professionalName,
        ];
    }
}
