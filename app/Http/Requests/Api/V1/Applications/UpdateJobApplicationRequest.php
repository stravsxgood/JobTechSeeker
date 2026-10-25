<?php

namespace App\Http\Requests\Api\V1\Applications;

use App\Enums\EmploymentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateJobApplicationRequest extends FormRequest
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
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'company_id' => ['sometimes', 'nullable', 'uuid'],
            'job_title' => ['sometimes', 'string', 'max:255'],
            'applied_at' => ['sometimes', 'nullable', 'date'],
            'employment_type' => ['sometimes', 'nullable', new Enum(EmploymentType::class)],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'source' => ['sometimes', 'nullable', 'string', 'max:100'],
            'source_url' => ['sometimes', 'nullable', 'url', 'max:1000'],
            'salary_min' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'salary_max' => ['sometimes', 'nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'salary_currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'follow_up_at' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ];
    }
}
