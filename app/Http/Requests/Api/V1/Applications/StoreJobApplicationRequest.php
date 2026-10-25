<?php

namespace App\Http\Requests\Api\V1\Applications;

use App\Enums\ApplicationStatus;
use App\Enums\EmploymentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreJobApplicationRequest extends FormRequest
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
            'company_name' => ['required_without:company_id', 'nullable', 'string', 'max:255'],
            'company_id' => ['required_without:company_name', 'nullable', 'uuid'],
            'job_title' => ['required', 'string', 'max:255'],
            'status' => ['required', new Enum(ApplicationStatus::class)],
            'applied_at' => ['nullable', 'date'],
            'employment_type' => ['nullable', new Enum(EmploymentType::class)],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'source' => ['nullable', 'string', 'max:100'],
            'source_url' => ['nullable', 'url', 'max:1000'],
            'salary_min' => ['nullable', 'numeric', 'min:0'],
            'salary_max' => ['nullable', 'numeric', 'min:0', 'gte:salary_min'],
            'salary_currency' => ['nullable', 'string', 'size:3'],
            'follow_up_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
