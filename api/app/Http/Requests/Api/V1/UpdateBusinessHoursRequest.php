<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessHoursRequest extends FormRequest
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
     * The full week must be replaced in one call — one row per weekday
     * (1 = Monday .. 7 = Sunday), no partial-week updates.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hours' => ['required', 'array', 'size:7'],
            'hours.*.weekday' => ['required', 'integer', 'between:1,7', 'distinct'],
            'hours.*.is_closed' => ['required', 'boolean'],
            'hours.*.opens_at' => ['required_if:hours.*.is_closed,false', 'nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['required_if:hours.*.is_closed,false', 'nullable', 'date_format:H:i', 'after:hours.*.opens_at'],
        ];
    }
}
