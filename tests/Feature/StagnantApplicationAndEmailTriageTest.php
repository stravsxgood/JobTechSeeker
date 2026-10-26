<?php

use App\Ai\Agents\EmailTriageAgent;
use App\Ai\Agents\StagnantJobAdvisorAgent;
use App\Enums\ApplicationStatus;
use App\Enums\ConnectionStatus;
use App\Enums\EmailClassification;
use App\Enums\EmailProcessingStatus;
use App\Mail\StagnantApplicationAlertMail;
use App\Models\ConnectedEmailAccount;
use App\Models\EmailEvent;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('email triage endpoint invokes EmailTriageAgent to extract interview details and meeting/maps links', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $account = ConnectedEmailAccount::factory()->create([
        'user_id' => $user->id,
        'connection_status' => ConnectionStatus::Connected,
    ]);

    $event = EmailEvent::factory()->create([
        'connected_email_account_id' => $account->id,
        'sender_name' => 'Talent Acquisition Shopee',
        'sender_address' => 'recruitment@shopee.co.id',
        'subject' => 'Undangan Offline Interview: Senior Laravel Developer',
        'snippet' => 'Selamat, Anda diundang interview tatap muka di Kantor Shopee Pacific Century Place Lantai 25. Lokasi: https://maps.google.com/?q=Pacific+Century+Place pada 28 Oktober 2026 pukul 10:00 WIB.',
        'processing_status' => EmailProcessingStatus::AwaitingReview,
        'classification' => null,
    ]);

    EmailTriageAgent::fake([
        [
            'classification' => 'interview_invitation',
            'company_name' => 'Shopee Indonesia',
            'job_title' => 'Senior Laravel Developer',
            'summary' => 'Undangan interview offline di Pacific Century Place pada 28 Oktober 2026 pukul 10:00 WIB.',
            'interview_details' => [
                'has_interview' => true,
                'interview_type_mode' => 'offline',
                'schedule' => [
                    'date' => '2026-10-28',
                    'start_time' => '10:00',
                    'end_time' => '11:00',
                    'timezone' => 'Asia/Jakarta',
                    'raw_text' => '28 Oktober 2026 pukul 10:00 WIB',
                ],
                'meeting_url' => null,
                'location' => 'Kantor Shopee Pacific Century Place Lantai 25',
                'maps_url' => 'https://maps.google.com/?q=Pacific+Century+Place',
            ],
            'suggested_action' => 'Tambahkan jadwal ke kalender interview dan persiapkan dokumen cetak CV.',
            'confidence_score' => 0.98,
            'uncertainty_notes' => null,
        ],
    ]);

    $response = $this->postJson(route('api.v1.email.events.triage', $event->id));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'classification',
                'classification_label',
                'extracted_payload' => [
                    'company_name',
                    'job_title',
                    'interview_details' => [
                        'interview_type_mode',
                        'location',
                        'maps_url',
                    ],
                ],
            ],
        ]);

    $data = $response->json('data');
    expect($data['classification'])->toBe('interview_invitation')
        ->and($data['classification_label'])->toBe('Undangan Interview')
        ->and($data['extracted_payload']['company_name'])->toBe('Shopee Indonesia')
        ->and($data['extracted_payload']['interview_details']['interview_type_mode'])->toBe('offline')
        ->and($data['extracted_payload']['interview_details']['maps_url'])->toBe('https://maps.google.com/?q=Pacific+Century+Place');

    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'EmailTriageAgent',
        'status' => 'succeeded',
    ]);
});

test('email classification enum supports the 4 distinct categories: accepted, pending, rejected, and interview_invitation', function () {
    expect(EmailClassification::Accepted->value)->toBe('accepted')
        ->and(EmailClassification::Accepted->label())->toBe('Diterima')
        ->and(EmailClassification::Pending->value)->toBe('pending')
        ->and(EmailClassification::Pending->label())->toBe('Proses / Pending')
        ->and(EmailClassification::Rejected->value)->toBe('rejected')
        ->and(EmailClassification::Rejected->label())->toBe('Ditolak / Rejected')
        ->and(EmailClassification::InterviewInvitation->value)->toBe('interview_invitation')
        ->and(EmailClassification::InterviewInvitation->label())->toBe('Undangan Interview');
});

test('stagnant application detection creates in-app notification and dispatches email alert with similar jobs advice', function () {
    Mail::fake();

    $user = User::factory()->create(['email' => 'jobseeker@example.com']);
    Sanctum::actingAs($user);

    // Create an application that was updated 16 days ago
    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'job_title' => 'Backend Engineer',
        'status' => ApplicationStatus::Applied,
        'applied_at' => now()->subDays(16),
        'updated_at' => now()->subDays(16),
    ]);

    StagnantJobAdvisorAgent::fake([
        [
            'analysis' => 'Lamaran Backend Engineer di Tokopedia sudah tidak ada respon selama 16 hari.',
            'advice' => 'Jangan terpaku pada satu proses. Segera lamar pekerjaan lain untuk menjaga momentum.',
            'recommendations' => [
                [
                    'job_title' => 'Software Engineer - Backend',
                    'reason' => 'Kriteria tech stack sangat mirip (PHP, Laravel, PostgreSQL).',
                    'key_skills' => ['PHP 8', 'Laravel', 'REST API'],
                    'suggested_portals' => ['LinkedIn', 'Glints', 'JobStreet'],
                ],
                [
                    'job_title' => 'Golang / Backend Developer',
                    'reason' => 'Perusahaan fintech banyak membuka posisi sejenis.',
                    'key_skills' => ['Microservices', 'Docker', 'SQL'],
                    'suggested_portals' => ['Indeed', 'Pintarnya'],
                ],
            ],
        ],
    ]);

    // Check single application via endpoint
    $response = $this->postJson(route('api.v1.applications.check-stagnant', $application->id));

    $response->assertStatus(200)
        ->assertJson([
            'is_stagnant' => true,
        ]);

    expect($response->json('data.recommendations'))->toHaveCount(2);

    // In-app notification created
    $notification = Notification::where('user_id', $user->id)
        ->where('job_application_id', $application->id)
        ->where('type', 'stagnant_job_alert')
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toContain('Belum Ada Perkembangan (2 Minggu)')
        ->and($notification->payload['recommendations'])->toHaveCount(2);

    // Email alert sent
    Mail::assertSent(StagnantApplicationAlertMail::class, function (StagnantApplicationAlertMail $mail) use ($user) {
        return $mail->hasTo($user->email);
    });

    // Run console command to verify batch processing
    $this->artisan('app:check-stagnant-applications')
        ->assertExitCode(0);
});
