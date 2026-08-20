<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateBusinessHoursRequest;
use App\Http\Resources\V1\BusinessHourResource;
use App\Models\BusinessHour;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BusinessHoursController extends Controller
{
    /**
     * List the current business hours, one row per weekday.
     */
    public function index(): AnonymousResourceCollection
    {
        return BusinessHourResource::collection(
            BusinessHour::query()->orderBy('weekday')->get()
        );
    }

    /**
     * Replace the full week of business hours in a single call.
     */
    public function update(UpdateBusinessHoursRequest $request): AnonymousResourceCollection
    {
        foreach ($request->validated('hours') as $day) {
            BusinessHour::updateOrCreate(
                ['weekday' => $day['weekday']],
                [
                    'is_closed' => $day['is_closed'],
                    'opens_at' => $day['is_closed'] ? null : $day['opens_at'],
                    'closes_at' => $day['is_closed'] ? null : $day['closes_at'],
                ]
            );
        }

        return BusinessHourResource::collection(
            BusinessHour::query()->orderBy('weekday')->get()
        );
    }
}
