<?php

namespace App\Http\Requests\Api\V1\Applications;

use App\Enums\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class TransitionApplicationStatusRequest extends FormRequest
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
            'status' => ['required', new Enum(ApplicationStatus::class)],
            'notes' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'in:manual,email_confirmed,system'],
        ];
    }
}
