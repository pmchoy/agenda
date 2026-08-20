<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Scheduling\AppointmentStatus;
use App\Domain\Scheduling\Weekday;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AgendaQueryRequest;
use App\Http\Resources\V1\AppointmentResource;
use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class AgendaController extends Controller
{
    /**
     * Return appointments pre-grouped by day, including empty days, so the
     * caller never has to gap-fill a week/day view client-side. Week bounds
     * come exclusively from `Weekday::weekRange()` — never raw Carbon
     * week-boundary helpers, per `tests/Unit/WeekdayConventionTest.php`.
     */
    public function index(AgendaQueryRequest $request): JsonResponse
    {
        $date = CarbonImmutable::parse($request->string('date')->toString());
        $view = $request->string('view')->toString();
        $includeCancelled = $request->boolean('include_cancelled');

        [$from, $to] = $view === 'week'
            ? Weekday::weekRange($date)
            : [$date->startOfDay(), $date->endOfDay()];

        $appointments = Appointment::query()
            ->with(['client', 'service', 'professional'])
            ->whereBetween('starts_at', [$from, $to])
            ->when(! $includeCancelled, fn ($query) => $query->where('status', '!=', AppointmentStatus::Cancelled))
            ->orderBy('starts_at')
            ->get();

        $days = [];
        $cursor = $from->startOfDay();

        while ($cursor->lte($to)) {
            $days[] = $cursor->toDateString();
            $cursor = $cursor->addDay();
        }

        /** @var Collection<string, Collection<int, Appointment>> $grouped */
        $grouped = $appointments->groupBy(fn (Appointment $appointment): string => $appointment->starts_at->toDateString());

        $data = [];

        foreach ($days as $day) {
            $data[$day] = AppointmentResource::collection($grouped->get($day, collect()));
        }

        return response()->json([
            'data' => $data,
            'meta' => [
                'view' => $view,
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'days' => $days,
            ],
        ]);
    }
}
