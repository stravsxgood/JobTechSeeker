<?php

use App\Ai\Agents\InterviewPrepAgent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can generate realistic interview simulation from job title and portal url', function () {
    $user = User::factory()->create();

    InterviewPrepAgent::fake([
        [
            'interview_overview' => [
                'job_title' => 'Senior Backend Engineer',
                'job_source' => 'LinkedIn Job Post',
                'interviewer_persona' => 'VP of Engineering & Lead Architect',
                'summary' => 'Sesi wawancara berfokus pada arsitektur sistem terdistribusi, optimasi database, dan kepemimpinan teknis.',
            ],
            'questions' => [
                [
                    'number' => 1,
                    'category' => 'introductory',
                    'question' => 'Ceritakan pengalaman Anda dalam merancang sistem berskala besar dan mengapa Anda tertarik dengan lowongan ini?',
                    'why_asked' => 'Menilai relevansi latar belakang arsitektur dan motivasi kandidat terhadap tantangan di perusahaan.',
                    'key_points_to_answer' => [
                        'Sebutkan metrik skala sistem yang pernah Anda tangani (RPS, throughput data).',
                        'Jelaskan kesesuaian nilai perusahaan dengan tujuan karier Anda.',
                    ],
                    'sample_good_response' => 'Di peran saya sebelumnya, saya memimpin refaktor monolit ke service-oriented architecture yang menangani 2 juta request harian...',
                    'pitfall_to_avoid' => 'Hanya menceritakan resume tanpa menyebutkan dampak bisnis konkret atau alasan spesifik memilih perusahaan ini.',
                ],
                [
                    'number' => 2,
                    'category' => 'technical',
                    'question' => 'Bagaimana Anda menangani N+1 query problem dan race condition saat pemrosesan transaksi tinggi di PostgreSQL?',
                    'why_asked' => 'Menguji pemahaman teknis mendalam tentang concurrency dan query optimization di PostgreSQL.',
                    'key_points_to_answer' => [
                        'Gunakan eager loading with query constraints.',
                        'Terapkan database pessimistic locking (SELECT FOR UPDATE) atau optimistic locking dengan version column.',
                    ],
                    'sample_good_response' => 'Untuk mencegah race condition, pada transaksi sensitif seperti pemotongan saldo, kami menggunakan pessimistic locking di level database...',
                    'pitfall_to_avoid' => 'Hanya mengandalkan locking di level aplikasi tanpa kontrol transaksi database ACID.',
                ],
                [
                    'number' => 3,
                    'category' => 'behavioral',
                    'question' => 'Ceritakan saat di mana Anda tidak setuju dengan keputusan arsitektur tim dan bagaimana Anda menyelesaikannya?',
                    'why_asked' => 'Menilai kemampuan kolaborasi, komunikasi persuasif, dan kedewasaan profesional menggunakan metode STAR.',
                    'key_points_to_answer' => [
                        'Situasi & Tantangan (S & T).',
                        'Aksi berbasis data dan benchmark (A).',
                        'Hasil positif dan konsensus tim (R).',
                    ],
                    'sample_good_response' => 'Ketika tim mempertimbangkan event-driven architecture penuh untuk modul sederhana, saya menyajikan analisis biaya latensi...',
                    'pitfall_to_avoid' => 'Menjelekkan rekan kerja atau bersikeras tanpa bukti data/benchmark.',
                ],
            ],
            'questions_to_ask_interviewer' => [
                [
                    'question' => 'Bagaimana tim teknik mengukur keberhasilan dalam 6 bulan pertama untuk posisi ini?',
                    'purpose' => 'Menunjukkan orientasi pada target kerja yang jelas dan ekspektasi rekruter.',
                ],
                [
                    'question' => 'Tantangan teknis atau skalabilitas terbesar apa yang saat ini sedang dihadapi sistem?',
                    'purpose' => 'Menunjukkan ketertarikan mendalam pada masalah rekayasa sistem yang nyata.',
                ],
            ],
            'preparation_checklist' => [
                'Pelajari produk dan model bisnis perusahaan dari tautan portal LinkedIn.',
                'Siapkan 2 studi kasus arsitektur sistem dari pengalaman Anda dengan diagram mental.',
                'Uji coba simulasi menjawab pertanyaan teknis secara verbal sebelum jadwal interview.',
            ],
        ],
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.interview-preparation'), [
            'job_title' => 'Senior Backend Engineer',
            'job_url' => 'https://www.linkedin.com/jobs/view/987654321',
            'company_name' => 'Tech Fin Innovasi',
            'job_description' => 'Mencari engineer backend berpengalaman dengan PHP/Laravel dan PostgreSQL.',
            'interview_focus' => 'technical',
        ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'request_id',
            'data' => [
                'interview_overview' => [
                    'job_title',
                    'job_source',
                    'interviewer_persona',
                    'summary',
                ],
                'questions' => [
                    '*' => [
                        'number',
                        'category',
                        'question',
                        'why_asked',
                        'key_points_to_answer',
                        'sample_good_response',
                        'pitfall_to_avoid',
                    ],
                ],
                'questions_to_ask_interviewer' => [
                    '*' => [
                        'question',
                        'purpose',
                    ],
                ],
                'preparation_checklist',
            ],
        ]);

    expect($response->json('data.interview_overview.job_title'))->toBe('Senior Backend Engineer')
        ->and($response->json('data.questions'))->toHaveCount(3)
        ->and($response->json('data.questions.1.category'))->toBe('technical')
        ->and($response->json('data.questions_to_ask_interviewer'))->toHaveCount(2);

    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'InterviewPrepAgent',
        'status' => 'succeeded',
    ]);
});

test('interview preparation validates required fields and valid url', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.interview-preparation'), [
            'job_url' => 'not-a-valid-url',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['job_title', 'job_url']);
});

test('interview preparation handles provider failure gracefully', function () {
    $user = User::factory()->create();

    InterviewPrepAgent::fake(function () {
        throw new RuntimeException('Gemini service unavailable');
    });

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.interview-preparation'), [
            'job_title' => 'Product Manager',
            'job_url' => 'https://glints.com/id/opportunities/jobs/12345',
        ]);

    $response->assertStatus(503)
        ->assertJsonPath('code', 'AI_PROVIDER_ERROR');

    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'InterviewPrepAgent',
        'status' => 'failed',
    ]);
});

test('unauthenticated user cannot call interview preparation endpoint', function () {
    $this->postJson(route('api.v1.ai.interview-preparation'), [
        'job_title' => 'Data Analyst',
        'job_url' => 'https://www.jobstreet.co.id/job/12345',
    ])->assertStatus(401);
});
