<?php

namespace App\Models;

use App\Enums\EmailClassification;
use App\Enums\EmailProcessingStatus;
use Database\Factories\EmailEventFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailEvent extends Model
{
    /** @use HasFactory<EmailEventFactory> */
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'connected_email_account_id',
        'provider_message_id',
        'provider_thread_id',
        'received_at',
        'sender_address',
        'sender_name',
        'subject',
        'snippet',
        'classification',
        'extracted_payload',
        'uncertainty_notes',
        'related_application_id',
        'processing_status',
        'requires_confirmation',
        'reviewed_at',
        'reviewed_by_user_id',
        'processed_at',
        'last_error_category',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'processed_at' => 'datetime',
            'classification' => EmailClassification::class,
            'processing_status' => EmailProcessingStatus::class,
            'requires_confirmation' => 'boolean',
            'extracted_payload' => 'array',
        ];
    }

    /**
     * The connected email account source.
     *
     * @return BelongsTo<ConnectedEmailAccount, $this>
     */
    public function connectedEmailAccount(): BelongsTo
    {
        return $this->belongsTo(ConnectedEmailAccount::class);
    }

    /**
     * The application matched to this email.
     *
     * @return BelongsTo<JobApplication, $this>
     */
    public function relatedApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'related_application_id');
    }

    /**
     * User who confirmed/dismissed this triage event.
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    /**
     * Interviews created or updated from this email.
     *
     * @return HasMany<Interview, $this>
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class, 'source_email_event_id');
    }

    /**
     * Notifications generated from this email event.
     *
     * @return HasMany<Notification, $this>
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
