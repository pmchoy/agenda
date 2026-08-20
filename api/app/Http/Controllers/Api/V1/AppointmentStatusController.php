<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Scheduling\AppointmentService;
use App\Domain\Scheduling\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateAppointmentStatusRequest;
use App\Http\Resources\V1\AppointmentResource;
use App\Models\Appointment;

class AppointmentStatusController extends Controller
{
    private const EAGER_LOAD = ['client', 'service', 'professional'];

    public function __construct(private readonly AppointmentService $appointments) {}

    /**
     * Transition an appointment's status. `InvalidStatusTransitionException`
     * bubbles up to the global 409 mapping in `bootstrap/app.php`.
     */
    public function update(UpdateAppointmentStatusRequest $request, Appointment $appointment): AppointmentResource
    {
        $status = AppointmentStatus::from($request->string('status')->toString());

        $appointment = $this->appointments->transition($appointment, $status);

        return AppointmentResource::make($appointment->load(self::EAGER_LOAD));
    }
}
