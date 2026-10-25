<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Interview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Interview
 */
class InterviewResource extends JsonResource
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
            'job_application_id' => (string) $this->job_application_id,
            'job_title' => $this->jobApplication?->job_title,
            'company_name' => $this->jobApplication?->company?->name,
            'company' => new CompanyResource($this->whenLoaded('jobApplication', fn () => $this->jobApplication?->company)),
            'interview_type' => $this->interview_type,
            'start_at' => $this->start_at->toIso8601String(),
            'end_at' => $this->end_at->toIso8601String(),
            'timezone' => $this->timezone ?? 'Asia/Jakarta',
            'meeting_url' => $this->meeting_url,
            'location' => $this->location,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'confirmation_state' => $this->confirmation_state,
            'confirmation_source' => $this->confirmation_source,
            'notes' => $this->notes,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
