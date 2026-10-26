<?php

namespace App\Http\Resources\Api\V1;

use App\Enums\ApplicationStatus;
use App\Models\ApplicationStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationStatusHistory
 */
class ApplicationStatusHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $statusEnum = ApplicationStatus::tryFrom($this->new_status);

        return [
            'id' => (string) $this->id,
            'previous_status' => $this->previous_status,
            'new_status' => $this->new_status,
            'new_status_label' => $statusEnum?->label() ?? $this->new_status,
            'change_source' => $this->change_source,
            'notes' => $this->notes,
            'actor_user_id' => $this->actor_user_id ? (string) $this->actor_user_id : null,
            'changed_at' => $this->changed_at->toIso8601String(),
        ];
    }
}
