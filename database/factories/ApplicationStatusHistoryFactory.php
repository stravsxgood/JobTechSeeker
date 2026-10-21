<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Models\ApplicationStatusHistory;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApplicationStatusHistory>
 */
class ApplicationStatusHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'job_application_id' => JobApplication::factory(),
            'previous_status' => ApplicationStatus::Saved->value,
            'new_status' => ApplicationStatus::Applied->value,
            'change_source' => 'user',
            'notes' => fake()->sentence(),
            'actor_user_id' => User::factory(),
            'source_email_event_id' => null,
            'changed_at' => now(),
        ];
    }
}
