import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import {
    ApplicationTodoList,
    FollowUpItem,
    UpcomingInterviewItem,
} from '@/components/dashboard/ApplicationTodoList';
import { QuickAddApplicationModal } from '@/components/dashboard/QuickAddApplicationModal';

interface DashboardMetrics {
    total_applications: number;
    active_applications: number;
    offers_count: number;
    rejections_count: number;
    interviews_count: number;
}

interface StatusItem {
    label: string;
    count: number;
    is_active: boolean;
}

interface WeeklyTarget {
    target: number;
    current: number;
    applied_this_week: number;
    progress_percentage: number;
    week_start: string;
    week_end: string;
}

interface MonthlyTrendItem {
    month: string;
    label: string;
    count: number;
    applications_count?: number;
}

export default function Dashboard() {
    const { auth } = usePage<{
        auth?: { user?: { name: string; timezone?: string } };
    }>().props;
    const userName = auth?.user?.name || 'Jobseeker';

    const [metrics, setMetrics] = useState<DashboardMetrics>({
        total_applications: 0,
        active_applications: 0,
        offers_count: 0,
        rejections_count: 0,
        interviews_count: 0,
    });
    const [statusDistribution, setStatusDistribution] = useState<
        Record<string, StatusItem>
    >({});
    const [weeklyTarget, setWeeklyTarget] = useState<WeeklyTarget>({
        target: 5,
        current: 0,
        applied_this_week: 0,
        progress_percentage: 0,
        week_start: '',
        week_end: '',
    });
    const [upcomingInterviews, setUpcomingInterviews] = useState<
        UpcomingInterviewItem[]
    >([]);
    const [followUpsDue, setFollowUpsDue] = useState<FollowUpItem[]>([]);
    const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

    const fetchDashboardData = async (showLoadingState = true) => {
        if (showLoadingState) setIsLoading(true);
        setIsRefreshing(true);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            // Fetch dashboard summary
            const [dashRes, analyticsRes] = await Promise.all([
                fetch('/api/v1/dashboard', {
                    headers,
                    credentials: 'same-origin',
                }),
                fetch('/api/v1/analytics', {
                    headers,
                    credentials: 'same-origin',
                }),
            ]);

            if (dashRes.ok) {
                const dashJson = await dashRes.json();
                const d = dashJson.data;
                if (d.metrics) setMetrics(d.metrics);
                if (d.status_distribution)
                    setStatusDistribution(d.status_distribution);
                if (d.weekly_target) setWeeklyTarget(d.weekly_target);
                if (d.upcoming_interviews)
                    setUpcomingInterviews(d.upcoming_interviews);
                if (d.follow_ups_due) setFollowUpsDue(d.follow_ups_due);
            }

            if (analyticsRes.ok) {
                const analyticsJson = await analyticsRes.json();
                if (analyticsJson.data?.monthly_trend) {
                    const trend = analyticsJson.data.monthly_trend.map(
                        (item: { month: string; label: string; count?: number; applications_count?: number }) => ({
                            month: item.month,
                            label: item.label,
                            count: Number(item.count ?? item.applications_count ?? 0),
                            applications_count: Number(item.applications_count ?? item.count ?? 0),
                        }),
                    );
                    setMonthlyTrend(trend);
                }
            }
        } catch {
            // Silently catch network errors
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        void fetchDashboardData(true);
    }, []);

    const currentDateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <AppLayout
            action={
                <Button
                    variant="primary"
                    size="md"
                    aria-label="Tambah Lamaran"
                    onClick={() => setIsQuickAddOpen(true)}
                    className="min-h-[44px] min-w-[44px] px-2.5 sm:px-4"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">Tambah Lamaran</span>
                </Button>
            }
        >
            <Head title="Dashboard - CareerPilot AI" />

            <div className="space-y-6">
                {/* Greeting & Quick Action Header */}
                <div className="flex flex-col gap-3 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                KONTROL KARIER PRIBADI
                            </span>
                            <span className="font-mono text-[11px] text-[#7c7c7c]">
                                •
                            </span>
                            <span className="font-mono text-[11px] text-[#a7a7a7]">
                                {currentDateStr}
                            </span>
                        </div>
                        <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                            Selamat Datang, {userName}
                        </h2>
                        <p className="mt-0.5 text-[13px] text-[#a7a7a7]">
                            Pantau kemajuan lamaran aktif, jadwal interview
                            terdekat, dan tindak lanjuti agenda follow-up.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchDashboardData(false)}
                            disabled={isRefreshing}
                            className="flex min-h-[40px] items-center gap-1.5 rounded-[6px] border border-[#313131] bg-[#1e1e1e] px-3.5 text-[12px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] disabled:opacity-50"
                        >
                            <svg
                                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#6798ff]' : ''}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="23 4 23 10 17 10" />
                                <polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            <span>Segarkan Data</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                    {/* 1. Total Lamaran */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-3.5 transition-colors hover:border-[#454545] sm:p-4">
                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#a7a7a7] uppercase sm:text-[11px]">
                            TOTAL LAMARAN
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-[24px] font-semibold text-[#ffffff] sm:text-[28px]">
                                {isLoading ? '-' : metrics.total_applications}
                            </span>
                            <span className="text-[10px] text-[#7c7c7c] sm:text-[11px]">
                                tercatat
                            </span>
                        </div>
                    </div>

                    {/* 2. Lamaran Aktif */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-3.5 transition-colors hover:border-[#6798ff] sm:p-4">
                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#6798ff] uppercase sm:text-[11px]">
                            DALAM PROSES
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-[24px] font-semibold text-[#6798ff] sm:text-[28px]">
                                {isLoading ? '-' : metrics.active_applications}
                            </span>
                            <span className="text-[10px] text-[#a7a7a7] sm:text-[11px]">
                                aktif
                            </span>
                        </div>
                    </div>

                    {/* 3. Interview */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-3.5 transition-colors hover:border-[#f59e0b] sm:p-4">
                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#f59e0b] uppercase sm:text-[11px]">
                            INTERVIEW
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-[24px] font-semibold text-[#f59e0b] sm:text-[28px]">
                                {isLoading ? '-' : upcomingInterviews.length}
                            </span>
                            <span className="text-[10px] text-[#a7a7a7] sm:text-[11px]">
                                14 hari ke depan
                            </span>
                        </div>
                    </div>

                    {/* 4. Tawaran (Offers) */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-3.5 transition-colors hover:border-[#34d399] sm:p-4">
                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#34d399] uppercase sm:text-[11px]">
                            TAWARAN KERJA
                        </span>
                        <div className="mt-2 flex items-baseline justify-between">
                            <span className="font-mono text-[24px] font-semibold text-[#34d399] sm:text-[28px]">
                                {isLoading ? '-' : metrics.offers_count}
                            </span>
                            <span className="text-[10px] text-[#a7a7a7] sm:text-[11px]">
                                offer diterima
                            </span>
                        </div>
                    </div>

                    {/* 5. Target Mingguan */}
                    <div className="col-span-2 rounded-[8px] border border-[#313131] bg-[#141414] p-3.5 sm:p-4 md:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] tracking-[0.85px] text-[#a7a7a7] uppercase sm:text-[11px]">
                                TARGET MINGGUAN
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-[#6798ff]">
                                {weeklyTarget.current}/{weeklyTarget.target}
                            </span>
                        </div>
                        <div className="mt-2.5 sm:mt-3">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                                <div
                                    className="h-full bg-[#6798ff] transition-all duration-300"
                                    style={{
                                        width: `${weeklyTarget.progress_percentage}%`,
                                    }}
                                />
                            </div>
                            <span className="mt-1.5 block text-[10px] text-[#7c7c7c] sm:text-[11px]">
                                {weeklyTarget.progress_percentage}% tercapai
                                minggu ini
                            </span>
                        </div>
                    </div>
                </div>

                {/* Real-time Charts Section (Dual Columns) */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* 1. Real-time Pipeline Status Chart */}
                    <PipelineChart
                        statusDistribution={statusDistribution}
                        totalApplications={metrics.total_applications}
                    />

                    {/* 2. Real-time Monthly Application Trend Chart */}
                    <MonthlyTrendChart
                        monthlyTrend={monthlyTrend}
                        onRefresh={() => fetchDashboardData(false)}
                        isRefreshing={isRefreshing}
                    />
                </div>

                {/* To-Do List Lamaran Yang Sudah Dilamar (User Requested Feature) */}
                <ApplicationTodoList
                    followUpsDue={followUpsDue}
                    upcomingInterviews={upcomingInterviews}
                    onStatusChangeClick={() =>
                        (window.location.href = '/applications')
                    }
                    onRefresh={() => fetchDashboardData(false)}
                />

                {/* Dual Grid: Upcoming Interviews & Quick Recent Applications */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Upcoming Interviews Schedule */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5">
                        <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                            <div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    KALENDER SELEKSI
                                </span>
                                <h3 className="text-[16px] font-semibold text-[#ffffff]">
                                    Jadwal Interview Mendatang
                                </h3>
                            </div>
                            <Link
                                href="/interviews"
                                className="text-[12px] font-medium text-[#6798ff] hover:underline"
                            >
                                Buka Kalender →
                            </Link>
                        </div>

                        <div className="mt-3 divide-y divide-[#1e1e1e]">
                            {upcomingInterviews.length === 0 ? (
                                <div className="py-8 text-center text-[#7c7c7c]">
                                    <p className="text-[13px]">
                                        Belum ada jadwal interview terdekat.
                                    </p>
                                    <p className="mt-1 text-[11px]">
                                        Jadwal yang dibuat manual atau diekstrak
                                        dari email akan muncul di sini.
                                    </p>
                                </div>
                            ) : (
                                upcomingInterviews.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start justify-between gap-3 py-3"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-medium text-[#ffffff]">
                                                {item.job_title}
                                            </p>
                                            <p className="text-[12px] text-[#a7a7a7]">
                                                {item.company_name}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    {item.interview_type}
                                                </Badge>
                                                {item.meeting_url && (
                                                    <a
                                                        href={item.meeting_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] text-[#34d399] hover:underline"
                                                    >
                                                        Link Meeting
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right font-mono text-[11px] text-[#f59e0b]">
                                            {new Date(
                                                item.start_at,
                                            ).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Access: Manajemen Lamaran */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5">
                        <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                            <div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    MANAJEMEN LAMARAN
                                </span>
                                <h3 className="text-[16px] font-semibold text-[#ffffff]">
                                    Pintasan & Alat Bantu
                                </h3>
                            </div>
                            <Link
                                href="/applications"
                                className="text-[12px] font-medium text-[#6798ff] hover:underline"
                            >
                                Kelola Lamaran →
                            </Link>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Link
                                href="/applications"
                                className="group flex flex-col justify-between rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 transition-colors hover:border-[#6798ff]"
                            >
                                <div>
                                    <span className="text-[14px] font-semibold text-[#ffffff] group-hover:text-[#6798ff]">
                                        Daftar & Tabel Lamaran
                                    </span>
                                    <p className="mt-1 text-[11px] text-[#a7a7a7]">
                                        Filter status, cari posisi, update
                                        tanggal follow-up, dan riwayat audit.
                                    </p>
                                </div>
                                <span className="mt-3 text-[11px] text-[#6798ff]">
                                    Buka Tabel →
                                </span>
                            </Link>

                            <Link
                                href="/kanban"
                                className="group flex flex-col justify-between rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 transition-colors hover:border-[#6798ff]"
                            >
                                <div>
                                    <span className="text-[14px] font-semibold text-[#ffffff] group-hover:text-[#6798ff]">
                                        Kanban Board
                                    </span>
                                    <p className="mt-1 text-[11px] text-[#a7a7a7]">
                                        Visualisasi kolom dari Tersimpan,
                                        Dilamar, Interview, hingga Penawaran.
                                    </p>
                                </div>
                                <span className="mt-3 text-[11px] text-[#6798ff]">
                                    Buka Kanban →
                                </span>
                            </Link>

                            <Link
                                href="/ai/career-planner"
                                className="group flex flex-col justify-between rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 transition-colors hover:border-[#6798ff]"
                            >
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[14px] font-semibold text-[#ffffff] group-hover:text-[#6798ff]">
                                            AI Career Planner
                                        </span>
                                        <Badge variant="accent" size="sm">
                                            AI
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#a7a7a7]">
                                        Susun roadmap 3/5 bulan dan rekomendasi
                                        media belajar.
                                    </p>
                                </div>
                                <span className="mt-3 text-[11px] text-[#6798ff]">
                                    Buka Planner →
                                </span>
                            </Link>

                            <Link
                                href="/ai/interview-copilot"
                                className="group flex flex-col justify-between rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 transition-colors hover:border-[#6798ff]"
                            >
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[14px] font-semibold text-[#ffffff] group-hover:text-[#6798ff]">
                                            Interview Copilot
                                        </span>
                                        <Badge variant="accent" size="sm">
                                            AI
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#a7a7a7]">
                                        Simulasi wawancara teknis & behavioral
                                        metode STAR.
                                    </p>
                                </div>
                                <span className="mt-3 text-[11px] text-[#6798ff]">
                                    Latihan Interview →
                                </span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Add Modal */}
            <QuickAddApplicationModal
                isOpen={isQuickAddOpen}
                onClose={() => setIsQuickAddOpen(false)}
                onSuccess={() => fetchDashboardData(false)}
            />
        </AppLayout>
    );
}
