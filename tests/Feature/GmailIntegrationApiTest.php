<?php

use App\Enums\ConnectionStatus;
use App\Enums\EmailProcessingStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('user can get google oauth authorization url with minimal read-only scope', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->getJson(route('api.v1.email.oauth.google.url'));

    $response->assertStatus(200)
        ->assertJsonStructure(['url']);

    $url = $response->json('url');
    expect($url)->toContain('https://accounts.google.com/o/oauth2/v2/auth')
        ->and($url)->toContain('gmail.readonly')
        ->and($url)->toContain('state=');
});

test('user can complete oauth callback and tokens are stored securely encrypted', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Generate valid state for user
    $statePayload = json_encode([
        'user_id' => $user->id,
        'timestamp' => now()->timestamp,
        'random' => 'abcdefghijklmnop',
    ]);
    $state = Crypt::encryptString($statePayload ?: '');

    Http::fake([
        'https://oauth2.googleapis.com/token' => Http::response([
            'access_token' => 'mock_google_access_token',
            'refresh_token' => 'mock_google_refresh_token',
            'expires_in' => 3600,
            'scope' => 'https://www.googleapis.com/auth/gmail.readonly',
        ], 200),
        'https://www.googleapis.com/oauth2/v3/userinfo' => Http::response([
            'sub' => 'google_sub_12345',
            'email' => 'user.jobseeker@gmail.com',
            'name' => 'Budi Santoso',
        ], 200),
    ]);

    $response = $this->postJson(route('api.v1.email.oauth.google.callback'), [
        'code' => 'mock_auth_code_123',
        'state' => $state,
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'provider',
                'email_address',
                'connection_status',
            ],
        ]);

    $data = $response->json('data');
    expect($data['email_address'])->toBe('user.jobseeker@gmail.com')
        ->and($data['connection_status'])->toBe('connected');

    $this->assertDatabaseHas('connected_email_accounts', [
        'user_id' => $user->id,
        'email_address' => 'user.jobseeker@gmail.com',
        'provider_account_id' => 'google_sub_12345',
    ]);

    $account = ConnectedEmailAccount::where('user_id', $user->id)->first();
    // Tokens must be encrypted and not stored plain
    expect($account->access_token_encrypted)->not->toBe('mock_google_access_token');
    expect(Crypt::decryptString($account->access_token_encrypted))->toBe('mock_google_access_token');
    expect(Crypt::decryptString($account->refresh_token_encrypted))->toBe('mock_google_refresh_token');
});

test('user can disconnect their email account', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $account = ConnectedEmailAccount::factory()->create([
        'user_id' => $user->id,
        'connection_status' => ConnectionStatus::Connected,
    ]);

    $response = $this->postJson(route('api.v1.email.accounts.disconnect', $account->id));

    $response->assertStatus(200)
        ->assertJson(['message' => 'Koneksi akun email berhasil diputuskan']);

    expect($account->fresh()->connection_status)->toBe(ConnectionStatus::Disconnected);
});

test('user can trigger gmail sync and new recruitment events are created without duplication', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $account = ConnectedEmailAccount::factory()->create([
        'user_id' => $user->id,
        'connection_status' => ConnectionStatus::Connected,
        'access_token_encrypted' => Crypt::encryptString('valid_token'),
        'token_expires_at' => now()->addHour(),
    ]);

    Http::fake(function (Request $request) {
        $url = $request->url();
        if (str_contains($url, '/messages/msg_101')) {
            return Http::response([
                'id' => 'msg_101',
                'snippet' => 'Kami mengundang Anda untuk sesi Technical Interview posisi Backend Engineer.',
                'payload' => [
                    'headers' => [
                        ['name' => 'From', 'value' => 'Recruitment Team <recruiter@tokopedia.com>'],
                        ['name' => 'Subject', 'value' => 'Undangan Interview: Backend Engineer'],
                        ['name' => 'Date', 'value' => now()->toRfc2822String()],
                    ],
                ],
            ], 200);
        }
        if (str_contains($url, '/messages/msg_102')) {
            return Http::response([
                'id' => 'msg_102',
                'snippet' => 'Terima kasih atas minat Anda, saat ini kami memutuskan melangkah dengan kandidat lain.',
                'payload' => [
                    'headers' => [
                        ['name' => 'From', 'value' => 'HR Team <hr@shopee.com>'],
                        ['name' => 'Subject', 'value' => 'Update Status Lamaran Kerja'],
                        ['name' => 'Date', 'value' => now()->toRfc2822String()],
                    ],
                ],
            ], 200);
        }
        if (str_contains($url, '/messages')) {
            return Http::response([
                'messages' => [
                    ['id' => 'msg_101', 'threadId' => 'th_101'],
                    ['id' => 'msg_102', 'threadId' => 'th_102'],
                ],
            ], 200);
        }

        return Http::response([], 404);
    });

    $response = $this->postJson(route('api.v1.email.accounts.sync', $account->id));

    $response->assertStatus(200)
        ->assertJsonPath('results.new_events_count', 2)
        ->assertJsonPath('results.status', 'success');

    expect(EmailEvent::where('connected_email_account_id', $account->id)->count())->toBe(2);

    // Syncing again should be idempotent (0 new events)
    $secondResponse = $this->postJson(route('api.v1.email.accounts.sync', $account->id));
    $secondResponse->assertStatus(200)
        ->assertJsonPath('results.new_events_count', 0);
});

