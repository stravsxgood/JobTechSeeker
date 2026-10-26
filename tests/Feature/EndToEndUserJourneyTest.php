<?php

use App\Ai\Agents\CareerPlannerAgent;
use App\Ai\Agents\InterviewPrepAgent;
use App\Enums\ApplicationStatus;
use App\Enums\ConnectionStatus;
use App\Enums\EmailProcessingStatus;
use App\Models\ConnectedEmailAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('comprehensive end-to-end user journey across all seven platform domains', function () {
    // -------------------------------------------------------------
    // STEP 1: Registration and Token Generation (FR-AUTH-001)
    // -------------------------------------------------------------
    $registerResponse = $this->postJson(route('api.v1.register'), [
        'name' => 'Aditya Pratama',
        'email' => 'aditya.pratama@example.com',
        'password' => 'CareerPilot2026!#',
        'password_confirmation' => 'CareerPilot2026!#',
        'timezone' => 'Asia/Jakarta',
        'locale' => 'id-ID',
    ]);

    $registerResponse->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'data' => [
                'id',
                'name',
                'email',
                'timezone',
                'locale',
            ],
            'token',
        ]);

    $token = $registerResponse->json('token');
    $user = User::where('email', 'aditya.pratama@example.com')->firstOrFail();

    // -------------------------------------------------------------
    // STEP 2: Authenticated Inertia Frontend Pages Verification
    // -------------------------------------------------------------
    $this->actingAs($user);

    $pages = [
        'dashboard',
        'applications',
        'kanban',
        'interviews',
        'notifications',
        'ai.career-planner',
        'ai.interview-copilot',
        'analytics',
        'integrations',
        'settings',
    ];

    foreach ($pages as $routeName) {
        $pageResponse = $this->get(route($routeName));
        $pageResponse->assertStatus(200);
    }

    // -------------------------------------------------------------
    // STEP 3: Profile & Career Preferences Management (FR-AUTH-002)
    // -------------------------------------------------------------
    $meResponse = $this->withToken($token)->getJson(route('api.v1.me'));
    $meResponse->assertStatus(200)
        ->assertJsonPath('data.name', 'Aditya Pratama')
        ->assertJsonPath('data.email', 'aditya.pratama@example.com');

    $updateProfileResponse = $this->withToken($token)->patchJson(route('api.v1.me.update'), [
        'name' => 'Aditya Pratama, S.Kom.',
        'timezone' => 'Asia/Jakarta',
        'target_roles' => ['Senior Backend Engineer', 'Tech Lead'],
        'preferred_locations' => ['Jakarta', 'Remote'],
        'salary_expectation_min' => 18000000,
        'salary_expectation_max' => 28000000,
        'salary_currency' => 'IDR',
        'weekly_application_target' => 7,
    ]);

    $updateProfileResponse->assertStatus(200)
        ->assertJsonPath('data.name', 'Aditya Pratama, S.Kom.')
        ->assertJsonPath('data.career_preference.target_roles', ['Senior Backend Engineer', 'Tech Lead'])
        ->assertJsonPath('data.career_preference.weekly_application_target', 7);

    // -------------------------------------------------------------
    // STEP 4: Job Application Duplicate Check & Creation (FR-APP-001 & FR-APP-002)
    // -------------------------------------------------------------
    $preCheck = $this->withToken($token)->getJson(route('api.v1.applications.check-duplicate', [
        'company_name' => 'GoTo Financial',
        'job_title' => 'Senior Backend Engineer',
    ]));

    $preCheck->assertStatus(200)
        ->assertJsonPath('has_duplicate', false);

    $createAppResponse = $this->withToken($token)->postJson(route('api.v1.applications.store'), [
        'company_name' => 'GoTo Financial',
        'job_title' => 'Senior Backend Engineer',
        'status' => 'applied',
        'job_type' => 'full-time',
        'work_setting' => 'hybrid',
        'location' => 'Jakarta Selatan',
        'source' => 'LinkedIn',
        'salary_min' => 20000000,
        'salary_max' => 25000000,
        'salary_currency' => 'IDR',
        'applied_at' => now()->toDateString(),
        'notes' => 'Melamar melalui koneksi LinkedIn referral tech recruiter.',
    ]);

    $createAppResponse->assertStatus(201)
        ->assertJsonPath('data.job_title', 'Senior Backend Engineer')
        ->assertJsonPath('data.company.name', 'GoTo Financial')
        ->assertJsonPath('data.status', 'applied');

    $appId = $createAppResponse->json('data.id');

    // Duplicate check now reports true
    $postCheck = $this->withToken($token)->getJson(route('api.v1.applications.check-duplicate', [
        'company_name' => 'GoTo Financial',
        'job_title' => 'Senior Backend Engineer',
    ]));

    $postCheck->assertStatus(200)
        ->assertJsonPath('has_duplicate', true);

    // -------------------------------------------------------------
    // STEP 5: Status Transition Workflow (FR-APP-003)
    // -------------------------------------------------------------
    $transitionResponse = $this->withToken($token)->postJson(route('api.v1.applications.status', $appId), [
        'status' => 'interview',
        'notes' => 'Lolos tahap screening, lanjut technical interview dengan Engineering Manager.',
    ]);

    $transitionResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'interview');

    // Verify history recorded in database
    $this->assertDatabaseHas('application_status_histories', [
        'job_application_id' => $appId,
        'previous_status' => 'applied',
        'new_status' => 'interview',
    ]);

    // -------------------------------------------------------------
    // STEP 6: Stagnant Job Detection Check (FR-APP-004)
    // -------------------------------------------------------------
    $stagnantResponse = $this->withToken($token)->postJson(route('api.v1.applications.check-stagnant', $appId));
    $stagnantResponse->assertStatus(200)
        ->assertJsonStructure([
            'is_stagnant',
            'message',
        ]);

    // -------------------------------------------------------------
    // STEP 7: Interview Calendar & Conflict Resolution (FR-INT-001 ~ FR-INT-003)
    // -------------------------------------------------------------
    $interviewStart = now()->addDays(2)->setTime(10, 0, 0);
    $interviewEnd = (clone $interviewStart)->addHours(1);

    $interviewResponse = $this->withToken($token)->postJson(route('api.v1.interviews.store'), [
        'job_application_id' => $appId,
        'interview_type' => 'User & System Design Interview',
        'start_at' => $interviewStart->toIso8601String(),
        'end_at' => $interviewEnd->toIso8601String(),
        'timezone' => 'Asia/Jakarta',
        'meeting_url' => 'https://meet.google.com/goto-tech-interview',
        'location' => 'Google Meet',
        'notes' => 'Presentasi arsitektur microservices dan idempotency.',
    ]);

    $interviewResponse->assertStatus(201)
        ->assertJsonPath('has_conflict', false)
        ->assertJsonPath('data.interview_type', 'User & System Design Interview');

    $interviewId = $interviewResponse->json('data.id');

    // Test conflict detection on overlapping slot
    $conflictResponse = $this->withToken($token)->postJson(route('api.v1.interviews.store'), [
        'job_application_id' => $appId,
        'interview_type' => 'Culture Fit Interview',
        'start_at' => (clone $interviewStart)->addMinutes(15)->toIso8601String(),
        'end_at' => (clone $interviewEnd)->addMinutes(15)->toIso8601String(),
        'timezone' => 'Asia/Jakarta',
        'meeting_url' => 'https://meet.google.com/conflict-test',
    ]);

    $conflictResponse->assertStatus(201)
        ->assertJsonPath('has_conflict', true);

    // Update interview status to completed
    $updateInterview = $this->withToken($token)->patchJson(route('api.v1.interviews.update', $interviewId), [
        'status' => 'completed',
        'notes' => 'Sesi interview berjalan lancar. Hasil akan diumumkan 3 hari kerja.',
    ]);

    $updateInterview->assertStatus(200)
        ->assertJsonPath('data.status', 'completed');

    // -------------------------------------------------------------
    // STEP 8: Email Triage Simulation & Event Confirmation (FR-EMAIL-001 ~ FR-EMAIL-003)
    // -------------------------------------------------------------
    $emailAccount = ConnectedEmailAccount::factory()->create([
        'user_id' => $user->id,
        'email_address' => 'aditya.pratama@gmail.com',
        'connection_status' => ConnectionStatus::Connected,
    ]);

    $simulateResponse = $this->withToken($token)->postJson(route('api.v1.email.events.simulate'), [
        'type' => 'offer',
    ]);

    $simulateResponse->assertStatus(201)
        ->assertJsonPath('data.processing_status', EmailProcessingStatus::AwaitingReview->value);

    $eventId = $simulateResponse->json('data.id');

    // Confirm email triage event into an active offer
    $confirmEventResponse = $this->withToken($token)->postJson(route('api.v1.email.events.confirm', $eventId), [
        'action' => 'update_status',
        'status' => ApplicationStatus::Offer->value,
    ]);

    $confirmEventResponse->assertStatus(200)
        ->assertJsonPath('data.processing_status', EmailProcessingStatus::Confirmed->value);

    // -------------------------------------------------------------
    // STEP 9: Notification Center & Read Management
    // -------------------------------------------------------------
    $unreadCountResponse = $this->withToken($token)->getJson(route('api.v1.notifications.unread-count'));
    $unreadCountResponse->assertStatus(200)
        ->assertJsonStructure(['unread_count']);

    $notificationsResponse = $this->withToken($token)->getJson(route('api.v1.notifications.index'));
    $notificationsResponse->assertStatus(200);

    // -------------------------------------------------------------
    // STEP 10: Career Analytics & KPIs (FR-AN-001)
    // -------------------------------------------------------------
    $analyticsResponse = $this->withToken($token)->getJson(route('api.v1.analytics'));
    $analyticsResponse->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'summary' => [
                    'total_applications',
                    'total_applied',
                    'total_interviews',
                    'total_offers',
                    'response_rate_percentage',
                    'interview_conversion_rate_percentage',
                    'offer_rate_percentage',
                    'average_days_in_pipeline',
                ],
                'pipeline_breakdown',
                'by_source',
                'monthly_trend',
                'weekly_target' => [
                    'target',
                    'current',
                    'percentage',
                ],
            ],
        ]);

    // -------------------------------------------------------------
    // STEP 11: Security & Password Update (FR-AUTH-002)
    // -------------------------------------------------------------
    $updatePasswordResponse = $this->withToken($token)->patchJson(route('api.v1.me.update'), [
        'current_password' => 'CareerPilot2026!#',
        'password' => 'NewStrongPass2026!#',
        'password_confirmation' => 'NewStrongPass2026!#',
    ]);

    $updatePasswordResponse->assertStatus(200);

    // -------------------------------------------------------------
    // STEP 12: Account Deletion and Revocation (FR-AUTH-003)
    // -------------------------------------------------------------
    $deleteResponse = $this->withToken($token)->deleteJson(route('api.v1.me.delete'), [
        'password' => 'NewStrongPass2026!#',
    ]);

    $deleteResponse->assertStatus(200)
        ->assertJsonPath('message', 'Akun Anda berhasil dihapus beserta seluruh sesi akses.');

    // User is soft deleted
    $this->assertSoftDeleted('users', [
        'id' => $user->id,
    ]);

    // Sanctum tokens are revoked
    expect($user->tokens()->count())->toBe(0);

    // Disconnected email accounts
    expect($emailAccount->fresh()->connection_status)->toBe(ConnectionStatus::Disconnected);

    // Cannot access protected endpoint anymore
    $this->app['auth']->forgetGuards();
    $deniedResponse = $this->withToken($token)->getJson(route('api.v1.me'));
    $deniedResponse->assertStatus(401);
});

