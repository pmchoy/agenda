<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
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
     * `settings` is a partial key => value patch — only known keys are
     * validated here; add a rule below whenever a new setting key is
     * introduced.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.slot_grid_minutes' => ['sometimes', 'integer', 'min:5', 'max:120'],
            'settings.reminder_send_time' => ['sometimes', 'date_format:H:i'],
            'settings.confirmation_message_text' => ['sometimes', 'string', 'max:500'],
            'settings.reminder_message_text' => ['sometimes', 'string', 'max:500'],
        ];
    }
}
