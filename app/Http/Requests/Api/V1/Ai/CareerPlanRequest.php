<?php

namespace App\Http\Requests\Api\V1\Ai;

use Illuminate\Foundation\Http\FormRequest;

class CareerPlanRequest extends FormRequest
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
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'target_role' => ['required', 'string', 'max:255'],
            'duration_months' => ['required', 'integer', 'in:3,5'],
            'cv_text' => ['nullable', 'string', 'max:10000'],
            'current_skills' => ['nullable', 'array'],
            'current_skills.*' => ['string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'application_id' => ['nullable', 'uuid'],
        ];
    }
}