test('end-to-end ai planner and interview copilot execution pipeline', function () {
    $user = User::factory()->create();
    $token = $user->createToken('ai-test-token')->plainTextToken;

    CareerPlannerAgent::fake([
        [
            'summary' => 'Roadmap 3 bulan transisi dari Frontend ke Fullstack Developer.',
            'target_role' => 'Fullstack Developer',
            'duration_months' => 3,
            'skill_gap_analysis' => [
                'matching_skills' => ['React', 'TypeScript'],
                'missing_skills' => ['Laravel', 'PostgreSQL'],
            ],
            'milestones' => [
                [
                    'month' => 1,
                    'theme' => 'Backend Fundamentals',
                    'description' => 'Mempelajari Laravel framework dan database migrations.',
                    'action_items' => ['Bangun API CRUD sederhana'],
                    'learning_resources' => [
                        [
                            'skill_name' => 'Laravel REST API',
                            'media_type' => 'documentation',
                            'platform_or_channel' => 'Laravel Docs',
                            'title' => 'Official Guide',
                            'search_query_or_url' => 'https://laravel.com/docs',
                            'why_recommended' => 'Dokumentasi resmi standar industri.',
                        ],
                    ],
                ],
            ],
            'portfolio_projects' => [
                [
                    'title' => 'Fullstack SaaS Application',
                    'description' => 'Aplikasi pencatatan lamaran dengan auth dan analitik.',
                    'tech_stack' => ['Laravel', 'React', 'PostgreSQL'],
                    'key_features' => ['Auth', 'Kanban Board', 'Analytics'],
                ],
            ],
            'career_tips' => ['Buat portofolio live', 'Optimalkan LinkedIn headline'],
        ],
    ]);

    $planResponse = $this->withToken($token)->postJson(route('api.v1.ai.career-plan'), [
        'target_role' => 'Fullstack Developer',
        'duration_months' => 3,
        'current_skills' => ['React', 'TypeScript', 'Tailwind CSS'],
        'cv_text' => 'Frontend developer dengan pengalaman 1 tahun membangun SPA dengan React.',
        'notes' => 'Ingin fokus ke ekosistem Laravel dan PostgreSQL.',
    ]);

    $planResponse->assertStatus(200)
        ->assertJsonPath('data.target_role', 'Fullstack Developer')
        ->assertJsonPath('data.duration_months', 3);

    // Verify AI generation log recorded in database
    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'CareerPlannerAgent',
        'status' => 'succeeded',
    ]);

    // Test Interview Copilot Prep
    InterviewPrepAgent::fake([
        [
            'interview_overview' => [
                'job_title' => 'Fullstack Developer',
                'job_source' => 'LinkedIn Job Post',
                'interviewer_persona' => 'Engineering Manager',
                'summary' => 'Simulasi interview teknis komprehensif.',
            ],
            'questions' => [
                [
                    'number' => 1,
                    'category' => 'technical',
                    'question' => 'Bagaimana Anda merancang REST API yang idempotent?',
                    'why_asked' => 'Menilai pemahaman arsitektur backend.',
                    'key_points_to_answer' => ['Gunakan idempotency keys', 'Pastikan operasi GET/PUT/DELETE idempotent'],
                    'sample_good_response' => 'Idempotensi memastikan request yang diulang memiliki efek yang sama...',
                    'pitfall_to_avoid' => 'Tidak menangani retry mechanism.',
                ],
            ],
            'cheat_sheet' => [
                'star_method_examples' => [
                    [
                        'situation' => 'Menghadapi race condition pada checkout.',
                        'task' => 'Mencegah double payment.',
                        'action' => 'Menerapkan pessimistic locking di database.',
                        'result' => 'Zero duplicate charge dan audit log rapi.',
                    ],
                ],
                'questions_to_ask_interviewer' => [
                    'Bagaimana proses deployment dan code review di tim engineering?',
                ],
                'red_flags_to_watch' => ['Tidak ada automated testing.'],
            ],
            'actionable_tips' => ['Latih berbicara lugas dan percaya diri.'],
        ],
    ]);

    $prepResponse = $this->withToken($token)->postJson(route('api.v1.ai.interview-preparation'), [
        'job_title' => 'Fullstack Developer',
        'job_url' => 'https://www.linkedin.com/jobs/view/123456789',
        'company_name' => 'Tech Fin Innovasi',
        'job_description' => 'Membangun aplikasi web performa tinggi dengan Laravel dan React.',
        'interview_focus' => 'technical',
    ]);

    $prepResponse->assertStatus(200)
        ->assertJsonPath('data.interview_overview.job_title', 'Fullstack Developer')
        ->assertJsonCount(1, 'data.questions');

    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'InterviewPrepAgent',
        'status' => 'succeeded',
    ]);
});
