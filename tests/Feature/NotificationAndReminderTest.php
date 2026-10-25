<?php

use App\Enums\ReminderStatus;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('user can list notifications, view unread count, and mark them read', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $notif1 = Notification::factory()->create([
        'user_id' => $user->id,
        'title' => 'Interview Reminder 1',
        'read_at' => null,
    ]);

    $notif2 = Notification::factory()->create([
        'user_id' => $user->id,
        'title' => 'Follow-up Due',
        'read_at' => null,
    ]);

    // Unread count check
    $countResponse = $this->getJson(route('api.v1.notifications.unread-count'));
    $countResponse->assertStatus(200)
        ->assertJson(['unread_count' => 2]);

    // Mark single notification read
    $markSingleResponse = $this->patchJson(route('api.v1.notifications.read', $notif1->id));
    $markSingleResponse->assertStatus(200)
        ->assertJson(['data' => ['is_read' => true]]);

    expect($notif1->fresh()->read_at)->not->toBeNull();

    // Mark all read
    $markAllResponse = $this->postJson(route('api.v1.notifications.mark-all-read'));
    $markAllResponse->assertStatus(200)
        ->assertJson(['marked_count' => 1]);

    expect($notif2->fresh()->read_at)->not->toBeNull();

    $countAfter = $this->getJson(route('api.v1.notifications.unread-count'));
    $countAfter->assertStatus(200)
        ->assertJson(['unread_count' => 0]);
});

test('process due reminders command delivers in-app notifications and updates status idempotently', function () {
    $user = User::factory()->create();
    $application = JobApplication::factory()->create(['user_id' => $user->id]);

    // Reminder due in the past
    $pastInstant = now()->subMinutes(15);
    $dedupeKey = hash('sha256', "app:{$application->id}:follow_up:{$pastInstant->timestamp}:v1");

    $reminder = Reminder::create([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'job_application_id' => $application->id,
        'reminder_type' => 'follow_up',
        'title' => 'Waktunya Follow-up Lamaran',
        'body' => 'Kirim email follow-up untuk status terbaru lamaran Anda.',
        'scheduled_at' => $pastInstant,
        'status' => ReminderStatus::Pending->value,
        'dedupe_key' => $dedupeKey,
    ]);

    // Run Artisan command
    $this->artisan('app:process-due-reminders')
        ->expectsOutputToContain('Selesai memproses 1 reminder.')
        ->assertExitCode(0);

    // Reminder status updated to sent
    expect($reminder->fresh()->status)->toBe(ReminderStatus::Sent)
        ->and($reminder->fresh()->sent_at)->not->toBeNull();

    // In-app notification created
    $notification = Notification::where('user_id', $user->id)
        ->where('reminder_id', $reminder->id)
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toBe('Waktunya Follow-up Lamaran')
        ->and($notification->read_at)->toBeNull();

    // Re-running command does not create duplicate notification or process again
    $this->artisan('app:process-due-reminders')
        ->expectsOutputToContain('Selesai memproses 0 reminder.')
        ->assertExitCode(0);

    expect(Notification::where('user_id', $user->id)->count())->toBe(1);
});
