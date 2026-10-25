<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\ApplicationStatusHistoryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $job_application_id
 * @property string|null $previous_status
 * @property string $new_status
 * @property string $change_source
 * @property string|null $notes
 * @property int|null $actor_user_id
 * @property string|null $source_email_event_id
 * @property CarbonInterface $changed_at
 * @property CarbonInterface $created_at
 * @property CarbonInterface $updated_at
 * @property-read JobApplication $jobApplication
 * @property-read User|null $actor
 */
class ApplicationStatusHistory extends Model
{
    /** @use HasFactory<ApplicationStatusHistoryFactory> */
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'job_application_id',
        'previous_status',
        'new_status',
        'change_source',
        'notes',
        'actor_user_id',
        'source_email_event_id',
        'changed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'changed_at' => 'datetime',
        ];
    }

    /**
     * The application this history belongs to.
     *
     * @return BelongsTo<JobApplication, $this>
     */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * The user actor who made the change.
     *
     * @return BelongsTo<User, $this>
     */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    /**
     * The email event that triggered this status change, if any.
     *
     * @return BelongsTo<EmailEvent, $this>
     */
    public function sourceEmailEvent(): BelongsTo
    {
        return $this->belongsTo(EmailEvent::class, 'source_email_event_id');
    }
}
