<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfessionalHoursRequest extends FormRequest
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
     * Tri-state per weekday: `inherit` (follow business hours — deletes any
     * existing override), `closed` (override closed), `open` (override open,
     * requires `opens_at`/`closes_at`). Only the weekdays being changed need
     * to be included — this is a partial patch, unlike business hours' full
     * 7-day replace.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hours' => ['required', 'array', 'max:7'],
            'hours.*.weekday' => ['required', 'integer', 'between:1,7', 'distinct'],
            'hours.*.state' => ['required', 'in:inherit,open,closed'],
            'hours.*.opens_at' => ['required_if:hours.*.state,open', 'nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['required_if:hours.*.state,open', 'nullable', 'date_format:H:i', 'after:hours.*.opens_at'],
        ];
    }
}
