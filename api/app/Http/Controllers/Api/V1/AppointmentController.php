<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Scheduling\AppointmentService;
use App\Domain\Scheduling\Data\BookingRequest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreAppointmentRequest;
use App\Http\Requests\Api\V1\UpdateAppointmentRequest;
use App\Http\Resources\V1\AppointmentResource;
use App\Models\Appointment;
use App\Models\Client;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AppointmentController extends Controller
{
    private const EAGER_LOAD = ['client', 'service', 'professional'];

    public function __construct(private readonly AppointmentService $appointments) {}

    /**
     * List every appointment.
     */
    public function index(): AnonymousResourceCollection
    {
        return AppointmentResource::collection(
            Appointment::query()->with(self::EAGER_LOAD)->orderBy('starts_at')->get()
        );
    }

    /**
     * Two-step booking: the posted slot is never trusted — resolve (or
     * create) the client by normalized phone, then let
     * `AppointmentService::book()` re-validate the slot under lock.
     * `SlotUnavailableException`/`OutsideWorkingHoursException` bubble up
     * to the global 409 mapping in `bootstrap/app.php`.
     */
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $client = Client::firstOrCreate(
            ['phone' => $validated['client']['phone']],
            ['name' => $validated['client']['name']],
        );

        $bookingRequest = new BookingRequest(
            clientId: $client->id,
            serviceId: $validated['service_id'],
            professionalId: $validated['professional_id'],
            startsAt: CarbonImmutable::parse($validated['starts_at']),
            notes: $validated['notes'] ?? null,
        );

        $appointment = $this->appointments->book($bookingRequest);

        return AppointmentResource::make($appointment->load(self::EAGER_LOAD))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Show a single appointment.
     */
    public function show(Appointment $appointment): AppointmentResource
    {
        return AppointmentResource::make($appointment->load(self::EAGER_LOAD));
    }

    /**
     * Reschedule an appointment. `InvalidStatusTransitionException` is not
     * relevant here — overlap/hours re-validation raises
     * `SlotUnavailableException`/`OutsideWorkingHoursException`, both
     * mapped to 409 globally.
     */
    public function update(UpdateAppointmentRequest $request, Appointment $appointment): AppointmentResource
    {
        $newStart = CarbonImmutable::parse($request->string('starts_at')->toString());
        $professionalId = $request->filled('professional_id') ? $request->integer('professional_id') : null;

        $appointment = $this->appointments->reschedule($appointment, $newStart, $professionalId);

        return AppointmentResource::make($appointment->load(self::EAGER_LOAD));
    }

    /**
     * Cancel an appointment. This is a status transition, not a delete —
     * returns `200` with the updated resource (not `204`) so the caller can
     * update its cache from the response instead of refetching.
     */
    public function destroy(Appointment $appointment): AppointmentResource
    {
        $appointment = $this->appointments->cancel($appointment);

        return AppointmentResource::make($appointment->load(self::EAGER_LOAD));
    }
}
