<?php

use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('authenticated user can schedule interview and reminders are automatically queued', function () {
    $user = User::factory()->create(['timezone' => 'Asia/Jakarta']);
    Sanctum::actingAs($user);

    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'Senior Fullstack Engineer',
    ]);

    $startAt = now()->addDays(3)->setTime(14, 0, 0);
    $endAt = (clone $startAt)->addHour();

    $payload = [
        'job_application_id' => $application->id,
        'interview_type' => 'Technical Interview',
        'start_at' => $startAt->toIso8601String(),
        'end_at' => $endAt->toIso8601String(),
        'timezone' => 'Asia/Jakarta',
        'meeting_url' => 'https://meet.google.com/abc-defg-hij',
        'location' => 'Google Meet',
        'notes' => 'Siapkan laptop untuk live coding session.',
    ];

    $response = $this->postJson(route('api.v1.interviews.store'), $payload);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'has_conflict',
            'data' => [
                'id',
                'job_application_id',
                'interview_type',
                'start_at',
                'end_at',
                'status',
                'confirmation_state',
                'confirmation_source',
            ],
        ]);

    $interviewId = $response->json('data.id');
    expect($response->json('has_conflict'))->toBeFalse();

    $this->assertDatabaseHas('interviews', [
        'id' => $interviewId,
        'user_id' => $user->id,
        'interview_type' => 'Technical Interview',
        'status' => 'scheduled',
    ]);

    // Check automated reminders (24h and 2h before)
    $reminders = Reminder::where('interview_id', $interviewId)->get();
    expect($reminders)->toHaveCount(2);

    $reminderTypes = $reminders->pluck('reminder_type')->all();
    expect($reminderTypes)->toContain('interview_24h', 'interview_2h');
});

test('interview store endpoint detects overlapping schedule conflict', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $application = JobApplication::factory()->create(['user_id' => $user->id]);

    $baseTime = now()->addDays(2)->setTime(10, 0, 0);

    // Existing interview at 10:00 - 11:00
    Interview::factory()->create([
        'user_id' => $user->id,
        'job_application_id' => $application->id,
        'start_at' => $baseTime,
        'end_at' => (clone $baseTime)->addHour(),
        'status' => 'scheduled',
    ]);

    // New interview overlapping at 10:30 - 11:30
    $conflictResponse = $this->postJson(route('api.v1.interviews.store'), [
        'job_application_id' => $application->id,
        'interview_type' => 'HR Screening',
        'start_at' => (clone $baseTime)->addMinutes(30)->toIso8601String(),
        'end_at' => (clone $baseTime)->addMinutes(90)->toIso8601String(),
    ]);

    $conflictResponse->assertStatus(201)
        ->assertJson(['has_conflict' => true]);
});

test('user can list, update, and soft-delete interviews', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $application = JobApplication::factory()->create(['user_id' => $user->id]);

    $interview = Interview::factory()->create([
        'user_id' => $user->id,
        'job_application_id' => $application->id,
        'interview_type' => 'User Interview',
        'start_at' => now()->addDays(4),
        'end_at' => now()->addDays(4)->addHour(),
        'status' => 'scheduled',
    ]);

    // 1. List
    $listResponse = $this->getJson(route('api.v1.interviews.index'));
    $listResponse->assertStatus(200);
    expect($listResponse->json('data'))->toHaveCount(1);

    // 2. Show
    $showResponse = $this->getJson(route('api.v1.interviews.show', $interview->id));
    $showResponse->assertStatus(200);
    expect($showResponse->json('data.interview_type'))->toBe('User Interview');

    // 3. Update
    $updateResponse = $this->patchJson(route('api.v1.interviews.update', $interview->id), [
        'notes' => 'Diundur 1 jam atas permintaan hiring manager.',
    ]);
    $updateResponse->assertStatus(200);
    expect($updateResponse->json('data.notes'))->toBe('Diundur 1 jam atas permintaan hiring manager.');

    // 4. Delete
    $deleteResponse = $this->deleteJson(route('api.v1.interviews.destroy', $interview->id));
    $deleteResponse->assertStatus(200);

    $this->assertSoftDeleted('interviews', ['id' => $interview->id]);
});

test('cross-user interview scheduling or viewing is prevented', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();

    $ownerApp = JobApplication::factory()->create(['user_id' => $owner->id]);
    $ownerInterview = Interview::factory()->create([
        'user_id' => $owner->id,
        'job_application_id' => $ownerApp->id,
    ]);

    Sanctum::actingAs($stranger);

    // Cannot schedule for another user's application
    $this->postJson(route('api.v1.interviews.store'), [
        'job_application_id' => $ownerApp->id,
        'interview_type' => 'Technical Interview',
        'start_at' => now()->addDays(1)->toIso8601String(),
        'end_at' => now()->addDays(1)->addHour()->toIso8601String(),
    ])->assertStatus(404);

    // Cannot view another user's interview
    $this->getJson(route('api.v1.interviews.show', $ownerInterview->id))->assertStatus(404);

    // Cannot delete another user's interview
    $this->deleteJson(route('api.v1.interviews.destroy', $ownerInterview->id))->assertStatus(404);
});
