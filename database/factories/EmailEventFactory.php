<?php

namespace Database\Factories;

use App\Enums\EmailClassification;
use App\Enums\EmailProcessingStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EmailEvent>
 */
class EmailEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'connected_email_account_id' => ConnectedEmailAccount::factory(),
            'provider_message_id' => (string) Str::random(16),
            'provider_thread_id' => (string) Str::random(16),
            'received_at' => now(),
            'sender_address' => fake()->companyEmail(),
            'sender_name' => fake()->name(),
            'subject' => 'Undangan Interview: '.fake()->jobTitle(),
            'snippet' => fake()->sentence(),
            'classification' => EmailClassification::InterviewInvitation,
            'extracted_payload' => [
                'company' => fake()->company(),
                'type' => 'technical',
                'suggested_time' => now()->addDays(2)->toIso8601String(),
            ],
            'uncertainty_notes' => null,
            'related_application_id' => null,
            'processing_status' => EmailProcessingStatus::Received,
            'requires_confirmation' => true,
            'reviewed_at' => null,
            'reviewed_by_user_id' => null,
            'processed_at' => null,
            'last_error_category' => null,
        ];
    }
}
