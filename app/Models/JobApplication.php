<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use App\Enums\EmploymentType;
use Carbon\CarbonInterface;
use Database\Factories\JobApplicationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property string $id
 * @property int $user_id
 * @property string $company_id
 * @property string $job_title
 * @property string|null $description
 * @property string|null $source
 * @property string|null $source_url
 * @property EmploymentType|null $employment_type
 * @property string|null $location
 * @property string|null $salary_min
 * @property string|null $salary_max
 * @property string|null $salary_currency
 * @property CarbonInterface|null $applied_at
 * @property ApplicationStatus $status
 * @property string|null $notes
 * @property CarbonInterface|null $follow_up_at
 * @property CarbonInterface $created_at
 * @property CarbonInterface $updated_at
 * @property CarbonInterface|null $deleted_at
 * @property-read Company|null $company
 * @property-read User $user
 */
class JobApplication extends Model
{
    /** @use HasFactory<JobApplicationFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'company_id',
        'job_title',
        'description',
        'source',
        'source_url',
        'employment_type',
        'location',
        'salary_min',
        'salary_max',
        'salary_currency',
        'applied_at',
        'status',
        'notes',
        'follow_up_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'employment_type' => EmploymentType::class,
            'applied_at' => 'date',
            'follow_up_at' => 'datetime',
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
        ];
    }

    /**
     * The user who owns this application.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The company this application belongs to.
     *
     * @return BelongsTo<Company, $this>
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Status transition audit history.
     *
     * @return HasMany<ApplicationStatusHistory, $this>
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class)->orderByDesc('changed_at');
    }

    /**
     * Interviews scheduled for this application.
     *
     * @return HasMany<Interview, $this>
     */
    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class)->orderBy('start_at');
    }

    /**
     * Reminders attached to this application.
     *
     * @return HasMany<Reminder, $this>
     */
    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class);
    }

    /**
     * In-app notifications related to this application.
     *
     * @return HasMany<Notification, $this>
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Inbound email events matched to this application.
     *
     * @return HasMany<EmailEvent, $this>
     */
    public function emailEvents(): HasMany
    {
        return $this->hasMany(EmailEvent::class, 'related_application_id');
    }

    /**
     * Scope a query to only include active applications.
     *
     * @param  Builder<JobApplication>  $query
     * @return Builder<JobApplication>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            ApplicationStatus::Applied->value,
            ApplicationStatus::Screening->value,
            ApplicationStatus::Assessment->value,
            ApplicationStatus::Interview->value,
        ]);
    }

    /**
     * Scope a query to applications with follow-ups due.
     *
     * @param  Builder<JobApplication>  $query
     * @return Builder<JobApplication>
     */
    public function scopeDueFollowUp(Builder $query): Builder
    {
        return $query->whereNotNull('follow_up_at')->where('follow_up_at', '<=', now());
    }
}
