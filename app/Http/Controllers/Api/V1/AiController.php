<?php

namespace App\Http\Controllers\Api\V1;

use App\Ai\Agents\CareerPlannerAgent;
use App\Ai\Agents\InterviewPrepAgent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Ai\CareerPlanRequest;
use App\Http\Requests\Api\V1\Ai\InterviewPrepRequest;
use App\Models\AiGenerationLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class AiController extends Controller
{
    /**
     * Generate a personalized career roadmap using CareerPlannerAgent.
     */
    public function careerPlan(CareerPlanRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $targetRole = $validated['target_role'];
        $durationMonths = (int) $validated['duration_months'];
        $cvText = $validated['cv_text'] ?? null;
        $currentSkills = $validated['current_skills'] ?? [];
        $notes = $validated['notes'] ?? null;

        if (! empty($validated['application_id'])) {
            $user->jobApplications()->where('id', $validated['application_id'])->firstOrFail();
        }

        // Fallback skills from career preferences if current skills are not provided
        if (empty($currentSkills) && $user->careerPreference?->target_roles) {
            $currentSkills = $user->careerPreference->target_roles;
        }

        $skillsSummary = ! empty($currentSkills) ? implode(', ', $currentSkills) : 'Belum tercantum secara spesifik';
        $cvSummary = $cvText ? "Ringkasan CV:\n{$cvText}" : 'Tidak ada lampiran teks CV.';
        $notesSummary = $notes ? "Catatan Tambahan Pengguna:\n{$notes}" : '';

        $prompt = <<<PROMPT
Susunkan roadmap persiapan karier yang komprehensif dan realistis untuk mencapai posisi target berikut:

Target Pekerjaan: {$targetRole}
Target Durasi: {$durationMonths} bulan
Skill yang Dimiliki Saat Ini (dari CV/Profil): {$skillsSummary}
{$cvSummary}
{$notesSummary}

Pastikan menyertakan:
1. Analisis kesiapan dan skill gap (matching vs missing).
2. Rencana bulanan (milestone per bulan hingga bulan ke-{$durationMonths}) dengan action items spesifik.
3. Rekomendasi media pembelajaran terpercaya (YouTube, dokumentasi resmi, website belajar) untuk setiap skill yang harus dipelajari.
4. Rekomendasi proyek portofolio nyata untuk membuktikan kompetensi.
PROMPT;

        $requestId = (string) Str::uuid();
        $startTime = hrtime(true);
        $provider = config('ai.default', 'gemini');
        $model = config('ai.default_model', 'gemini-3.5-flash-lite');

        try {
            $agent = new CareerPlannerAgent;

            try {
                $response = $agent->prompt($prompt, provider: $provider, model: $model);
            } catch (Throwable $firstException) {
                // Automatic failover to backup model if primary model is overloaded or unavailable
                if ($model === 'gemini-3.5-flash-lite') {
                    $model = 'gemini-3.1-flash-lite';
                    $response = $agent->prompt($prompt, provider: $provider, model: $model);
                } else {
                    throw $firstException;
                }
            }

            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            $payload = $response->toArray();

            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => $requestId,
                'user_id' => $user->id,
                'agent_name' => 'CareerPlannerAgent',
                'provider' => $provider,
                'model' => $model,
                'prompt_version' => '1.0.0',
                'status' => 'succeeded',
                'latency_ms' => $latencyMs,
                'result_payload' => $payload,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Roadmap karier berhasil dibuat',
                'request_id' => $requestId,
                'data' => $payload,
            ], 200);
        } catch (Throwable $e) {
            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => $requestId,
                'user_id' => $user->id,
                'agent_name' => 'CareerPlannerAgent',
                'provider' => $provider,
                'model' => $model,
                'prompt_version' => '1.0.0',
                'status' => 'failed',
                'latency_ms' => $latencyMs,
                'error_category' => 'provider_error',
                'completed_at' => now(),
            ]);

            Log::error('CareerPlannerAgent failed to generate response', [
                'request_id' => $requestId,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Layanan AI sedang tidak dapat diakses saat ini. Silakan coba kembali sesaat lagi.',
                'code' => 'AI_PROVIDER_ERROR',
                'request_id' => $requestId,
            ], 503);
        }
    }

    /**
     * Generate realistic interview questions and preparation guide using InterviewPrepAgent.
     */
    public function interviewPreparation(InterviewPrepRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        $jobTitle = $validated['job_title'];
        $jobUrl = $validated['job_url'];
        $companyName = $validated['company_name'] ?? null;
        $jobDescription = $validated['job_description'] ?? null;
        $focus = $validated['interview_focus'] ?? 'all';

        if (! empty($validated['application_id'])) {
            $user->jobApplications()->where('id', $validated['application_id'])->firstOrFail();
        }

        // Detect job portal domain for richer context
        $parsedHost = parse_url($jobUrl, PHP_URL_HOST);
        $host = is_string($parsedHost) ? $parsedHost : '';
        $portalHint = match (true) {
            str_contains($host, 'linkedin') => 'LinkedIn',
            str_contains($host, 'glints') => 'Glints',
            str_contains($host, 'jobstreet') => 'JobStreet',
            str_contains($host, 'indeed') => 'Indeed',
            str_contains($host, 'pintarnya') => 'Pintarnya',
            str_contains($host, 'kalibrr') => 'Kalibrr',
            default => 'Career Portal',
        };

        $companyText = $companyName ? "Perusahaan: {$companyName}" : 'Perusahaan: Tertera pada tautan lowongan';
        $descText = $jobDescription ? "Deskripsi / Tanggung Jawab Pekerjaan:\n{$jobDescription}" : 'Deskripsi pekerjaan terlampir pada tautan lowongan.';

        $prompt = <<<PROMPT
Simulasikan sesi interview kerja profesional yang realistis dan komprehensif untuk posisi berikut:

Posisi Pekerjaan: {$jobTitle}
{$companyText}
Tautan Lowongan Pekerjaan: {$jobUrl} (Portal: {$portalHint})
{$descText}
Fokus Wawancara: {$focus}

Instruksi Khusus:
1. Buat simulasi pertanyaan interview nyata (introductory, technical spesifik peran, behavioral dengan metode STAR, dan case study pemecahan masalah).
2. Untuk setiap pertanyaan, sediakan panduan apa yang dinilai rekruter, poin kunci jawaban yang baik, contoh jawaban kuat, dan jebakan yang harus dihindari.
3. Berikan rekomendasi pertanyaan berbobot yang bisa diajukan kandidat kepada pewawancara di akhir sesi.
4. Sertakan checklist persiapan pra-wawancara sebelum kandidat menghadiri sesi interview.
PROMPT;

        $requestId = (string) Str::uuid();
        $startTime = hrtime(true);
        $provider = config('ai.default', 'gemini');
        $model = config('ai.default_model', 'gemini-3.5-flash-lite');

        try {
            $agent = new InterviewPrepAgent;

            try {
                $response = $agent->prompt($prompt, provider: $provider, model: $model);
            } catch (Throwable $firstException) {
                // Automatic failover to backup model if primary model is overloaded or unavailable
                if ($model === 'gemini-3.5-flash-lite') {
                    $model = 'gemini-3.1-flash-lite';
                    $response = $agent->prompt($prompt, provider: $provider, model: $model);
                } else {
                    throw $firstException;
                }
            }

            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            $payload = $response->toArray();

            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => $requestId,
                'user_id' => $user->id,
                'agent_name' => 'InterviewPrepAgent',
                'provider' => $provider,
                'model' => $model,
                'prompt_version' => '1.0.0',
                'status' => 'succeeded',
                'latency_ms' => $latencyMs,
                'result_payload' => $payload,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Simulasi persiapan interview berhasil dibuat',
                'request_id' => $requestId,
                'data' => $payload,
            ], 200);
        } catch (Throwable $e) {
            $latencyMs = (int) round((hrtime(true) - $startTime) / 1e6);

            AiGenerationLog::create([
                'id' => (string) Str::uuid(),
                'request_id' => $requestId,
                'user_id' => $user->id,
                'agent_name' => 'InterviewPrepAgent',
                'provider' => $provider,
                'model' => $model,
                'prompt_version' => '1.0.0',
                'status' => 'failed',
                'latency_ms' => $latencyMs,
                'error_category' => 'provider_error',
                'completed_at' => now(),
            ]);

            Log::error('InterviewPrepAgent failed to generate response', [
                'request_id' => $requestId,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Layanan AI sedang tidak dapat diakses saat ini. Silakan coba kembali sesaat lagi.',
                'code' => 'AI_PROVIDER_ERROR',
                'request_id' => $requestId,
            ], 503);
        }
    }
}
