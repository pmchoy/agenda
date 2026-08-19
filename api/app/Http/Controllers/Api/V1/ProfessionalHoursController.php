<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateProfessionalHoursRequest;
use App\Http\Resources\V1\ProfessionalHourResource;
use App\Models\Professional;
use App\Models\ProfessionalHour;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProfessionalHoursController extends Controller
{
    /**
     * List a professional's weekday overrides. A weekday with no row here
     * simply inherits the base business hours — see WorkingHoursResolver.
     */
    public function index(Professional $professional): AnonymousResourceCollection
    {
        return ProfessionalHourResource::collection(
            $professional->hours()->orderBy('weekday')->get()
        );
    }

    /**
     * Apply a tri-state per-weekday patch of overrides for a professional.
     *
     * This endpoint enforces at most one override row per weekday. It does
     * not touch weekdays absent from the payload.
     */
    public function update(UpdateProfessionalHoursRequest $request, Professional $professional): AnonymousResourceCollection
    {
        foreach ($request->validated('hours') as $day) {
            match ($day['state']) {
                'inherit' => ProfessionalHour::query()
                    ->where('professional_id', $professional->id)
                    ->where('weekday', $day['weekday'])
                    ->delete(),
                'closed' => ProfessionalHour::updateOrCreate(
                    ['professional_id' => $professional->id, 'weekday' => $day['weekday']],
                    ['is_closed' => true, 'opens_at' => null, 'closes_at' => null],
                ),
                'open' => ProfessionalHour::updateOrCreate(
                    ['professional_id' => $professional->id, 'weekday' => $day['weekday']],
                    ['is_closed' => false, 'opens_at' => $day['opens_at'], 'closes_at' => $day['closes_at']],
                ),
            };
        }

        return ProfessionalHourResource::collection(
            $professional->hours()->orderBy('weekday')->get()
        );
    }
}
