<?php

namespace App\Http\Resources\Api\V1;

use App\Models\ConnectedEmailAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ConnectedEmailAccount
 */
class ConnectedEmailAccountResource extends JsonResource
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
            'provider' => $this->provider,
            'email_address' => $this->email_address,
            'connection_status' => $this->connection_status->value,
            'last_sync_at' => $this->last_sync_at?->toIso8601String(),
            'last_sync_status' => $this->last_sync_status,
            'last_sync_error_category' => $this->last_sync_error_category,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
