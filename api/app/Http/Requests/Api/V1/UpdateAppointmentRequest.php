<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Appointment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'professional_id' => ['nullable', 'integer', 'exists:professionals,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
        ];
    }

    /**
     * `AppointmentService::reschedule()` only supports changing the start
     * time and/or professional — the service on an existing appointment
     * cannot be swapped. If the caller sends a `service_id` that differs
     * from the appointment's current one, reject it explicitly instead of
     * silently ignoring it.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var Appointment $appointment */
            $appointment = $this->route('appointment');

            if ($this->filled('service_id') && (int) $this->input('service_id') !== $appointment->service_id) {
                $validator->errors()->add(
                    'service_id',
                    'Changing the service of an existing appointment is not supported; cancel and rebook instead.',
                );
            }
        });
    }
}
