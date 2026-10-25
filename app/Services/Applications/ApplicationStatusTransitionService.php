<?php

namespace App\Services\Applications;

use App\Enums\ApplicationStatus;
use App\Models\ApplicationStatusHistory;
use App\Models\JobApplication;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ApplicationStatusTransitionService
{
    /**
     * Map of allowed forward/normal status transitions.
     *
     * @var array<string, list<string>>
     */
    protected array $allowedTransitions = [
        'saved' => ['applied', 'withdrawn'],
        'applied' => ['screening', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn'],
        'screening' => ['assessment', 'interview', 'offer', 'rejected', 'withdrawn'],
        'assessment' => ['screening', 'interview', 'offer', 'rejected', 'withdrawn'],
        'interview' => ['assessment', 'offer', 'rejected', 'withdrawn'],
        'offer' => ['withdrawn'],
        'rejected' => ['applied', 'screening', 'interview'], // Reopen with audit notes
        'withdrawn' => ['applied', 'screening', 'interview'], // Reopen with audit notes
    ];

    /**
     * Transition a job application to a new status within a database transaction.
     *
     * @throws ValidationException
     */
    public function transition(
        JobApplication $application,
        ApplicationStatus $newStatus,
        ?string $notes = null,
        string $source = 'user',
        int|string|null $actorUserId = null
    ): JobApplication {
        $currentStatus = $application->status;

        // Idempotent no-op if same status
        if ($currentStatus === $newStatus) {
            return $application;
        }

        // Validate status transition
        if (! $this->canTransition($currentStatus, $newStatus)) {
            throw ValidationException::withMessages([
                'status' => ["Transisi status dari '{$currentStatus->label()}' ke '{$newStatus->label()}' tidak diperbolehkan."],
            ]);
        }

        // Offer to withdrawn requires notes
        if ($currentStatus === ApplicationStatus::Offer && $newStatus === ApplicationStatus::Withdrawn && empty($notes)) {
            throw ValidationException::withMessages([
                'notes' => ['Catatan penarikan wajib diisi ketika menarik lamaran yang sudah mendapatkan penawaran (offer).'],
            ]);
        }

        return DB::transaction(function () use ($application, $currentStatus, $newStatus, $notes, $source, $actorUserId) {
            $application->update([
                'status' => $newStatus,
                'applied_at' => ($application->applied_at === null && $newStatus === ApplicationStatus::Applied) ? now() : $application->applied_at,
            ]);

            ApplicationStatusHistory::create([
                'id' => (string) Str::uuid(),
                'job_application_id' => $application->id,
                'previous_status' => $currentStatus->value,
                'new_status' => $newStatus->value,
                'change_source' => $source,
                'notes' => $notes,
                'actor_user_id' => $actorUserId,
                'changed_at' => now(),
            ]);

            return $application->fresh(['company', 'statusHistories']);
        });
    }

    /**
     * Check if a transition between two statuses is allowed.
     */
    public function canTransition(ApplicationStatus $from, ApplicationStatus $to): bool
    {
        $allowed = $this->allowedTransitions[$from->value] ?? [];

        return in_array($to->value, $allowed, true);
    }
}
