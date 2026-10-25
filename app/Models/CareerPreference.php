<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\CareerPreferenceFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property int $user_id
 * @property array<string>|null $target_roles
 * @property array<string>|null $preferred_locations
 * @property string|null $salary_expectation_min
 * @property string|null $salary_expectation_max
 * @property string|null $salary_currency
 * @property int|null $weekly_application_target
 * @property array<string>|null $work_types
 * @property array<string, mixed>|null $preferences
 * @property CarbonInterface $created_at
 * @property CarbonInterface $updated_at
 * @property-read User $user
 */
class CareerPreference extends Model
{
    /** @use HasFactory<CareerPreferenceFactory> */
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'target_roles',
        'preferred_locations',
        'salary_expectation_min',
        'salary_expectation_max',
        'salary_currency',
        'weekly_application_target',
        'work_types',
        'preferences',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_roles' => 'array',
            'preferred_locations' => 'array',
            'work_types' => 'array',
            'preferences' => 'array',
            'salary_expectation_min' => 'decimal:2',
            'salary_expectation_max' => 'decimal:2',
            'weekly_application_target' => 'integer',
        ];
    }

    /**
     * The user owner of these preferences.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
