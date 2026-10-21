<?php

namespace Database\Factories;

use App\Enums\ApplicationStatus;
use App\Enums\EmploymentType;
use App\Models\Company;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JobApplication>
 */
class JobApplicationFactory extends Factory
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
            'company_id' => Company::factory(),
            'job_title' => fake()->jobTitle(),
            'description' => fake()->paragraphs(2, true),
            'source' => fake()->randomElement(['LinkedIn', 'JobStreet', 'Glints', 'Company Career Page']),
            'source_url' => fake()->url(),
            'employment_type' => fake()->randomElement(EmploymentType::cases()),
            'location' => fake()->city(),
            'salary_min' => fake()->numberBetween(8000000, 15000000),
            'salary_max' => fake()->numberBetween(16000000, 30000000),
            'salary_currency' => 'IDR',
            'applied_at' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'status' => fake()->randomElement(ApplicationStatus::cases()),
            'notes' => fake()->sentence(),
            'follow_up_at' => fake()->optional()->dateTimeBetween('now', '+2 weeks'),
        ];
    }
}
