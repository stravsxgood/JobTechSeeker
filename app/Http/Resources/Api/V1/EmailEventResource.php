<?php

namespace App\Http\Resources\Api\V1;

use App\Models\EmailEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin EmailEvent
 */
class EmailEventResource extends JsonResource
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
            'connected_email_account_id' => (string) $this->connected_email_account_id,
            'provider_message_id' => $this->provider_message_id,
            'received_at' => $this->received_at?->toIso8601String(),
            'sender_address' => $this->sender_address,
            'sender_name' => $this->sender_name,
            'subject' => $this->subject,
            'snippet' => $this->snippet,
            'classification' => $this->classification?->value,
            'classification_label' => $this->classification?->label(),
            'extracted_payload' => $this->extracted_payload,
            'uncertainty_notes' => $this->uncertainty_notes,
            'related_application_id' => $this->related_application_id ? (string) $this->related_application_id : null,
            'related_application' => new JobApplicationResource($this->whenLoaded('relatedApplication')),
            'processing_status' => $this->processing_status->value,
            'requires_confirmation' => $this->requires_confirmation,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