test('user can review, confirm, and dismiss email events', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $account = ConnectedEmailAccount::factory()->create(['user_id' => $user->id]);
    $application = JobApplication::factory()->create(['user_id' => $user->id]);

    $event = EmailEvent::factory()->create([
        'connected_email_account_id' => $account->id,
        'related_application_id' => $application->id,
        'subject' => 'Undangan Interview Final',
        'processing_status' => EmailProcessingStatus::AwaitingReview,
    ]);

    // 1. List email events
    $listResponse = $this->getJson(route('api.v1.email.events.index', ['pending_review_only' => true]));
    $listResponse->assertStatus(200);
    expect($listResponse->json('data'))->toHaveCount(1);

    // 2. Confirm email event with interview creation
    $startAt = now()->addDays(2)->setTime(13, 0, 0);
    $confirmResponse = $this->postJson(route('api.v1.email.events.confirm', $event->id), [
        'action_type' => 'create_interview',
        'interview_details' => [
            'job_application_id' => $application->id,
            'interview_type' => 'Final Interview',
            'start_at' => $startAt->toIso8601String(),
            'end_at' => (clone $startAt)->addHour()->toIso8601String(),
            'meeting_url' => 'https://meet.google.com/xyz-uvwx-rst',
        ],
    ]);

    $confirmResponse->assertStatus(200)
        ->assertJsonPath('data.processing_status', 'confirmed');

    expect($event->fresh()->processing_status)->toBe(EmailProcessingStatus::Confirmed);

    // Interview was created
    $this->assertDatabaseHas('interviews', [
        'job_application_id' => $application->id,
        'user_id' => $user->id,
        'confirmation_source' => 'email_review',
        'source_email_event_id' => $event->id,
    ]);

    // 3. Dismiss another event
    $eventToDismiss = EmailEvent::factory()->create([
        'connected_email_account_id' => $account->id,
        'processing_status' => EmailProcessingStatus::AwaitingReview,
    ]);

    $dismissResponse = $this->postJson(route('api.v1.email.events.dismiss', $eventToDismiss->id));
    $dismissResponse->assertStatus(200)
        ->assertJsonPath('data.processing_status', 'dismissed');

    expect($eventToDismiss->fresh()->processing_status)->toBe(EmailProcessingStatus::Dismissed);
});

test('cross-user access to email accounts and events is prevented', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();

    $ownerAccount = ConnectedEmailAccount::factory()->create(['user_id' => $owner->id]);
    $ownerEvent = EmailEvent::factory()->create(['connected_email_account_id' => $ownerAccount->id]);

    Sanctum::actingAs($stranger);

    // Stranger cannot disconnect
    $this->postJson(route('api.v1.email.accounts.disconnect', $ownerAccount->id))->assertStatus(404);

    // Stranger cannot sync
    $this->postJson(route('api.v1.email.accounts.sync', $ownerAccount->id))->assertStatus(404);

    // Stranger cannot confirm or dismiss event
    $this->postJson(route('api.v1.email.events.confirm', $ownerEvent->id))->assertStatus(404);
    $this->postJson(route('api.v1.email.events.dismiss', $ownerEvent->id))->assertStatus(404);
});
