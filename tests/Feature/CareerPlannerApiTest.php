<?php

use App\Ai\Agents\CareerPlannerAgent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can generate career roadmap with skill gap and media recommendations', function () {
    $user = User::factory()->create();

    CareerPlannerAgent::fake([
        [
            'summary' => 'Profil Anda memiliki dasar kuat di frontend dan siap bertransisi ke Fullstack Developer dalam 3 bulan.',
            'target_role' => 'Fullstack Developer',
            'duration_months' => 3,
            'skill_gap_analysis' => [
                'matching_skills' => ['React', 'JavaScript', 'Tailwind CSS'],
                'missing_skills' => ['Laravel', 'PostgreSQL', 'Docker'],
            ],
            'milestones' => [
                [
                    'month' => 1,
                    'theme' => 'Backend Fundamentals with Laravel',
                    'description' => 'Mempelajari routing, controller, Eloquent ORM, dan REST API.',
                    'action_items' => ['Buat REST API sederhana dengan Laravel', 'Pelajari Eloquent relationships'],
                    'learning_resources' => [
                        [
                            'skill_name' => 'Laravel REST API',
                            'media_type' => 'youtube',
                            'platform_or_channel' => 'Traversy Media',
                            'title' => 'Laravel REST API Crash Course',
                            'search_query_or_url' => 'https://youtube.com/watch?v=example',
                            'why_recommended' => 'Menjelaskan konsep controller, resource, dan token Sanctum secara ringkas.',
                        ],
                        [
                            'skill_name' => 'Laravel Documentation',
                            'media_type' => 'documentation',
                            'platform_or_channel' => 'Laravel Official Docs',
                            'title' => 'Laravel Routing and Controllers',
                            'search_query_or_url' => 'https://laravel.com/docs',
                            'why_recommended' => 'Dokumentasi resmi selalu menjadi sumber acuan terbaik untuk praktik standar.',
                        ],
                    ],
                ],
            ],
            'portfolio_projects' => [
                [
                    'title' => 'Job Application Tracker Fullstack',
                    'description' => 'Aplikasi pencatatan lamaran dengan Laravel API dan React Inertia.',
                    'tech_stack' => ['Laravel', 'React', 'PostgreSQL'],
                ],
            ],
            'tips_for_success' => [
                'Luangkan 2 jam setiap hari untuk coding hands-on.',
                'Publish proyek mingguan ke GitHub.',
            ],
        ],
    ]);

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.career-plan'), [
            'target_role' => 'Fullstack Developer',
            'duration_months' => 3,
            'current_skills' => ['React', 'JavaScript', 'Tailwind CSS'],
            'cv_text' => 'Frontend developer dengan pengalaman 1 tahun membangun SPA dengan React.',
            'notes' => 'Ingin fokus ke ekosistem Laravel dan backend Postgres.',
        ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'request_id',
            'data' => [
                'summary',
                'target_role',
                'duration_months',
                'skill_gap_analysis' => [
                    'matching_skills',
                    'missing_skills',
                ],
                'milestones' => [
                    '*' => [
                        'month',
                        'theme',
                        'description',
                        'action_items',
                        'learning_resources' => [
                            '*' => [
                                'skill_name',
                                'media_type',
                                'platform_or_channel',
                                'title',
                                'search_query_or_url',
                                'why_recommended',
                            ],
                        ],
                    ],
                ],
                'portfolio_projects' => [
                    '*' => [
                        'title',
                        'description',
                        'tech_stack',
                    ],
                ],
                'tips_for_success',
            ],
        ]);

    expect($response->json('data.duration_months'))->toBe(3)
        ->and($response->json('data.skill_gap_analysis.missing_skills'))->toContain('Laravel')
        ->and($response->json('data.milestones.0.learning_resources.0.media_type'))->toBe('youtube');

    // Verify AI generation log was stored
    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'CareerPlannerAgent',
        'status' => 'succeeded',
    ]);
});

test('career plan request validates required fields and allowed duration', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.career-plan'), [
            'duration_months' => 6, // invalid duration, must be 3 or 5
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['target_role', 'duration_months']);
});

test('ai generation failure handles gracefully and logs failure', function () {
    $user = User::factory()->create();

    CareerPlannerAgent::fake(function () {
        throw new RuntimeException('Gemini API quota exceeded');
    });

    $response = $this->actingAs($user, 'sanctum')
        ->postJson(route('api.v1.ai.career-plan'), [
            'target_role' => 'Backend Engineer',
            'duration_months' => 5,
        ]);

    $response->assertStatus(503)
        ->assertJsonPath('code', 'AI_PROVIDER_ERROR');

    $this->assertDatabaseHas('ai_generation_logs', [
        'user_id' => $user->id,
        'agent_name' => 'CareerPlannerAgent',
        'status' => 'failed',
    ]);
});

test('unauthenticated user cannot call career plan endpoint', function () {
    $this->postJson(route('api.v1.ai.career-plan'), [
        'target_role' => 'Backend Engineer',
        'duration_months' => 3,
    ])->assertStatus(401);
});
