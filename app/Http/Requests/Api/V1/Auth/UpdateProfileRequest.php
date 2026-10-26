<?php

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'timezone' => ['sometimes', 'string', 'timezone:all'],
            'locale' => ['sometimes', 'string', 'max:10'],
            'target_roles' => ['sometimes', 'nullable', 'array'],
            'target_roles.*' => ['string', 'max:100'],
            'preferred_locations' => ['sometimes', 'nullable', 'array'],
            'preferred_locations.*' => ['string', 'max:100'],
            'salary_expectation_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'salary_expectation_max' => ['sometimes', 'nullable', 'numeric', 'min:0', 'gte:salary_expectation_min'],
            'salary_currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'weekly_application_target' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:100'],
            'current_password' => ['sometimes', 'required_with:password', 'current_password'],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ];
    }
}
