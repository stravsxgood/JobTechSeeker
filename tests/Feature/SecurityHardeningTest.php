<?php

use App\Enums\EmailProcessingStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('updating password in profile requires strong password complexity', function (string $invalidPassword) {
    $user = User::factory()->create([
        'password' => bcrypt('OldValidPass123!'),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson(route('api.v1.me.update'), [
            'current_password' => 'OldValidPass123!',
            'password' => $invalidPassword,
            'password_confirmation' => $invalidPassword,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
})->with([
    'less than 8 characters' => ['Short1!'],
    'missing symbols' => ['NoSymbolPass123'],
    'missing uppercase' => ['nosymbolpass123!'],
    'missing lowercase' => ['NOSYMBOLPASS123!'],
]);

test('updating password in profile succeeds with strong password', function () {
    $user = User::factory()->create([
        'password' => bcrypt('OldValidPass123!'),
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->patchJson(route('api.v1.me.update'), [
            'current_password' => 'OldValidPass123!',
            'password' => 'NewStrongPass987#',
            'password_confirmation' => 'NewStrongPass987#',
        ]);

    $response->assertStatus(200);
});

test('store interview endpoint returns 404 consistently for both non-existent and stranger job application ids', function () {
    $user = User::factory()->create();
    $stranger = User::factory()->create();

    $strangerApp = JobApplication::factory()->create(['user_id' => $stranger->id]);
    $nonExistentUuid = (string) Str::uuid();

    Sanctum::actingAs($user);

    $basePayload = [
        'interview_type' => 'Technical Interview',
        'start_at' => now()->addDays(2)->toIso8601String(),
        'end_at' => now()->addDays(2)->addHour()->toIso8601String(),
    ];

    // 1. Stranger's job application returns 404
    $strangerResponse = $this->postJson(route('api.v1.interviews.store'), array_merge($basePayload, [
        'job_application_id' => $strangerApp->id,
    ]));
    $strangerResponse->assertStatus(404);

    // 2. Non-existent UUID returns identical 404 (preventing existence oracle)
    $nonExistentResponse = $this->postJson(route('api.v1.interviews.store'), array_merge($basePayload, [
        'job_application_id' => $nonExistentUuid,
    ]));
    $nonExistentResponse->assertStatus(404);

    // 3. Malformed UUID fails form validation with 422
    $malformedResponse = $this->postJson(route('api.v1.interviews.store'), array_merge($basePayload, [
        'job_application_id' => 'not-a-valid-uuid',
    ]));
    $malformedResponse->assertStatus(422)
        ->assertJsonValidationErrors(['job_application_id']);
});

test('sanctum personal access tokens expire according to configured lifetime', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-device');

    // Move token creation date 31 days into the past (exceeding 30 days expiration)
    $token->accessToken->forceFill([
        'created_at' => now()->subDays(31),
    ])->save();

    // Expired token must be rejected with 401
    $this->withToken($token->plainTextToken)
        ->getJson(route('api.v1.me'))
        ->assertStatus(401);
});

test('valid sanctum token within expiration lifetime can access protected endpoints', function () {
    $user = User::factory()->create();
    $token = $user->createToken('valid-device');

    $this->withToken($token->plainTextToken)
        ->getJson(route('api.v1.me'))
        ->assertStatus(200);
});

test('rate limiting is enforced on resource-intensive ai endpoints', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Hit the endpoint 20 times (allowed)
    for ($i = 0; $i < 20; $i++) {
        // Send request with empty payload to hit controller validation or fail fast
        $this->postJson(route('api.v1.ai.career-plan'), []);
    }

    // 21st request exceeds rate limit and must return 429 Too Many Requests
    $rateLimitedResponse = $this->postJson(route('api.v1.ai.career-plan'), []);
    $rateLimitedResponse->assertStatus(429);
});

test('confirming email event validates input payload and prevents 500 error crashes', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $account = ConnectedEmailAccount::factory()->create(['user_id' => $user->id]);
    $event = EmailEvent::factory()->create([
        'connected_email_account_id' => $account->id,
        'processing_status' => EmailProcessingStatus::AwaitingReview,
    ]);

    // 1. Invalid action_type
    $this->postJson(route('api.v1.email.events.confirm', $event->id), [
        'action_type' => 'malicious_action',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['action_type']);

    // 2. Action create_interview with invalid start_at date
    $this->postJson(route('api.v1.email.events.confirm', $event->id), [
        'action_type' => 'create_interview',
        'interview_details' => [
            'start_at' => 'not-a-valid-date-string',
        ],
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['interview_details.start_at']);

    // 3. Action create_interview with invalid meeting_url
    $this->postJson(route('api.v1.email.events.confirm', $event->id), [
        'action_type' => 'create_interview',
        'interview_details' => [
            'start_at' => now()->addDays(2)->toIso8601String(),
            'meeting_url' => 'javascript:alert(1)',
        ],
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['interview_details.meeting_url']);

    // 4. Action update_status with invalid enum status
    $this->postJson(route('api.v1.email.events.confirm', $event->id), [
        'action_type' => 'update_status',
        'status' => 'non_existent_status_value',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

test('job applications index enforces search query length constraint', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // 1. Search string exceeding 100 characters must fail validation with 422
    $longQuery = str_repeat('a', 101);
    $responseTooLong = $this->getJson(route('api.v1.applications.index', ['q' => $longQuery]));
    $responseTooLong->assertStatus(422)
        ->assertJsonValidationErrors(['q']);

    // 2. Search string at max boundary (100 characters) is accepted with 200
    $boundaryQuery = str_repeat('a', 100);
    $responseBoundary = $this->getJson(route('api.v1.applications.index', ['q' => $boundaryQuery]));
    $responseBoundary->assertStatus(200);

    // 3. Search string with wildcard characters does not crash and escapes cleanly
    $wildcardResponse = $this->getJson(route('api.v1.applications.index', ['q' => '%_%']));
    $wildcardResponse->assertStatus(200);
});

test('duplicate check endpoint enforces field length constraints', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $tooLongString = str_repeat('b', 256);
    $response = $this->getJson(route('api.v1.applications.check-duplicate', [
        'company_name' => $tooLongString,
        'job_title' => 'Engineer',
    ]));

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['company_name']);
});
