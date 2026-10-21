<?php

namespace Database\Factories;

use App\Models\AgentConversationOwner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AgentConversationOwner>
 */
class AgentConversationOwnerFactory extends Factory
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
            'sdk_conversation_id' => (string) Str::uuid(),
        ];
    }
}
