<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Applications\StoreJobApplicationRequest;
use App\Http\Requests\Api\V1\Applications\TransitionApplicationStatusRequest;
use App\Http\Requests\Api\V1\Applications\UpdateJobApplicationRequest;
use App\Http\Resources\Api\V1\JobApplicationResource;
use App\Models\ApplicationStatusHistory;
use App\Models\Company;
use App\Models\JobApplication;
use App\Models\User;
use App\Services\Applications\ApplicationStatusTransitionService;
use App\Services\Applications\StagnantApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JobApplicationController extends Controller
{
    /**
     * Display a paginated listing of job applications with filtering, search, and sorting.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $query = $user->jobApplications()->with('company');

        // Search query across job title and company name
        if ($search = $request->input('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('job_title', 'like', "%{$search}%")
                    ->orWhereHas('company', function ($companyQuery) use ($search) {
                        $companyQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status (single string or array)
        if ($statuses = $request->input('status')) {
            $statusList = is_array($statuses) ? $statuses : explode(',', $statuses);
            $query->whereIn('status', $statusList);
        }

        // Filter active applications only
        if ($request->boolean('active_only')) {
            $query->whereIn('status', [
                ApplicationStatus::Applied->value,
                ApplicationStatus::Screening->value,
                ApplicationStatus::Assessment->value,
                ApplicationStatus::Interview->value,
            ]);
        }

        // Filter by source
        if ($source = $request->input('source')) {
            $query->where('source', $source);
        }

        // Filter by employment type
        if ($employmentType = $request->input('employment_type')) {
            $query->where('employment_type', $employmentType);
        }

        // Allowlisted sorting
        $allowedSorts = ['updated_at', 'created_at', 'applied_at', 'job_title', 'follow_up_at'];
        $sortField = in_array($request->input('sort'), $allowedSorts, true) ? $request->input('sort') : 'updated_at';
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortField, $direction);

        // Bounded pagination (default 20, max 100)
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return JobApplicationResource::collection($query->paginate($perPage));
    }

    /**
     * Store a newly created job application in storage.
     */
    public function store(StoreJobApplicationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $company = $this->resolveCompany($user, $validated);

        /** @var ApplicationStatus $status */
        $status = is_string($validated['status'])
            ? ApplicationStatus::from($validated['status'])
            : $validated['status'];

        $application = DB::transaction(function () use ($user, $company, $validated, $status) {
            $app = JobApplication::create([
                'id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'company_id' => $company->id,
                'job_title' => $validated['job_title'],
                'description' => $validated['description'] ?? null,
                'source' => $validated['source'] ?? null,
                'source_url' => $validated['source_url'] ?? null,
                'employment_type' => $validated['employment_type'] ?? null,
                'location' => $validated['location'] ?? null,
                'salary_min' => $validated['salary_min'] ?? null,
                'salary_max' => $validated['salary_max'] ?? null,
                'salary_currency' => $validated['salary_currency'] ?? 'IDR',
                'applied_at' => $validated['applied_at'] ?? ($status === ApplicationStatus::Applied ? now() : null),
                'status' => $status,
                'notes' => $validated['notes'] ?? null,
                'follow_up_at' => $validated['follow_up_at'] ?? null,
            ]);

            // Create initial status history row
            ApplicationStatusHistory::create([
                'id' => (string) Str::uuid(),
                'job_application_id' => $app->id,
                'previous_status' => null,
                'new_status' => $status->value,
                'change_source' => 'initial',
                'notes' => 'Pencatatan lamaran awal',
                'actor_user_id' => $user->id,
                'changed_at' => now(),
            ]);

            return $app;
        });

        // Check for potential duplicate warning
        $duplicateWarning = $user->jobApplications()
            ->where('id', '!=', $application->id)
            ->where('company_id', $company->id)
            ->where('job_title', $application->job_title)
            ->exists();

        return response()->json([
            'message' => 'Lamaran berhasil disimpan',
            'duplicate_warning' => $duplicateWarning,
            'data' => new JobApplicationResource($application->load('company', 'statusHistories')),
        ], 201);
    }

    /**
     * Display the specified job application.
     */
    public function show(Request $request, string $id): JobApplicationResource
    {
        /** @var User $user */
        $user = $request->user();

        $application = $user->jobApplications()
            ->with(['company', 'statusHistories', 'interviews'])
            ->findOrFail($id);

        return new JobApplicationResource($application);
    }

    /**
     * Update the specified job application in storage.
     */
    public function update(UpdateJobApplicationRequest $request, string $id): JobApplicationResource
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $application = $user->jobApplications()->findOrFail($id);

        if (! empty($validated['company_name']) || ! empty($validated['company_id'])) {
            $company = $this->resolveCompany($user, $validated);
            $validated['company_id'] = $company->id;
            unset($validated['company_name']);
        }

        $application->update($validated);

        return new JobApplicationResource($application->fresh(['company', 'statusHistories']));
    }

    /**
     * Remove the specified job application from storage (soft delete).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $application = $user->jobApplications()->findOrFail($id);

        // Cancel pending reminders related to this application
        $application->reminders()->where('status', 'pending')->update(['status' => 'cancelled']);

        $application->delete();

        return response()->json([
            'message' => 'Lamaran berhasil dihapus',
        ], 200);
    }

    /**
     * Transition the application status through the dedicated workflow.
     */
    public function changeStatus(
        TransitionApplicationStatusRequest $request,
        string $id,
        ApplicationStatusTransitionService $transitionService
    ): JobApplicationResource {
        /** @var User $user */
        $user = $request->user();

        $application = $user->jobApplications()->findOrFail($id);

        /** @var ApplicationStatus $newStatus */
        $newStatus = $request->enum('status', ApplicationStatus::class);
        $notes = $request->input('notes');
        $source = $request->input('source', 'user');

        $updated = $transitionService->transition(
            $application,
            $newStatus,
            $notes,
            $source,
            $user->id
        );

        return new JobApplicationResource($updated);
    }

    /**
     * Check if a duplicate application with same company and title already exists.
     */
    public function duplicateCheck(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $companyName = trim((string) $request->input('company_name', ''));
        $jobTitle = trim((string) $request->input('job_title', ''));

        if (empty($companyName) || empty($jobTitle)) {
            return response()->json(['has_duplicate' => false, 'existing_application' => null]);
        }

        $normalizedName = Str::lower($companyName);

        $existing = $user->jobApplications()
            ->where('job_title', $jobTitle)
            ->whereHas('company', fn ($q) => $q->where('normalized_name', $normalizedName))
            ->with('company')
            ->first();

        return response()->json([
            'has_duplicate' => $existing !== null,
            'existing_application' => $existing ? new JobApplicationResource($existing) : null,
        ]);
    }

    /**
     * Check if application is stagnant (14+ days) and generate AI advice and similar job recommendations.
     */
    public function checkStagnant(Request $request, string $id, StagnantApplicationService $stagnantService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var JobApplication $application */
        $application = $user->jobApplications()
            ->with(['company', 'user.careerPreference'])
            ->where('id', $id)
            ->firstOrFail();

        $result = $stagnantService->checkAndNotify($application);

        if ($result === null) {
            return response()->json([
                'message' => 'Lamaran ini belum memenuhi kriteria stagnan (belum mencapai 14 hari tanpa perkembangan atau sudah diberi notifikasi pada siklus ini).',
                'is_stagnant' => false,
                'data' => null,
            ]);
        }

        return response()->json([
            'message' => 'Peringatan lamaran stagnan berhasil diproses dan rekomendasi AI telah dibuat',
            'is_stagnant' => true,
            'data' => $result,
        ]);
    }

    /**
     * Resolve company by ID or find/create by normalized name for current user.
     *
     * @param  array<string, mixed>  $data
     */
    protected function resolveCompany(User $user, array $data): Company
    {
        if (! empty($data['company_id'])) {
            /** @var Company $company */
            $company = $user->companies()->where('id', $data['company_id'])->firstOrFail();

            return $company;
        }

        $name = trim((string) $data['company_name']);
        $normalized = Str::lower($name);

        /** @var Company $company */
        $company = $user->companies()->firstOrCreate(
            ['normalized_name' => $normalized],
            [
                'id' => (string) Str::uuid(),
                'name' => $name,
            ]
        );

        return $company;
    }
}
