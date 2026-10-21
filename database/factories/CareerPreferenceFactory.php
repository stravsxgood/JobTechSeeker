<?php

namespace Database\Factories;

use App\Models\CareerPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CareerPreference>
 */
class CareerPreferenceFactory extends Factory
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
            'target_roles' => ['Backend Engineer', 'Fullstack Developer'],
            'preferred_locations' => ['Jakarta', 'Remote'],
            'salary_expectation_min' => 15000000,
            'salary_expectation_max' => 25000000,
            'salary_currency' => 'IDR',
            'weekly_application_target' => 5,
            'work_types' => ['full_time', 'remote'],
            'preferences' => [],
        ];
    }
}
