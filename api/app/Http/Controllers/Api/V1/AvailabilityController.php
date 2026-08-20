<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Scheduling\AvailabilityEngine;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AvailabilitySearchRequest;
use App\Http\Resources\V1\SlotResource;
use App\Models\Professional;
use App\Models\Service;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    public function __construct(private readonly AvailabilityEngine $engine) {}

    /**
     * Search bookable slots for a service on a date, either for one
     * concrete professional (`professional_id={id}`) or across every
     * professional qualified for the service (`professional_id=any`).
     */
    public function index(AvailabilitySearchRequest $request): JsonResponse
    {
        $service = Service::findOrFail($request->integer('service_id'));
        $date = CarbonImmutable::parse($request->string('date')->toString());
        $professionalIdParam = $request->string('professional_id')->toString();

        $slots = $professionalIdParam === 'any'
            ? $this->engine->forAnyProfessional($service, $date)
            : $this->engine->forProfessional($service, Professional::findOrFail((int) $professionalIdParam), $date);

        return response()->json([
            'data' => SlotResource::collection($slots),
            'meta' => [
                'date' => $date->toDateString(),
                'service_id' => $service->id,
                'duration_minutes' => $service->duration_minutes,
                'grid_minutes' => (int) Setting::get('slot_grid_minutes', '15'),
            ],
        ]);
    }
}
