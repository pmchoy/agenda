<?php

namespace App\Http\Requests\Api\V1;

use App\Domain\Shared\PhoneNumber;
use App\Models\Client;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize the phone number to E.164 before validation runs, so the
     * uniqueness check and downstream persistence both see the canonical form.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('phone')) {
            $this->merge(['phone' => PhoneNumber::normalize($this->string('phone')->toString())]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Client $client */
        $client = $this->route('client');

        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:16', Rule::unique('clients', 'phone')->ignore($client->id)],
            'notes' => ['nullable', 'string'],
        ];
    }
}
