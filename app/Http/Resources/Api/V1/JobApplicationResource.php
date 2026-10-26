<?php

namespace App\Http\Resources\Api\V1;

use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin JobApplication
 */
class JobApplicationResource extends JsonResource
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
            'job_title' => $this->job_title,
            'company' => new CompanyResource($this->whenLoaded('company')),
            'company_name' => $this->company?->name,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_active' => $this->status->isActive(),
            'is_terminal' => $this->status->isTerminal(),
            'employment_type' => $this->employment_type->value ?? 'full_time',
            'location' => $this->location,
            'description' => $this->description,
            'source' => $this->source,
            'source_url' => $this->source_url,
            'salary_min' => $this->salary_min,
            'salary_max' => $this->salary_max,
            'salary_currency' => $this->salary_currency,
            'applied_at' => $this->applied_at?->format('Y-m-d'),
            'follow_up_at' => $this->follow_up_at?->toIso8601String(),
            'notes' => $this->notes,
            'status_histories' => ApplicationStatusHistoryResource::collection($this->whenLoaded('statusHistories')),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
