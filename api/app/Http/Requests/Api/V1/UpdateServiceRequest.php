<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Service;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceRequest extends FormRequest
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
        /** @var Service $service */
        $service = $this->route('service');

        return [
            'service_category_id' => ['required', 'integer', 'exists:service_categories,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('services', 'name')
                    ->where('service_category_id', $this->input('service_category_id'))
                    ->ignore($service->id),
            ],
            'duration_minutes' => ['required', 'integer', 'min:1'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
