<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ApplicationStatus;
use App\Http\Controllers\Controller;
use App\Models\JobApplication;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Get basic career analytics for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $timezone = $user->timezone ?? 'Asia/Jakarta';
        $now = CarbonImmutable::now($timezone);
        $sixMonthsAgo = $now->subMonths(5)->startOfMonth();

        // 1. Applications breakdown by status
        /** @var array<string, int> $statusCounts */
        $statusCounts = $user->jobApplications()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $pipelineBreakdown = [];
        $totalApplications = 0;
        $totalApplied = 0;
        $respondedCount = 0;
        $interviewCount = (int) ($statusCounts[ApplicationStatus::Interview->value] ?? 0);
        $offerCount = (int) ($statusCounts[ApplicationStatus::Offer->value] ?? 0);

        foreach (ApplicationStatus::cases() as $case) {
            $count = (int) ($statusCounts[$case->value] ?? 0);
            $totalApplications += $count;

            if ($case !== ApplicationStatus::Saved) {
                $totalApplied += $count;
            }

            // Responded applications are those that moved past 'applied'
            if (in_array($case, [
                ApplicationStatus::Screening,
                ApplicationStatus::Assessment,
                ApplicationStatus::Interview,
                ApplicationStatus::Offer,
                ApplicationStatus::Rejected,
            ], true)) {
                $respondedCount += $count;
            }

            $pipelineBreakdown[$case->value] = [
                'status' => $case->value,
                'label' => $case->label(),
                'count' => $count,
                'is_active' => $case->isActive(),
            ];
        }

        // 2. Conversion Rates
        $responseRate = $totalApplied > 0
            ? round(($respondedCount / $totalApplied) * 100, 1)
            : 0.0;

        $interviewConversionRate = $totalApplied > 0
            ? round(($interviewCount / $totalApplied) * 100, 1)
            : 0.0;

        $offerRate = $totalApplied > 0
            ? round(($offerCount / $totalApplied) * 100, 1)
            : 0.0;

        // 3. Applications by Source
        $sourcesRaw = $user->jobApplications()
            ->toBase()
            ->whereNotNull('source')
            ->selectRaw('source, COUNT(*) as count')
            ->groupBy('source')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $bySource = $sourcesRaw->map(function (object $item) {
            return [
                'source' => (string) $item->source,
                'count' => (int) $item->count,
            ];
        });

        // 4. Monthly trend over last 6 months
        $monthlyTrend = [];
        $cursorMonth = $sixMonthsAgo;

        while ($cursorMonth <= $now) {
            $monthKey = $cursorMonth->format('Y-m');
            $monthStart = $cursorMonth->startOfMonth()->toDateString();
            $monthEnd = $cursorMonth->endOfMonth()->toDateString();

            $count = $user->jobApplications()
                ->whereBetween('applied_at', [$monthStart, $monthEnd])
                ->count();

            $monthlyTrend[] = [
                'month' => $monthKey,
                'label' => $cursorMonth->translatedFormat('M Y'),
                'applications_count' => $count,
                'count' => $count,
            ];

            $cursorMonth = $cursorMonth->addMonth();
        }

        // 5. Weekly Target Progress
        $startOfWeek = $now->startOfWeek()->toDateString();
        $endOfWeek = $now->endOfWeek()->toDateString();

        $weeklyAppliedCount = $user->jobApplications()
            ->where('status', ApplicationStatus::Applied->value)
            ->whereBetween('applied_at', [$startOfWeek, $endOfWeek])
            ->count();

        $weeklyTarget = $user->careerPreference->weekly_application_target ?? 5;
        $weeklyProgressPercentage = $weeklyTarget > 0
            ? (int) min(round(($weeklyAppliedCount / $weeklyTarget) * 100), 100)
            : 0;

        // 6. Overdue follow-ups & Upcoming interviews count
        $overdueFollowUps = $user->jobApplications()
            ->whereNotNull('follow_up_at')
            ->where('follow_up_at', '<', now())
            ->count();

        $upcomingInterviewsCount = $user->interviews()
            ->where('status', 'scheduled')
            ->where('start_at', '>=', now())
            ->count();

        // 7. Status Aging (average days active applications have spent since creation/update)
        $activeApplications = $user->jobApplications()
            ->whereIn('status', [
                ApplicationStatus::Applied->value,
                ApplicationStatus::Screening->value,
                ApplicationStatus::Assessment->value,
                ApplicationStatus::Interview->value,
            ])
            ->get();

        $averageDaysInPipeline = 0.0;
        if ($activeApplications->isNotEmpty()) {
            $totalDays = $activeApplications->sum(function (JobApplication $app) {
                return (int) $app->created_at->diffInDays(now());
            });
            $averageDaysInPipeline = round($totalDays / $activeApplications->count(), 1);
        }

        return response()->json([
            'data' => [
                'summary' => [
                    'total_applications' => $totalApplications,
                    'total_applied' => $totalApplied,
                    'total_interviews' => $user->interviews()->count(),
                    'total_offers' => $offerCount,
                    'response_rate_percentage' => $responseRate,
                    'interview_conversion_rate_percentage' => $interviewConversionRate,
                    'offer_rate_percentage' => $offerRate,
                    'overdue_follow_ups' => $overdueFollowUps,
                    'upcoming_interviews' => $upcomingInterviewsCount,
                    'average_days_in_pipeline' => $averageDaysInPipeline,
                ],
                'pipeline_breakdown' => array_values($pipelineBreakdown),
                'by_source' => $bySource,
                'monthly_trend' => $monthlyTrend,
                'weekly_target' => [
                    'target' => $weeklyTarget,
                    'current' => $weeklyAppliedCount,
                    'percentage' => $weeklyProgressPercentage,
                ],
            ],
        ]);
    }
}
