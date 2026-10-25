<?php

namespace App\Services\Applications;

use App\Ai\Agents\StagnantJobAdvisorAgent;
use App\Enums\ApplicationStatus;
use App\Mail\StagnantApplicationAlertMail;
use App\Models\AiGenerationLog;
use App\Models\JobApplication;
use App\Models\Notification;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class StagnantApplicationService
{
    /**
     * Check a single job application and send advice and recommendations if stagnant for 14+ days.
     *
     * @return array<string, mixed>|null
     */
    public function checkAndNotify(JobApplication $application): ?array
    {
        // Must be in active non-terminal state
        if (! in_array($application->status, [
            ApplicationStatus::Applied,
            ApplicationStatus::Screening,
            ApplicationStatus::Assessment,
        ], true)) {
            return null;
        }

        // Must have had no updates in at least 14 days
        $daysSinceUpdate = (int) $application->updated_at->diffInDays(now());
        if ($daysSinceUpdate < 14) {
            return null;
        }

        $twoWeekCycle = (int) floor($daysSinceUpdate / 14);
        $dedupeKey = "stagnant:{$application->id}:cycle_{$twoWeekCycle}";

        // Prevent duplicate notification for the current 2-week cycle
        $existingNotif = Notification::where('user_id', $application->user_id)
            ->where('dedupe_key', $dedupeKey)
            ->first();

        if ($existingNotif) {
            return null;
        }

        $user = $application->user;
        $companyName = $application->company->name ?? 'Perusahaan';

        $prompt = "Lamaran berikut tidak memiliki perkembangan atau pembaruan status selama {$daysSinceUpdate} hari:\n";
        $prompt .= "- Posisi: {$application->job_title}\n";
        $prompt .= "- Perusahaan: {$companyName}\n";
        $prompt .= "- Status Saat Ini: {$application->status->label()}\n";
        $prompt .= '- Tanggal Melamar: '.($application->applied_at ? $application->applied_at->format('Y-m-d') : $application->created_at->format('Y-m-d'))."\n";

        if ($user->careerPreference && ! empty($user->careerPreference->target_roles)) {
            $roles = implode(', ', $user->careerPreference->target_roles);
            $prompt .= "- Target Peran Pengguna: {$roles}\n";
        }

        $startTime = microtime(true);
        $status = 'succeeded';
        $errorMessage = null;

        try {
            $agent = new StagnantJobAdvisorAgent;
            $aiResponse = $agent->prompt($prompt);
            $aiData = $aiResponse->toArray();
        } catch (Exception $e) {
            $status = 'failed';
            $errorMessage = $e->getMessage();
            Log::error('StagnantJobAdvisorAgent failed: '.$e->getMessage());

            return null;
        } finally {
            $latencyMs = (int) round((microtime(true) - $startTime) * 1000);
            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => (string) Str::uuid(),
                'user_id' => $user->id,
                'agent_name' => 'StagnantJobAdvisorAgent',
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

        // 1. Create In-App Notification
        Notification::create([
            'id' => (string) Str::uuid(),
            'user_id' => $user->id,
            'type' => 'stagnant_job_alert',
            'title' => "Lamaran di {$companyName} Belum Ada Perkembangan (2 Minggu)",
            'body' => $aiData['advice'] ?? "Tidak ada respon selama {$daysSinceUpdate} hari. Disarankan melamar ke posisi alternatif.",
            'payload' => [
                'job_application_id' => $application->id,
                'job_title' => $application->job_title,
                'company_name' => $companyName,
                'days_since_update' => $daysSinceUpdate,
                'analysis' => $aiData['analysis'] ?? '',
                'advice' => $aiData['advice'] ?? '',
                'recommendations' => $aiData['recommendations'] ?? [],
            ],
            'job_application_id' => $application->id,
            'dedupe_key' => $dedupeKey,
        ]);

        // 2. Send Email Notification
        if (! empty($user->email)) {
            try {
                Mail::to($user->email)->send(new StagnantApplicationAlertMail($application, $aiData));
            } catch (Exception $e) {
                Log::warning("Gagal mengirim email alert pekerjaan stagnan ke {$user->email}: ".$e->getMessage());
            }
        }

        return $aiData;
    }

    /**
     * Check all active applications across the system and notify users for stagnant ones.
     */
    public function checkAllStagnantApplications(): int
    {
        $stagnantApplications = JobApplication::whereIn('status', [
            ApplicationStatus::Applied->value,
            ApplicationStatus::Screening->value,
            ApplicationStatus::Assessment->value,
        ])
            ->where('updated_at', '<=', now()->subDays(14))
            ->with(['company', 'user.careerPreference'])
            ->get();

        $notifiedCount = 0;

        foreach ($stagnantApplications as $app) {
            $result = $this->checkAndNotify($app);
            if ($result !== null) {
                $notifiedCount++;
            }
        }

        return $notifiedCount;
    }
}
