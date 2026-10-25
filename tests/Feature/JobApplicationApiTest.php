<?php

use App\Enums\ApplicationStatus;
use App\Models\Company;
use App\Models\JobApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

test('authenticated user can create job application with company name and initial history is recorded', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $payload = [
        'company_name' => 'GoTo Gojek Tokopedia',
        'job_title' => 'Senior Backend Engineer',
        'employment_type' => 'full_time',
        'location' => 'Jakarta / Remote',
        'source' => 'LinkedIn',
        'source_url' => 'https://linkedin.com/jobs/view/123456',
        'salary_min' => 20000000,
        'salary_max' => 35000000,
        'salary_currency' => 'IDR',
        'status' => 'applied',
        'applied_at' => now()->toDateString(),
        'notes' => 'Applied via Easy Apply',
    ];

    $response = $this->postJson(route('api.v1.applications.store'), $payload);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'duplicate_warning',
            'data' => [
                'id',
                'job_title',
                'company_name',
                'status',
                'status_label',
                'is_active',
                'employment_type',
                'salary_min',
                'salary_max',
                'status_histories',
            ],
        ]);

    $data = $response->json('data');
    expect($data['job_title'])->toBe('Senior Backend Engineer')
        ->and($data['company_name'])->toBe('GoTo Gojek Tokopedia')
        ->and($data['status'])->toBe('applied')
        ->and($data['is_active'])->toBeTrue()
        ->and(count($data['status_histories']))->toBe(1)
        ->and($data['status_histories'][0]['new_status'])->toBe('applied');

    $this->assertDatabaseHas('job_applications', [
        'id' => $data['id'],
        'user_id' => $user->id,
        'job_title' => 'Senior Backend Engineer',
    ]);

    $this->assertDatabaseHas('companies', [
        'user_id' => $user->id,
        'name' => 'GoTo Gojek Tokopedia',
        'normalized_name' => 'goto gojek tokopedia',
    ]);
});

test('creating application normalizes and reuses existing company for same user', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $company = Company::factory()->create([
        'user_id' => $user->id,
        'name' => 'Traveloka Indonesia',
        'normalized_name' => 'traveloka indonesia',
    ]);

    $response = $this->postJson(route('api.v1.applications.store'), [
        'company_name' => '  TRAVELOKA INDONESIA  ',
        'job_title' => 'Frontend Engineer',
        'status' => 'saved',
    ]);

    $response->assertStatus(201);
    expect($response->json('data.company.id'))->toBe($company->id);
    expect(Company::where('user_id', $user->id)->count())->toBe(1);
});

test('duplicate check warns when user has application with same company and title', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $company = Company::factory()->create([
        'user_id' => $user->id,
        'name' => 'Bukalapak',
        'normalized_name' => 'bukalapak',
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'job_title' => 'Product Manager',
        'status' => ApplicationStatus::Applied,
    ]);

    $checkResponse = $this->getJson(route('api.v1.applications.check-duplicate', [
        'company_name' => 'Bukalapak',
        'job_title' => 'Product Manager',
    ]));

    $checkResponse->assertStatus(200)
        ->assertJson([
            'has_duplicate' => true,
        ]);
    expect($checkResponse->json('existing_application.job_title'))->toBe('Product Manager');

    // Store endpoint should also return duplicate_warning = true
    $storeResponse = $this->postJson(route('api.v1.applications.store'), [
        'company_name' => 'Bukalapak',
        'job_title' => 'Product Manager',
        'status' => 'saved',
    ]);

    $storeResponse->assertStatus(201)
        ->assertJson(['duplicate_warning' => true]);
});

test('user can list, search, filter, and paginate applications', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $companyA = Company::factory()->create(['user_id' => $user->id, 'name' => 'Shopee']);
    $companyB = Company::factory()->create(['user_id' => $user->id, 'name' => 'Tokopedia']);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $companyA->id,
        'job_title' => 'DevOps Specialist',
        'status' => ApplicationStatus::Applied,
        'source' => 'LinkedIn',
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $companyB->id,
        'job_title' => 'Data Analyst',
        'status' => ApplicationStatus::Interview,
        'source' => 'JobStreet',
    ]);

    JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $companyA->id,
        'job_title' => 'Backend Architect',
        'status' => ApplicationStatus::Rejected,
        'source' => 'LinkedIn',
    ]);

    // 1. Search by job title keyword
    $searchResponse = $this->getJson(route('api.v1.applications.index', ['q' => 'DevOps']));
    $searchResponse->assertStatus(200);
    expect($searchResponse->json('data'))->toHaveCount(1)
        ->and($searchResponse->json('data.0.job_title'))->toBe('DevOps Specialist');

    // 2. Filter active_only (Applied, Screening, Assessment, Interview)
    $activeResponse = $this->getJson(route('api.v1.applications.index', ['active_only' => true]));
    $activeResponse->assertStatus(200);
    expect($activeResponse->json('data'))->toHaveCount(2);

    // 3. Filter by status
    $statusResponse = $this->getJson(route('api.v1.applications.index', ['status' => 'interview']));
    $statusResponse->assertStatus(200);
    expect($statusResponse->json('data'))->toHaveCount(1)
        ->and($statusResponse->json('data.0.status'))->toBe('interview');

    // 4. Filter by source
    $sourceResponse = $this->getJson(route('api.v1.applications.index', ['source' => 'JobStreet']));
    $sourceResponse->assertStatus(200);
    expect($sourceResponse->json('data'))->toHaveCount(1);
});

