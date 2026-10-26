<?php

namespace App\Services\Reminders;

use App\Enums\InterviewStatus;
use App\Enums\ReminderStatus;
use App\Models\Interview;
use App\Models\JobApplication;
use App\Models\Notification;
use App\Models\Reminder;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReminderService
{
    /**
     * Schedule standard reminders for an interview (24h and 2h before).
     */
    public function scheduleForInterview(Interview $interview): void
    {
        if ($interview->status === InterviewStatus::Cancelled) {
            return;
        }

        $startAt = CarbonImmutable::instance($interview->start_at);
        $now = CarbonImmutable::now();

        // 24 hours prior
        $oneDayBefore = $startAt->subDay();
        if ($oneDayBefore->isAfter($now)) {
            $this->createInterviewReminder(
                $interview,
                'interview_24h',
                "Interview Besok: {$interview->interview_type}",
                "Pengingat interview {$interview->interview_type} untuk posisi {$interview->jobApplication?->job_title} besok pukul {$startAt->setTimezone($interview->timezone)->format('H:i')}.",
                $oneDayBefore
            );
        }

        // 2 hours prior
        $twoHoursBefore = $startAt->subHours(2);
        if ($twoHoursBefore->isAfter($now)) {
            $this->createInterviewReminder(
                $interview,
                'interview_2h',
                "Interview dalam 2 Jam: {$interview->interview_type}",
                "Persiapkan diri untuk interview {$interview->interview_type} dalam 2 jam (pukul {$startAt->setTimezone($interview->timezone)->format('H:i')}).",
                $twoHoursBefore
            );
        }
    }

    /**
     * Reschedule reminders when interview start_at changes.
     */
    public function rescheduleForInterview(Interview $interview): void
    {
        $this->cancelPendingForInterview($interview);
        $this->scheduleForInterview($interview);
    }

    /**
     * Cancel all pending reminders for an interview.
     */
    public function cancelPendingForInterview(Interview $interview): void
    {
        $interview->reminders()
            ->where('status', ReminderStatus::Pending->value)
            ->update(['status' => ReminderStatus::Cancelled->value]);
    }

    /**
     * Cancel all pending reminders for a job application.
     */
    public function cancelPendingForApplication(JobApplication $application): void
    {
        $application->reminders()
            ->where('status', ReminderStatus::Pending->value)
            ->update(['status' => ReminderStatus::Cancelled->value]);
    }

    /**
     * Schedule a follow-up reminder for a job application.
     */
    public function scheduleFollowUpReminder(JobApplication $application): void
    {
        if (! $application->follow_up_at) {
            return;
        }

        $followUpDate = CarbonImmutable::parse($application->follow_up_at);
        $now = CarbonImmutable::now();

        if ($followUpDate->isAfter($now)) {
            $dedupeKey = hash('sha256', "app:{$application->id}:follow_up:{$followUpDate->format('Y-m-d')}:v1");

            Reminder::firstOrCreate(
                [
                    'user_id' => $application->user_id,
                    'dedupe_key' => $dedupeKey,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'job_application_id' => $application->id,
                    'reminder_type' => 'follow_up',
                    'title' => "Waktunya Follow-up: {$application->job_title}",
                    'body' => "Hari ini adalah tanggal jadwal follow-up untuk lamaran posisi {$application->job_title} di {$application->company?->name}.",
                    'scheduled_at' => $followUpDate,
                    'status' => ReminderStatus::Pending->value,
                ]
            );
        }
    }

    /**
     * Process all due pending reminders and generate in-app notifications.
     *
     * @return int Count of processed reminders
     */
    public function processDueReminders(): int
    {
        $dueReminders = Reminder::where('status', ReminderStatus::Pending->value)
            ->where('scheduled_at', '<=', now())
            ->with(['jobApplication.company', 'interview'])
            ->limit(100)
            ->get();

        $processedCount = 0;

        foreach ($dueReminders as $reminder) {
            DB::transaction(function () use ($reminder) {
                $notifDedupeKey = "notif:reminder:{$reminder->id}:{$reminder->scheduled_at->timestamp}";

                Notification::firstOrCreate(
                    [
                        'user_id' => $reminder->user_id,
                        'dedupe_key' => $notifDedupeKey,
                    ],
                    [
                        'id' => (string) Str::uuid(),
                        'type' => $reminder->reminder_type,
                        'title' => $reminder->title,
                        'body' => $reminder->body ?? $reminder->title,
                        'payload' => [
                            'reminder_id' => $reminder->id,
                            'job_application_id' => $reminder->job_application_id,
                            'interview_id' => $reminder->interview_id,
                        ],
                        'job_application_id' => $reminder->job_application_id,
                        'interview_id' => $reminder->interview_id,
                        'reminder_id' => $reminder->id,
                        'read_at' => null,
                    ]
                );

                $reminder->update([
                    'status' => ReminderStatus::Sent->value,
                    'sent_at' => now(),
                    'attempt_count' => $reminder->attempt_count + 1,
                ]);
            });

            $processedCount++;
        }

        return $processedCount;
    }

    /**
     * Create a single interview reminder with deterministic dedupe key.
     */
    protected function createInterviewReminder(
        Interview $interview,
        string $type,
        string $title,
        string $body,
        CarbonInterface $scheduledAt
    ): Reminder {
        $scheduledAtUtc = $scheduledAt->utc()->toIso8601String();
        $dedupeKey = hash('sha256', "interview:{$interview->id}:{$type}:{$scheduledAtUtc}:v1");

        /** @var Reminder $reminder */
        $reminder = Reminder::firstOrCreate(
            [
                'user_id' => $interview->user_id,
                'dedupe_key' => $dedupeKey,
            ],
            [
                'id' => (string) Str::uuid(),
                'job_application_id' => $interview->job_application_id,
                'interview_id' => $interview->id,
                'reminder_type' => $type,
                'title' => $title,
                'body' => $body,
                'scheduled_at' => $scheduledAt,
                'status' => ReminderStatus::Pending->value,
            ]
        );

        return $reminder;
    }
}
