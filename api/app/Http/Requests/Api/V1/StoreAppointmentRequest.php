<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Shared\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize the client phone to E.164 before validation runs, so the
     * downstream `Client::firstOrCreate()` lookup always keys on the
     * canonical form.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('client.phone')) {
            $this->merge([
                'client' => array_merge((array) $this->input('client', []), [
                    'phone' => PhoneNumber::normalize((string) $this->input('client.phone')),
                ]),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'professional_id' => ['required', 'integer', 'exists:professionals,id'],
            'starts_at' => ['required', 'date'],
            'client' => ['required', 'array'],
            'client.name' => ['required', 'string', 'max:255'],
            'client.phone' => ['required', 'string', 'max:16'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
