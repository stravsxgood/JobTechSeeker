<?php

namespace Database\Factories;

use App\Models\AiGenerationLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AiGenerationLog>
 */
class AiGenerationLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'request_id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'agent_name' => 'CareerPlannerAgent',
            'provider' => 'gemini',
            'model' => 'gemini-1.5-flash',
            'prompt_version' => '1.0.0',
            'status' => 'succeeded',
            'latency_ms' => fake()->numberBetween(500, 2500),
            'input_tokens' => fake()->numberBetween(200, 1000),
            'output_tokens' => fake()->numberBetween(100, 500),
            'error_category' => null,
            'result_payload' => ['summary' => 'Sample career plan output'],
            'created_at' => now(),
            'completed_at' => now()->addSeconds(2),
        ];
    }
}
