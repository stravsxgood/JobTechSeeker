<?php

namespace App\Http\Controllers\Api\V1;

use App\Ai\Agents\EmailTriageAgent;
use App\Enums\ApplicationStatus;
use App\Enums\EmailClassification;
use App\Enums\EmailProcessingStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\EmailEventResource;
use App\Models\AiGenerationLog;
use App\Models\EmailEvent;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\User;
use App\Services\Applications\ApplicationStatusTransitionService;
use App\Services\Reminders\ReminderService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmailEventController extends Controller
{
    /**
     * Display a listing of detected email events.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $accountIds = $user->connectedEmailAccounts()->pluck('id');

        $query = EmailEvent::whereIn('connected_email_account_id', $accountIds)
            ->with('relatedApplication.company');

        if ($request->boolean('pending_review_only')) {
            $query->where('processing_status', EmailProcessingStatus::AwaitingReview->value);
        }

        if ($classification = $request->input('classification')) {
            $query->where('classification', $classification);
        }

        if ($status = $request->input('processing_status')) {
            $query->where('processing_status', $status);
        }

        $query->orderBy('received_at', 'desc');

        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);

        return EmailEventResource::collection($query->paginate($perPage));
    }

    /**
     * Confirm an email event and optionally apply business actions (e.g. create interview or update status).
     */
    public function confirm(
        Request $request,
        string $id,
        ApplicationStatusTransitionService $transitionService,
        ReminderService $reminderService
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $accountIds = $user->connectedEmailAccounts()->pluck('id');

        /** @var EmailEvent $event */
        $event = EmailEvent::whereIn('connected_email_account_id', $accountIds)
            ->where('id', $id)
            ->firstOrFail();

        $action = $request->input('action_type', 'none');

        DB::transaction(function () use ($request, $user, $event, $action, $transitionService, $reminderService) {
            // Optional Action 1: Create an Interview from confirmed invitation
            if ($action === 'create_interview' && $request->has('interview_details')) {
                $details = $request->input('interview_details', []);
                $applicationId = $details['job_application_id'] ?? $event->related_application_id;

                if ($applicationId) {
                    /** @var JobApplication $app */
                    $app = $user->jobApplications()->where('id', $applicationId)->firstOrFail();

                    $startAt = Carbon::parse($details['start_at']);
                    $endAt = isset($details['end_at']) ? Carbon::parse($details['end_at']) : (clone $startAt)->addHour();

                    $interview = Interview::create([
                        'id' => (string) Str::uuid(),
                        'user_id' => $user->id,
                        'job_application_id' => $app->id,
                        'interview_type' => $details['interview_type'] ?? 'Interview Undangan Email',
                        'start_at' => $startAt,
                        'end_at' => $endAt,
                        'timezone' => $details['timezone'] ?? $user->timezone ?? 'Asia/Jakarta',
                        'meeting_url' => $details['meeting_url'] ?? null,
                        'location' => $details['location'] ?? null,
                        'status' => 'scheduled',
                        'confirmation_state' => 'confirmed',
                        'confirmation_source' => 'email_review',
                        'source_email_event_id' => $event->id,
                        'notes' => $details['notes'] ?? 'Dikonfirmasi dari email: '.$event->subject,
                    ]);

                    $reminderService->scheduleForInterview($interview);
                }
            }

            // Optional Action 2: Update Application Status (e.g. to interview, offer, or rejected)
            if ($action === 'update_status' && $request->has('status') && $event->related_application_id) {
                /** @var JobApplication $app */
                $app = $user->jobApplications()->where('id', $event->related_application_id)->firstOrFail();
                $newStatus = ApplicationStatus::from((string) $request->input('status'));

                $transitionService->transition(
                    $app,
                    $newStatus,
                    $request->input('notes', 'Diperbarui melalui konfirmasi email: '.$event->subject),
                    'email_review',
                    $user->id
                );
            }

            // Update event status
            $event->update([
                'processing_status' => EmailProcessingStatus::Confirmed,
                'reviewed_at' => now(),
                'reviewed_by_user_id' => $user->id,
            ]);
        });

        return response()->json([
            'message' => 'Event email berhasil dikonfirmasi',
            'data' => new EmailEventResource($event->fresh('relatedApplication.company')),
        ]);
    }

    /**
     * Dismiss an email event (ignore it from further action).
     */
    public function dismiss(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $accountIds = $user->connectedEmailAccounts()->pluck('id');

        /** @var EmailEvent $event */
        $event = EmailEvent::whereIn('connected_email_account_id', $accountIds)
            ->where('id', $id)
            ->firstOrFail();

        $event->update([
            'processing_status' => EmailProcessingStatus::Dismissed,
            'reviewed_at' => now(),
            'reviewed_by_user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Event email berhasil diabaikan (dismissed)',
            'data' => new EmailEventResource($event->fresh('relatedApplication.company')),
        ]);
    }

    /**
     * Run AI Triage on the email event to extract company, role, interview details, and map/meeting links.
     */
    public function triage(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $accountIds = $user->connectedEmailAccounts()->pluck('id');

        /** @var EmailEvent $event */
        $event = EmailEvent::whereIn('connected_email_account_id', $accountIds)
            ->where('id', $id)
            ->firstOrFail();

        $prompt = "Analisis pesan email rekrutmen berikut:\n";
        $prompt .= "- Pengirim: {$event->sender_name} <{$event->sender_address}>\n";
        $prompt .= "- Subjek: {$event->subject}\n";
        $prompt .= "- Cuplikan Pesan: {$event->snippet}\n";

        $startTime = microtime(true);
        $status = 'succeeded';
        $errorMessage = null;

        try {
            $agent = new EmailTriageAgent;
            $aiResponse = $agent->prompt($prompt);
            $aiData = $aiResponse->toArray();

            $classification = EmailClassification::tryFrom((string) ($aiData['classification'] ?? ''))
                ?? EmailClassification::Pending;

            $event->update([
                'classification' => $classification,
                'extracted_payload' => $aiData,
                'uncertainty_notes' => $aiData['uncertainty_notes'] ?? null,
                'processing_status' => EmailProcessingStatus::AwaitingReview,
                'requires_confirmation' => true,
            ]);

            // If not yet linked to an application, try to match by extracted company_name
            if (! $event->related_application_id && ! empty($aiData['company_name'])) {
                /** @var JobApplication|null $matchedApp */
                $matchedApp = $user->jobApplications()
                    ->whereHas('company', fn ($q) => $q->where('name', 'like', "%{$aiData['company_name']}%"))
                    ->latest('updated_at')
                    ->first();

                if ($matchedApp) {
                    $event->update(['related_application_id' => $matchedApp->id]);
                }
            }
        } catch (Exception $e) {
            $status = 'failed';
            $errorMessage = $e->getMessage();

            return response()->json([
                'message' => 'Layanan AI Email Triage sedang tidak dapat memproses pesan saat ini.',
                'error' => $e->getMessage(),
            ], 503);
        } finally {
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'agent_name' => 'EmailTriageAgent',
                'provider' => 'gemini',
                'model' => 'gemini-2.5-flash',
                'prompt_version' => '1.0.0',
                'latency_ms' => $latencyMs,
                'status' => $status,
                'error_category' => $errorMessage ? 'provider_error' : null,
                'created_at' => now(),
                'completed_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Email berhasil dianalisis oleh EmailTriageAgent',
            'data' => new EmailEventResource($event->fresh('relatedApplication.company')),
        ]);
    }
}