test('user can update job application fields', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $company = Company::factory()->create(['user_id' => $user->id, 'name' => 'Blibli']);
    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'company_id' => $company->id,
        'job_title' => 'QA Engineer',
        'salary_min' => 10000000,
    ]);

    $response = $this->patchJson(route('api.v1.applications.update', $application->id), [
        'job_title' => 'Lead QA Automation Engineer',
        'salary_min' => 15000000,
        'notes' => 'Updated notes after interview',
    ]);

    $response->assertStatus(200);
    expect($response->json('data.job_title'))->toBe('Lead QA Automation Engineer')
        ->and($response->json('data.salary_min'))->toBe('15000000.00');

    $this->assertDatabaseHas('job_applications', [
        'id' => $application->id,
        'job_title' => 'Lead QA Automation Engineer',
    ]);
});

test('user can soft-delete application and related pending reminders are cancelled', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $application = JobApplication::factory()->create(['user_id' => $user->id]);

    $response = $this->deleteJson(route('api.v1.applications.destroy', $application->id));

    $response->assertStatus(200)
        ->assertJson(['message' => 'Lamaran berhasil dihapus']);

    $this->assertSoftDeleted('job_applications', ['id' => $application->id]);

    // Application is hidden from index
    $indexResponse = $this->getJson(route('api.v1.applications.index'));
    expect($indexResponse->json('data'))->toHaveCount(0);
});

test('status transition follows workflow rules and writes audit history', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $application = JobApplication::factory()->create([
        'user_id' => $user->id,
        'status' => ApplicationStatus::Applied,
    ]);

    // 1. Valid transition: applied -> screening
    $transitionResponse = $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'screening',
        'notes' => 'Lolos verifikasi berkas awal oleh HR',
    ]);

    $transitionResponse->assertStatus(200);
    expect($transitionResponse->json('data.status'))->toBe('screening');

    $this->assertDatabaseHas('application_status_histories', [
        'job_application_id' => $application->id,
        'previous_status' => 'applied',
        'new_status' => 'screening',
        'notes' => 'Lolos verifikasi berkas awal oleh HR',
    ]);

    // 2. Next transition: screening -> interview
    $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'interview',
    ])->assertStatus(200);

    // 3. Invalid transition: interview -> saved (cannot revert directly to saved)
    $invalidResponse = $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'saved',
    ]);
    $invalidResponse->assertStatus(422)
        ->assertJsonValidationErrors(['status']);

    // 4. Offer to withdrawn requires mandatory notes
    $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'offer',
    ])->assertStatus(200);

    $withdrawWithoutNotes = $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'withdrawn',
        'notes' => '',
    ]);
    $withdrawWithoutNotes->assertStatus(422)
        ->assertJsonValidationErrors(['notes']);

    $withdrawWithNotes = $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'withdrawn',
        'notes' => 'Menolak offer karena kompensasi di bawah ekspektasi',
    ]);
    $withdrawWithNotes->assertStatus(200);
    expect($withdrawWithNotes->json('data.status'))->toBe('withdrawn');
});

test('cross-user access is strictly denied', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();

    $application = JobApplication::factory()->create(['user_id' => $owner->id]);

    Sanctum::actingAs($stranger);

    // Stranger cannot view
    $this->getJson(route('api.v1.applications.show', $application->id))->assertStatus(404);

    // Stranger cannot update
    $this->patchJson(route('api.v1.applications.update', $application->id), [
        'job_title' => 'Hacked Title',
    ])->assertStatus(404);

    // Stranger cannot delete
    $this->deleteJson(route('api.v1.applications.destroy', $application->id))->assertStatus(404);

    // Stranger cannot change status
    $this->postJson(route('api.v1.applications.status', $application->id), [
        'status' => 'interview',
    ])->assertStatus(404);
});
