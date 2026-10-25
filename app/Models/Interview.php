<?php

namespace App\Models;

use App\Enums\InterviewStatus;
use Carbon\CarbonInterface;
use Database\Factories\InterviewFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property int $user_id
 * @property string $job_application_id
 * @property string $interview_type
 * @property CarbonInterface $start_at
 * @property CarbonInterface $end_at
 * @property string $timezone
 * @property string|null $meeting_url
 * @property string|null $location
 * @property InterviewStatus $status
 * @property string $confirmation_state
 * @property string $confirmation_source
 * @property string|null $source_email_event_id
 * @property string|null $notes
 * @property CarbonInterface $created_at
 * @property CarbonInterface $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read JobApplication|null $jobApplication
 * @property-read User $user
 */
class Interview extends Model
{
    /** @use HasFactory<InterviewFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'job_application_id',
        'interview_type',
        'start_at',
        'end_at',
        'timezone',
        'meeting_url',
        'location',
        'status',
        'confirmation_state',
        'confirmation_source',
        'source_email_event_id',
        'notes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'status' => InterviewStatus::class,
        ];
    }

    /**
     * The user owner of this interview.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The application this interview is for.
     *
     * @return BelongsTo<JobApplication, $this>
     */
    public function jobApplication(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class);
    }

    /**
     * Email event this interview was created from, if any.
     *
     * @return BelongsTo<EmailEvent, $this>
     */
    public function sourceEmailEvent(): BelongsTo
    {
        return $this->belongsTo(EmailEvent::class, 'source_email_event_id');
    }

    /**
     * Reminders scheduled for this interview.
     *
     * @return HasMany<Reminder, $this>
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    /**
     * In-app notifications related to this interview.
     *
     * @return HasMany<Notification, $this>
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
