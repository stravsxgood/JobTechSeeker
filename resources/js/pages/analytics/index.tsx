import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AnalyticsSummary {
    total_applications: number;
    total_applied: number;
    total_interviews: number;
    total_offers: number;
    response_rate_percentage: number;
    interview_conversion_rate_percentage: number;
    offer_rate_percentage: number;
    overdue_follow_ups: number;
    upcoming_interviews: number;
    average_days_in_pipeline: number;
}

interface PipelineStatus {
    status: string;
    label: string;
    count: number;
    is_active: boolean;
}

interface SourceCount {
    source: string;
    count: number;
}

interface MonthlyTrendItem {
    month: string;
    label: string;
    applications_count: number;
}

interface WeeklyTarget {
    target: number;
    current: number;
    percentage: number;
}

interface AnalyticsData {
    summary: AnalyticsSummary;
    pipeline_breakdown: PipelineStatus[];
    by_source: SourceCount[];
    monthly_trend: MonthlyTrendItem[];
    weekly_target: WeeklyTarget;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch('/api/v1/analytics', {
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const summary = data?.summary;
    const weekly = data?.weekly_target;

    // Calculate max for monthly trend scaling
    const maxMonthlyCount = Math.max(
        ...(data?.monthly_trend.map((m) => m.applications_count) || [1]),
        5
    );

    // Calculate total sources count for percentage
    const totalSourcesCount = data?.by_source.reduce((acc, curr) => acc + curr.count, 0) || 1;

    return (
        <AppLayout
            title="Analitik Karier"
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={fetchAnalytics}
                        isLoading={isLoading}
                        className="min-h-[44px]"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        <span>Segarkan Analitik</span>
                    </Button>
                </div>
            }
        >
            <Head title="Analitik Karier - CareerPilot AI" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#6798ff]">
                                    CAREER METRICS & PIPELINE ANALYTICS
                                </span>
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]">
                                    REAL-TIME
                                </span>
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold text-[#ffffff] tracking-[-0.4px]">
                                Analitik Performa Pencarian Kerja
                            </h2>
                            <p className="mt-1 text-[13px] leading-relaxed text-[#a7a7a7] max-w-2xl">
                                Evaluasi efektivitas funnel lamaran, rasio respons rekruter, konversi ke tahap interview, serta sebaran portal lowongan kerja terbukti.
                            </p>
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                    {/* Response Rate */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-4 sm:p-5 space-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#a7a7a7]">
                            RASIO RESPONS
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[26px] sm:text-[30px] font-bold text-[#ffffff]">
                                {summary ? `${summary.response_rate_percentage}%` : '...'}
                            </span>
                            <span className="text-[12px] text-[#34d399] font-medium">Lolos Berkas</span>
                        </div>
                        <p className="text-[11px] text-[#7c7c7c] pt-1 leading-snug">
                            Lamaran yang mendapat tanggapan lanjut dari perusahaan.
                        </p>
                    </div>

                    {/* Interview Conversion Rate */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-4 sm:p-5 space-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#6798ff]">
                            KONVERSI WAWANCARA
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[26px] sm:text-[30px] font-bold text-[#6798ff]">
                                {summary ? `${summary.interview_conversion_rate_percentage}%` : '...'}
                            </span>
                            <span className="text-[12px] text-[#a7a7a7]">dari total dilamar</span>
                        </div>
                        <p className="text-[11px] text-[#7c7c7c] pt-1 leading-snug">
                            Persentase lamaran yang berhasil mencapai sesi interview.
                        </p>
                    </div>

                    {/* Offer Rate */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-4 sm:p-5 space-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#34d399]">
                            RASIO TAWARAN (OFFER)
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[26px] sm:text-[30px] font-bold text-[#34d399]">
                                {summary ? `${summary.offer_rate_percentage}%` : '...'}
                            </span>
                            <span className="text-[12px] text-[#ffffff] font-medium">
                                ({summary?.total_offers || 0} Tawaran)
                            </span>
                        </div>
                        <p className="text-[11px] text-[#7c7c7c] pt-1 leading-snug">
                            Penawaran kerja resmi (job offer) yang diterima.
                        </p>
                    </div>

                    {/* Average Days in Pipeline */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-4 sm:p-5 space-y-1">
                        <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#fbbf24]">
                            RATA-RATA HARI PIPELINE
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[26px] sm:text-[30px] font-bold text-[#ffffff]">
                                {summary ? summary.average_days_in_pipeline : '...'}
                            </span>
                            <span className="text-[12px] text-[#7c7c7c]">Hari / Lamaran</span>
                        </div>
                        <p className="text-[11px] text-[#7c7c7c] pt-1 leading-snug">
                            Rata-rata durasi lamaran aktif sejak awal didaftarkan.
                        </p>
                    </div>
                </div>

                {/* Conversion Funnel & Weekly Target */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Funnel Progress */}
                    <div className="lg:col-span-2 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                            <div>
                                <h3 className="text-[16px] font-semibold text-[#ffffff] tracking-[-0.2px]">
                                    Tahapan Corong Konversi (Application Funnel)
                                </h3>
                                <p className="text-[12px] text-[#7c7c7c]">
                                    Perjalanan lamaran dari pendaftaran awal hingga penawaran kerja.
                                </p>
                            </div>
                            <span className="font-mono text-[11px] text-[#6798ff]">
                                {summary?.total_applied || 0} Total Dilamar
                            </span>
                        </div>

                        {/* Visual Funnel Bars */}
                        <div className="space-y-3 pt-1">
                            {[
                                {
                                    stage: 'Dilamar (Applied)',
                                    count: summary?.total_applied || 0,
                                    color: 'bg-[#6798ff]',
                                    percentage: 100,
                                },
                                {
                                    stage: 'Screening / Review Berkas',
                                    count:
                                        data?.pipeline_breakdown.find((p) => p.status === 'screening')
                                            ?.count || 0,
                                    color: 'bg-[#818cf8]',
                                    percentage:
                                        summary && summary.total_applied > 0
                                            ? Math.round(
                                                  ((data?.pipeline_breakdown.find(
                                                      (p) => p.status === 'screening'
                                                  )?.count || 0) /
                                                      summary.total_applied) *
                                                      100
                                              )
                                            : 0,
                                },
                                {
                                    stage: 'Technical / Assessment',
                                    count:
                                        data?.pipeline_breakdown.find((p) => p.status === 'assessment')
                                            ?.count || 0,
                                    color: 'bg-[#38bdf8]',
                                    percentage:
                                        summary && summary.total_applied > 0
                                            ? Math.round(
                                                  ((data?.pipeline_breakdown.find(
                                                      (p) => p.status === 'assessment'
                                                  )?.count || 0) /
                                                      summary.total_applied) *
                                                      100
                                              )
                                            : 0,
                                },
                                {
                                    stage: 'Interview (Wawancara)',
                                    count: summary?.total_interviews || 0,
                                    color: 'bg-[#34d399]',
                                    percentage: summary?.interview_conversion_rate_percentage || 0,
                                },
                                {
                                    stage: 'Tawaran Kerja (Offer)',
                                    count: summary?.total_offers || 0,
                                    color: 'bg-[#10b981]',
                                    percentage: summary?.offer_rate_percentage || 0,
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-[12px]">
                                        <span className="text-[#ffffff] font-medium">{item.stage}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-semibold text-[#ffffff]">
                                                {item.count}
                                            </span>
                                            <span className="font-mono text-[#7c7c7c]">
                                                ({item.percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-[#1e1e1e] overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} transition-all duration-500`}
                                            style={{ width: `${Math.max(item.percentage, item.count > 0 ? 4 : 0)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Target Widget */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                        <div>
                            <div className="border-b border-[#313131] pb-3">
                                <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#34d399]">
                                    TARGET MINGGUAN
                                </span>
                                <h3 className="text-[16px] font-semibold text-[#ffffff] tracking-[-0.2px] mt-0.5">
                                    Progres Lamaran Minggu Ini
                                </h3>
                            </div>

                            <div className="py-6 text-center space-y-2">
                                <div className="text-[42px] font-bold text-[#ffffff] font-mono leading-none">
                                    {weekly?.current || 0}
                                    <span className="text-[20px] text-[#7c7c7c] font-normal">
                                        {' '}/ {weekly?.target || 5}
                                    </span>
                                </div>
                                <p className="text-[13px] text-[#a7a7a7]">
                                    Lamaran terkirim dari target {weekly?.target || 5} lamaran/minggu
                                </p>

                                <div className="pt-4 space-y-1.5 max-w-xs mx-auto">
                                    <div className="h-2.5 w-full rounded-full bg-[#1e1e1e] overflow-hidden">
                                        <div
                                            className="h-full bg-[#34d399] transition-all duration-300"
                                            style={{ width: `${weekly?.percentage || 0}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[11px] font-mono text-[#34d399] block text-right">
                                        {weekly?.percentage || 0}% Tercapai
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[#313131] text-center">
                            <Link
                                href="/settings"
                                className="text-[12px] text-[#6798ff] hover:underline"
                            >
                                Ubah Target Lamaran Mingguan di Pengaturan →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sources Distribution & Monthly Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Source */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6 space-y-4">
                        <div className="border-b border-[#313131] pb-3 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-[#ffffff] tracking-[-0.2px]">
                                Distribusi Portal Sumber Lowongan
                            </h3>
                            <span className="font-mono text-[11px] text-[#7c7c7c]">
                                {data?.by_source.length || 0} Portal
                            </span>
                        </div>

                        {data?.by_source && data.by_source.length > 0 ? (
                            <div className="space-y-3">
                                {data.by_source.map((item, idx) => {
                                    const pct = Math.round((item.count / totalSourcesCount) * 100);

                                    return (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-[13px]">
                                                <span className="text-[#ffffff] font-medium capitalize">
                                                    {item.source}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[#ffffff]">
                                                        {item.count} Lamaran
                                                    </span>
                                                    <span className="font-mono text-[11px] text-[#7c7c7c]">
                                                        ({pct}%)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full rounded-full bg-[#1e1e1e] overflow-hidden">
                                                <div
                                                    className="h-full bg-[#6798ff]"
                                                    style={{ width: `${pct}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[13px] text-[#7c7c7c]">
                                Belum ada data sumber portal pada lamaran aktif Anda.
                            </div>
                        )}
                    </div>

                    {/* Monthly Trend (6 Months) */}
                    <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6 space-y-4">
                        <div className="border-b border-[#313131] pb-3 flex items-center justify-between">
                            <h3 className="text-[16px] font-semibold text-[#ffffff] tracking-[-0.2px]">
                                Tren Aktivitas 6 Bulan Terakhir
                            </h3>
                            <span className="font-mono text-[11px] text-[#7c7c7c]">
                                Bulan ke Bulan
                            </span>
                        </div>

                        {data?.monthly_trend && data.monthly_trend.length > 0 ? (
                            <div className="flex items-end justify-between gap-3 h-48 pt-6 pb-2">
                                {data.monthly_trend.map((item, idx) => {
                                    const heightPct = Math.max(
                                        Math.round((item.applications_count / maxMonthlyCount) * 100),
                                        8
                                    );

                                    return (
                                        <div
                                            key={idx}
                                            className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
                                        >
                                            <span className="font-mono text-[11px] text-[#6798ff] font-semibold group-hover:scale-110 transition-transform">
                                                {item.applications_count}
                                            </span>
                                            <div
                                                className="w-full max-w-[40px] rounded-t-[4px] bg-[#1e1e1e] border-t border-x border-[#313131] group-hover:bg-[#6798ff]/30 group-hover:border-[#6798ff] transition-all"
                                                style={{ height: `${heightPct}%` }}
                                            ></div>
                                            <span className="font-mono text-[11px] text-[#7c7c7c] truncate w-full text-center">
                                                {item.label.split(' ')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[13px] text-[#7c7c7c]">
                                Belum ada aktivitas lamaran pada 6 bulan terakhir.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
