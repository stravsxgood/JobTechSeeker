<?php

namespace App\Models;

use App\Enums\ConnectionStatus;
use Database\Factories\ConnectedEmailAccountFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConnectedEmailAccount extends Model
{
    /** @use HasFactory<ConnectedEmailAccountFactory> */
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'provider',
        'provider_account_id',
        'email_address',
        'access_token_encrypted',
        'refresh_token_encrypted',
        'token_expires_at',
        'granted_scopes',
        'gmail_history_id',
        'watch_expiration_at',
        'connection_status',
        'last_sync_at',
        'last_sync_status',
        'last_sync_error_category',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'access_token_encrypted',
        'refresh_token_encrypted',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'watch_expiration_at' => 'datetime',
            'last_sync_at' => 'datetime',
            'granted_scopes' => 'array',
            'connection_status' => ConnectionStatus::class,
        ];
    }

    /**
     * The user who connected this email account.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Inbound email events synchronized for this account.
     *
     * @return HasMany<EmailEvent, $this>
     */
    public function emailEvents(): HasMany
    {
        return $this->hasMany(EmailEvent::class);
    }
}
