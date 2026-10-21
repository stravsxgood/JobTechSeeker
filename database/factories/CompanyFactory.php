<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();

        return [
            'user_id' => User::factory(),
            'name' => $name,
            'normalized_name' => fn (array $attributes) => Str::slug($attributes['name'] ?? $name, ' '),
            'website' => fake()->url(),
            'industry' => fake()->randomElement(['Software', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech']),
            'location' => fake()->city(),
        ];
    }
}
