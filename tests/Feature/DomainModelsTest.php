<?php

use App\Enums\ApplicationStatus;
use App\Enums\EmploymentType;
use App\Enums\InterviewStatus;
use App\Models\AgentConversationOwner;
use App\Models\AiGenerationLog;
use App\Models\ApplicationStatusHistory;
use App\Models\CareerPreference;
use App\Models\Company;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('user can own companies and job applications with uuid v7 primary keys', function () {
    $user = User::factory()->create([
        'timezone' => 'Asia/Jakarta',
        'locale' => 'id-ID',
    ]);

    $company = Company::factory()->create([
        'user_id' => $user->id,
        'name' => 'PT Teknologi Jaya',
    ]);

    expect($company->id)->toBeString()
        ->and(Str::isUuid($company->id))->toBeTrue()
        ->and($company->normalized_name)->toBe('pt teknologi jaya')
        ->and($company->user->id)->toBe($user->id);

    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'job_title' => 'Senior Backend Engineer',
        'status' => ApplicationStatus::Applied,
        'employment_type' => EmploymentType::FullTime,
    ]);

    expect($application->id)->toBeString()
        ->and(Str::isUuid($application->id))->toBeTrue()
        ->and($application->status)->toBe(ApplicationStatus::Applied)
        ->and($application->status->isActive())->toBeTrue()
        ->and($application->company->name)->toBe('PT Teknologi Jaya')
        ->and($user->jobApplications)->toHaveCount(1);
});

test('application status histories audit trail links properly', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['user_id' => $user->id]);
    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'status' => ApplicationStatus::Saved,
    ]);

    $history = ApplicationStatusHistory::factory()->create([
        'job_application_id' => $application->id,
        'previous_status' => ApplicationStatus::Saved->value,
        'new_status' => ApplicationStatus::Applied->value,
        'actor_user_id' => $user->id,
    ]);

    expect($history->id)->toBeString()
        ->and(Str::isUuid($history->id))->toBeTrue()
        ->and($history->jobApplication->id)->toBe($application->id)
        ->and($history->actor->id)->toBe($user->id)
        ->and($application->statusHistories)->toHaveCount(1);
});

test('interviews and reminders relate to application with timezone and dedupe key', function () {
    $user = User::factory()->create();
    $company = Company::factory()->create(['user_id' => $user->id]);
    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
    ]);

    $interview = Interview::factory()->create([
        'user_id' => $user->id,
        'job_application_id' => $application->id,
        'interview_type' => 'Technical Interview',
        'timezone' => 'Asia/Jakarta',
        'status' => InterviewStatus::Scheduled,
    ]);

    expect($interview->id)->toBeString()
        ->and(Str::isUuid($interview->id))->toBeTrue()
        ->and($interview->status)->toBe(InterviewStatus::Scheduled)
        ->and($application->interviews)->toHaveCount(1);

    $reminder = Reminder::factory()->create([
        'user_id' => $user->id,
        'job_application_id' => $application->id,
        'interview_id' => $interview->id,
        'dedupe_key' => 'rem_'.$interview->id.'_h24',
    ]);

    expect($reminder->id)->toBeString()
        ->and(Str::isUuid($reminder->id))->toBeTrue()
        ->and($reminder->interview->id)->toBe($interview->id)
        ->and($reminder->jobApplication->id)->toBe($application->id);
});

test('notifications can be created and marked as read', function () {
    $user = User::factory()->create();

    $notification = Notification::factory()->create([
        'user_id' => $user->id,
        'title' => 'Interview Besok',
        'body' => 'Interview teknis Anda dijadwalkan pukul 10:00 WIB',
        'read_at' => null,
    ]);

    expect(Notification::unread()->count())->toBe(1);

    $notification->markAsRead();

    expect(Notification::unread()->count())->toBe(0)
        ->and($notification->fresh()->read_at)->not->toBeNull();
});

test('career preferences store and cast target roles and weekly targets', function () {
    $user = User::factory()->create();

    $preference = CareerPreference::factory()->create([
        'user_id' => $user->id,
        'target_roles' => ['Backend Engineer', 'Lead Architect'],
        'weekly_application_target' => 7,
    ]);

    expect($preference->target_roles)->toBe(['Backend Engineer', 'Lead Architect'])
        ->and($preference->weekly_application_target)->toBe(7)
        ->and($user->careerPreference->id)->toBe($preference->id);
});

test('connected email accounts and email events handle encrypted tokens and triage metadata', function () {
    $user = User::factory()->create();

    $connected = ConnectedEmailAccount::factory()->create([
        'user_id' => $user->id,
        'email_address' => 'seeker@example.com',
    ]);

    expect($connected->id)->toBeString()
        ->and($connected->user->id)->toBe($user->id);

    $event = EmailEvent::factory()->create([
        'connected_email_account_id' => $connected->id,
        'subject' => 'Invitation to Interview',
    ]);

    expect($event->id)->toBeString()
        ->and($event->connectedEmailAccount->id)->toBe($connected->id)
        ->and($event->extracted_payload)->toBeArray();
});

test('ai generation logs and agent conversation owners link correctly', function () {
    $user = User::factory()->create();

    $log = AiGenerationLog::factory()->create([
        'user_id' => $user->id,
        'agent_name' => 'CareerPlannerAgent',
    ]);

    expect($log->id)->toBeString()
        ->and($log->user->id)->toBe($user->id);

    $owner = AgentConversationOwner::factory()->create([
        'user_id' => $user->id,
        'sdk_conversation_id' => (string) Str::uuid(),
    ]);

    expect($owner->id)->toBeString()
        ->and($owner->user->id)->toBe($user->id);
});
