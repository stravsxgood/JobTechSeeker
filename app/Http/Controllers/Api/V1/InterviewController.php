<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Interviews\StoreInterviewRequest;
use App\Http\Requests\Api\V1\Interviews\UpdateInterviewRequest;
use App\Http\Resources\Api\V1\InterviewResource;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use App\Services\Reminders\ReminderService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class InterviewController extends Controller
{
    /**
     * Display a listing of interviews for the calendar or list view.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $query = $user->interviews()->with('jobApplication.company');

        // Filter by date range (useful for monthly/weekly calendar)
        if ($startDate = $request->input('start_date')) {
            $query->where('start_at', '>=', Carbon::parse($startDate)->startOfDay());
        }

        if ($endDate = $request->input('end_date')) {
            $query->where('start_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by specific job application
        if ($applicationId = $request->input('job_application_id')) {
            $query->where('job_application_id', $applicationId);
        }

        // Order by start time ascending by default
        $query->orderBy('start_at', 'asc');

        $perPage = min(max((int) $request->input('per_page', 50), 1), 100);

        return InterviewResource::collection($query->paginate($perPage));
    }

    /**
     * Store a newly created interview in storage.
     */
    public function store(StoreInterviewRequest $request, ReminderService $reminderService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        // Enforce user ownership of the referenced job application
        /** @var JobApplication $application */
        $application = $user->jobApplications()->where('id', $validated['job_application_id'])->firstOrFail();

        $startAt = Carbon::parse($validated['start_at']);
        $endAt = Carbon::parse($validated['end_at']);

        // Check for schedule conflict with existing active interviews
        $hasConflict = $user->interviews()
            ->where('status', 'scheduled')
            ->where(function ($q) use ($startAt, $endAt) {
                $q->whereBetween('start_at', [$startAt, $endAt])
                    ->orWhereBetween('end_at', [$startAt, $endAt])
                    ->orWhere(function ($sub) use ($startAt, $endAt) {
                        $sub->where('start_at', '<=', $startAt)
                            ->where('end_at', '>=', $endAt);
                    });
            })
            ->exists();

        $interview = Interview::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'job_application_id' => $application->id,
            'interview_type' => $validated['interview_type'],
            'start_at' => $startAt,
            'end_at' => $endAt,
            'timezone' => $validated['timezone'] ?? $user->timezone ?? 'Asia/Jakarta',
            'meeting_url' => $validated['meeting_url'] ?? null,
            'location' => $validated['location'] ?? null,
            'status' => 'scheduled',
            'confirmation_state' => 'not_required',
            'confirmation_source' => 'manual_entry',
            'notes' => $validated['notes'] ?? null,
        ]);

        // Schedule automated reminders
        $reminderService->scheduleForInterview($interview);

        return response()->json([
            'message' => 'Jadwal interview berhasil dibuat',
            'has_conflict' => $hasConflict,
            'data' => new InterviewResource($interview->load('jobApplication.company')),
        ], 201);
    }

    /**
     * Display the specified interview.
     */
    public function show(Request $request, string $id): InterviewResource
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Interview $interview */
        $interview = $user->interviews()
            ->with('jobApplication.company')
            ->where('id', $id)
            ->firstOrFail();

        return new InterviewResource($interview);
    }

    /**
     * Update the specified interview in storage.
     */
    public function update(UpdateInterviewRequest $request, string $id, ReminderService $reminderService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        /** @var Interview $interview */
        $interview = $user->interviews()->where('id', $id)->firstOrFail();

        $startAtChanged = isset($validated['start_at']) &&
            Carbon::parse($validated['start_at'])->ne($interview->start_at);

        $interview->update($validated);

        if ($startAtChanged) {
            $reminderService->rescheduleForInterview($interview);
        }

        if (isset($validated['status']) && $validated['status'] === 'cancelled') {
            $reminderService->cancelPendingForInterview($interview);
        }

        return response()->json([
            'message' => 'Jadwal interview berhasil diperbarui',
            'data' => new InterviewResource($interview->fresh('jobApplication.company')),
        ]);
    }

    /**
     * Remove the specified interview from storage (soft delete).
     */
    public function destroy(Request $request, string $id, ReminderService $reminderService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Interview $interview */
        $interview = $user->interviews()->where('id', $id)->firstOrFail();

        $reminderService->cancelPendingForInterview($interview);

        $interview->delete();

        return response()->json([
            'message' => 'Interview berhasil dihapus',
        ]);
    }
}
