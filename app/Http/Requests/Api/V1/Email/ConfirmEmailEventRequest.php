<?php

namespace App\Http\Requests\Api\V1\Email;

use App\Enums\ApplicationStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfirmEmailEventRequest extends FormRequest
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
            'action_type' => ['sometimes', 'string', 'in:none,create_interview,update_status'],
            'interview_details' => ['required_if:action_type,create_interview', 'array'],
            'interview_details.job_application_id' => ['nullable', 'string', 'uuid'],
            'interview_details.interview_type' => ['nullable', 'string', 'max:40'],
            'interview_details.start_at' => ['required_if:action_type,create_interview', 'date'],
            'interview_details.end_at' => ['nullable', 'date', 'after:interview_details.start_at'],
            'interview_details.timezone' => ['nullable', 'string', 'timezone:all'],
            'interview_details.meeting_url' => ['nullable', 'url', 'max:1000'],
            'interview_details.location' => ['nullable', 'string', 'max:255'],
            'interview_details.notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['required_if:action_type,update_status', 'nullable', Rule::enum(ApplicationStatus::class)],
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
            'action_type.in' => 'Tipe aksi konfirmasi tidak valid.',
            'interview_details.required_if' => 'Rincian interview wajib disertakan untuk aksi create_interview.',
            'interview_details.start_at.required_if' => 'Waktu mulai interview wajib diisi.',
            'interview_details.start_at.date' => 'Format waktu mulai interview tidak valid.',
            'interview_details.end_at.date' => 'Format waktu selesai interview tidak valid.',
            'interview_details.end_at.after' => 'Waktu selesai interview harus setelah waktu mulai.',
            'interview_details.meeting_url.url' => 'Format tautan meeting harus berupa URL yang valid.',
            'status.required_if' => 'Status lamaran baru wajib dipilih untuk aksi update_status.',
            'status.Illuminate\Validation\Rules\Enum' => 'Status lamaran yang dipilih tidak valid.',
        ];
    }
}
