<?php

namespace App\Http\Requests\Api\V1\Ai;

use Illuminate\Foundation\Http\FormRequest;

class InterviewPrepRequest extends FormRequest
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
            'job_title' => ['required', 'string', 'max:255'],
            'job_url' => ['required', 'url', 'max:1000'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'job_description' => ['nullable', 'string', 'max:10000'],
            'application_id' => ['nullable', 'uuid'],
            'interview_focus' => ['nullable', 'string', 'in:all,technical,behavioral,hr'],
        ];
    }
}
