<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
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
            'type' => 'upcoming_interview',
            'title' => fake()->sentence(3),
            'body' => fake()->sentence(),
            'payload' => ['sample' => true],
            'job_application_id' => null,
            'interview_id' => null,
            'email_event_id' => null,
            'reminder_id' => null,
            'read_at' => null,
            'dedupe_key' => (string) Str::uuid(),
        ];
    }
}
