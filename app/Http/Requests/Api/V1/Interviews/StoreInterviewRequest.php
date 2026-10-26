<?php

namespace App\Http\Requests\Api\V1\Interviews;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInterviewRequest extends FormRequest
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
            'job_application_id' => ['required', 'string', 'uuid', 'exists:job_applications,id'],
            'interview_type' => ['required', 'string', 'max:40'],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'timezone' => ['nullable', 'string', 'timezone:all'],
            'meeting_url' => ['nullable', 'url', 'max:1000'],
            'location' => ['nullable', 'string', 'max:255'],
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
            'job_application_id.required' => 'ID lamaran kerja wajib diisi.',
            'job_application_id.exists' => 'Lamaran kerja tidak ditemukan.',
            'interview_type.required' => 'Tipe interview wajib diisi (misal: HR Screening, Technical, User).',
            'start_at.required' => 'Waktu mulai interview wajib diisi.',
            'end_at.required' => 'Waktu selesai interview wajib diisi.',
            'end_at.after' => 'Waktu selesai harus setelah waktu mulai interview.',
            'timezone.timezone' => 'Format zona waktu tidak valid.',
            'meeting_url.url' => 'Format tautan meeting harus berupa URL yang valid.',
        ];
    }
}
