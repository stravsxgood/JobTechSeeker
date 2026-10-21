<?php

namespace Database\Factories;

use App\Enums\ReminderStatus;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Reminder>
 */
class ReminderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_application_id' => JobApplication::factory(),
            'interview_id' => Interview::factory(),
            'reminder_type' => 'interview_h24',
            'title' => fake()->sentence(4),
            'body' => fake()->paragraph(),
            'scheduled_at' => fake()->dateTimeBetween('now', '+1 week'),
            'status' => ReminderStatus::Pending,
            'sent_at' => null,
            'dedupe_key' => (string) Str::uuid(),
            'idempotency_key' => null,
            'attempt_count' => 0,
            'last_error_category' => null,
        ];
    }
}
