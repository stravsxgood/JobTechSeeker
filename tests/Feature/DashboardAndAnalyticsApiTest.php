<?php

use App\Enums\ApplicationStatus;
use App\Models\CareerPreference;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('dashboard returns accurate metrics, pipeline distribution, weekly target, and upcoming interviews', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    CareerPreference::factory()->create([
        'user_id' => $user->id,
        'weekly_application_target' => 5,
    ]);

    $company = Company::factory()->create(['user_id' => $user->id, 'name' => 'Tech Corp']);

    // Create applications in various statuses
    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Applied,
        'applied_at' => now()->toDateString(),
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Interview,
        'applied_at' => now()->subDays(5)->toDateString(),
    ]);

    $offerApp = JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Offer,
        'applied_at' => now()->subDays(10)->toDateString(),
    ]);

    // Create upcoming interview
    Interview::factory()->create([
        'user_id' => $user->id,
        'job_application_id' => $offerApp->id,
        'interview_type' => 'Final Interview',
        'start_at' => now()->addDays(2),
        'end_at' => now()->addDays(2)->addHour(),
        'status' => 'scheduled',
    ]);

    // Create another user's data (must not affect current user)
    $otherUser = User::factory()->create();
    JobApplication::factory()->create([
        'user_id' => $otherUser->id,
        'status' => ApplicationStatus::Offer,
    ]);

    $response = $this->getJson(route('api.v1.dashboard'));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'metrics' => [
                    'total_applications',
                    'active_applications',
                    'offers_count',
                    'interviews_count',
                ],
                'status_distribution',
                'weekly_target' => [
                    'target',
                    'current',
                    'progress_percentage',
                ],
                'upcoming_interviews',
                'follow_ups_due',
            ],
        ]);

    $metrics = $response->json('data.metrics');
    expect($metrics['total_applications'])->toBe(3)
        ->and($metrics['active_applications'])->toBe(2) // Applied + Interview
        ->and($metrics['offers_count'])->toBe(1)
        ->and($metrics['interviews_count'])->toBe(1);

    $upcoming = $response->json('data.upcoming_interviews');
    expect($upcoming)->toHaveCount(1)
        ->and($upcoming[0]['interview_type'])->toBe('Final Interview');
});

test('analytics endpoint returns calculated conversion rates, pipeline breakdown, and trends', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    CareerPreference::factory()->create([
        'user_id' => $user->id,
        'weekly_application_target' => 4,
    ]);

    $company = Company::factory()->create(['user_id' => $user->id, 'name' => 'Fintech Hub']);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Applied,
        'source' => 'LinkedIn',
        'applied_at' => now()->toDateString(),
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Interview,
        'source' => 'LinkedIn',
        'applied_at' => now()->toDateString(),
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Offer,
        'source' => 'JobStreet',
        'applied_at' => now()->toDateString(),
    ]);

    $response = $this->getJson(route('api.v1.analytics'));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'summary' => [
                    'total_applications',
                    'total_applied',
                    'total_offers',
                    'response_rate_percentage',
                    'interview_conversion_rate_percentage',
                    'offer_rate_percentage',
                ],
                'pipeline_breakdown',
                'by_source',
                'monthly_trend',
                'weekly_target',
            ],
        ]);

    $summary = $response->json('data.summary');
    expect($summary['total_applications'])->toBe(3)
        ->and($summary['total_applied'])->toBe(3)
        ->and($summary['total_offers'])->toBe(1);

    // 2 out of 3 responded (Interview and Offer) = 66.7%
    expect($summary['response_rate_percentage'])->toBe(66.7)
        ->and($summary['interview_conversion_rate_percentage'])->toBe(33.3)
        ->and($summary['offer_rate_percentage'])->toBe(33.3);

    $bySource = $response->json('data.by_source');
    expect($bySource)->toHaveCount(2);
});
