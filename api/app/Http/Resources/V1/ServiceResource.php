<?php

namespace App\Http\Resources\V1;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Service
 */
class ServiceResource extends JsonResource
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
            'service_category_id' => $this->service_category_id,
            'name' => $this->name,
            'duration_minutes' => $this->duration_minutes,
            'price' => $this->price,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'category' => ServiceCategoryResource::make($this->whenLoaded('category')),
        ];
    }
}
