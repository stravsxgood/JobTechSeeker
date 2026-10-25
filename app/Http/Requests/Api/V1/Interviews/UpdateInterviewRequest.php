<?php

namespace App\Http\Requests\Api\V1\Interviews;

use App\Enums\InterviewStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInterviewRequest extends FormRequest
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
        return [
            'interview_type' => ['sometimes', 'string', 'max:40'],
            'start_at' => ['sometimes', 'date'],
            'end_at' => ['sometimes', 'date', 'after:start_at'],
            'timezone' => ['nullable', 'string', 'timezone:all'],
            'meeting_url' => ['nullable', 'url', 'max:1000'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(InterviewStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * Get custom error messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'end_at.after' => 'Waktu selesai harus setelah waktu mulai interview.',
            'timezone.timezone' => 'Format zona waktu tidak valid.',
            'meeting_url.url' => 'Format tautan meeting harus berupa URL yang valid.',
            'status.Illuminate\Validation\Rules\Enum' => 'Status interview tidak valid.',
        ];
    }
}
