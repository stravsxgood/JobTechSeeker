<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\JobApplicationResource;
use App\Models\Interview;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get aggregate metrics and pipeline status for the user dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $timezone = $user->timezone ?? 'Asia/Jakarta';
        $now = CarbonImmutable::now($timezone);
        $startOfWeek = $now->startOfWeek();
        $endOfWeek = $now->endOfWeek();

        // Status counts via single efficient query
        /** @var array<string, int> $statusCountsRaw */
        $statusCountsRaw = $user->jobApplications()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $statusDistribution = [];
        $totalApplications = 0;
        $activeCount = 0;

        foreach (ApplicationStatus::cases() as $case) {
            $count = (int) ($statusCountsRaw[$case->value] ?? 0);
            $statusDistribution[$case->value] = [
                'label' => $case->label(),
                'count' => $count,
                'is_active' => $case->isActive(),
            ];
            $totalApplications += $count;
            if ($case->isActive()) {
                $activeCount += $count;
            }
        }

        // Weekly target calculation
        $weeklyAppliedCount = $user->jobApplications()
            ->where('status', ApplicationStatus::Applied->value)
            ->whereBetween('applied_at', [$startOfWeek->toDateString(), $endOfWeek->toDateString()])
            ->count();

        $weeklyTarget = $user->careerPreference->weekly_application_target ?? 5;
        $weeklyProgressPercentage = $weeklyTarget > 0 ? (int) min(round(($weeklyAppliedCount / $weeklyTarget) * 100), 100) : 0;

        // Upcoming interviews (next 14 days)
        $upcomingInterviews = $user->interviews()
            ->with(['jobApplication.company'])
            ->where('status', 'scheduled')
            ->where('start_at', '>=', now())
            ->where('start_at', '<=', now()->addDays(14))
            ->orderBy('start_at', 'asc')
            ->limit(5)
            ->get()
            ->map(function (Interview $interview): array {
                return [
                    'id' => (string) $interview->id,
                    'job_title' => $interview->jobApplication?->job_title,
                    'company_name' => $interview->jobApplication?->company?->name,
                    'interview_type' => $interview->interview_type,
                    'start_at' => $interview->start_at->toIso8601String(),
                    'end_at' => $interview->end_at->toIso8601String(),
                    'timezone' => $interview->timezone,
                    'meeting_url' => $interview->meeting_url,
                    'location' => $interview->location,
                ];
            });

        // Follow-ups due (within 2 days or overdue)
        $followUpsDue = $user->jobApplications()
            ->with('company')
            ->whereNotNull('follow_up_at')
            ->where('follow_up_at', '<=', now()->addDays(2))
            ->orderBy('follow_up_at', 'asc')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'metrics' => [
                    'total_applications' => $totalApplications,
                    'active_applications' => $activeCount,
                    'offers_count' => (int) ($statusCountsRaw[ApplicationStatus::Offer->value] ?? 0),
                    'rejections_count' => (int) ($statusCountsRaw[ApplicationStatus::Rejected->value] ?? 0),
                    'interviews_count' => (int) ($statusCountsRaw[ApplicationStatus::Interview->value] ?? 0),
                ],
                'status_distribution' => $statusDistribution,
                'weekly_target' => [
                    'target' => $weeklyTarget,
                    'current' => $weeklyAppliedCount,
                    'applied_this_week' => $weeklyAppliedCount,
                    'progress_percentage' => $weeklyProgressPercentage,
                    'week_start' => $startOfWeek->toDateString(),
                    'week_end' => $endOfWeek->toDateString(),
                ],
                'upcoming_interviews' => $upcomingInterviews,
                'follow_ups_due' => JobApplicationResource::collection($followUpsDue),
            ],
        ]);
    }
}
