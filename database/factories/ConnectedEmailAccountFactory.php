<?php

namespace Database\Factories;

use App\Enums\ConnectionStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConnectedEmailAccount>
 */
class ConnectedEmailAccountFactory extends Factory
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
            'provider' => 'gmail',
            'provider_account_id' => (string) fake()->randomNumber(9, true),
            'email_address' => fake()->safeEmail(),
            'access_token_encrypted' => encrypt('mock_access_token'),
            'refresh_token_encrypted' => encrypt('mock_refresh_token'),
            'token_expires_at' => now()->addHour(),
            'granted_scopes' => ['https://www.googleapis.com/auth/gmail.readonly'],
            'gmail_history_id' => (string) fake()->randomNumber(7, true),
            'watch_expiration_at' => now()->addDays(7),
            'connection_status' => ConnectionStatus::Connected,
            'last_sync_at' => now(),
            'last_sync_status' => 'succeeded',
            'last_sync_error_category' => null,
        ];
    }
}
