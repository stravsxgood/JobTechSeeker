<?php

namespace Database\Factories;

use App\Enums\InterviewStatus;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Interview>
 */
class InterviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('+1 day', '+2 weeks');
        $end = (clone $start)->modify('+1 hour');

        return [
            'user_id' => User::factory(),
            'job_application_id' => JobApplication::factory(),
            'interview_type' => fake()->randomElement(['HR Screening', 'Technical Interview', 'User Interview', 'Final Interview']),
            'start_at' => $start,
            'end_at' => $end,
            'timezone' => 'Asia/Jakarta',
            'meeting_url' => fake()->url(),
            'location' => fake()->optional()->address(),
            'status' => fake()->randomElement(InterviewStatus::cases()),
            'confirmation_state' => 'not_required',
            'confirmation_source' => 'manual_entry',
            'source_email_event_id' => null,
            'notes' => fake()->sentence(),
        ];
    }
}
