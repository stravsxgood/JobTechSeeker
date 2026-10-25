<?php

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'timezone' => $this->timezone ?? 'Asia/Jakarta',
            'locale' => $this->locale ?? 'id-ID',
            'career_preference' => $this->whenLoaded('careerPreference', function () {
                return [
                    'id' => (string) $this->careerPreference->id,
                    'target_roles' => $this->careerPreference->target_roles,
                    'preferred_locations' => $this->careerPreference->preferred_locations,
                    'salary_expectation_min' => $this->careerPreference->salary_expectation_min,
                    'salary_expectation_max' => $this->careerPreference->salary_expectation_max,
                    'salary_currency' => $this->careerPreference->salary_currency,
                    'weekly_application_target' => $this->careerPreference->weekly_application_target,
                ];
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
