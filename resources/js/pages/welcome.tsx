import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function Welcome() {
    const stats = [
        {
            label: 'Lamaran Aktif',
            value: '12',
            sub: '3 dalam tahap interview',
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6798ff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
            ),
        },
        {
            label: 'Interview Terdekat',
            value: '2',
            sub: 'Technical Interview minggu ini',
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6798ff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
        {
            label: 'Target Mingguan',
            value: '4/5',
            sub: '80% target tercapai',
            icon: (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6798ff"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
        },
    ];

    const upcomingInterviews = [
        {
            id: '1',
            company: 'PT Teknologi Nusantara',
            role: 'Senior Fullstack Engineer',
            type: 'Technical Interview',
            time: 'Kamis, 24 Okt 2026 • 10:00 WIB',
            status: 'confirmed',
        },
        {
            id: '2',
            company: 'GoForward Solutions',
            role: 'Backend Developer (Laravel)',
            type: 'User Interview',
            time: 'Jumat, 25 Okt 2026 • 14:30 WIB',
            status: 'confirmed',
        },
    ];

    const recentApplications = [
        {
            id: '1',
            company: 'PT Teknologi Nusantara',
            role: 'Senior Fullstack Engineer',
            status: 'Interview',
            badgeVariant: 'accent' as const,
            appliedAt: '12 Okt 2026',
        },
        {
            id: '2',
            company: 'GoForward Solutions',
            role: 'Backend Developer (Laravel)',
            status: 'Assessment',
            badgeVariant: 'warning' as const,
            appliedAt: '15 Okt 2026',
        },
        {
            id: '3',
            company: 'Fintech Maju Bersama',
            role: 'Lead System Architect',
            status: 'Applied',
            badgeVariant: 'default' as const,
            appliedAt: '18 Okt 2026',
        },
    ];

    return (
        <AppLayout>
            <Head title="Dashboard - CareerPilot AI" />

            <div className="space-y-8">
                {/* Hero / Overview Header */}
                <div className="border-b border-[#313131] pb-6">
                    <p className="mb-2 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                        OVERVIEW DASHBOARD
                    </p>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-[28px] font-semibold tracking-[-0.84px] text-[#ffffff] sm:text-[34px]">
                                Kendali Pencarian Kerja Anda
                            </h2>
                            <p className="mt-1 text-[14px] text-[#a7a7a7]">
                                Pantau seluruh perkembangan pipeline, jadwal
                                interview, dan rekomendasi AI dari satu tempat.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/applications">
                                <Button variant="secondary" size="md">
                                    Lihat Semua Lamaran
                                </Button>
                            </Link>
                            <Link href="/applications/create">
                                <Button variant="primary" size="md">
                                    + Tambah Lamaran
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stat Cards (3-column layout per DESIGN.md Stat Card specifications) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className="rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-6 transition-colors hover:border-[#454545]"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <span className="font-mono text-[12px] tracking-[0.5px] text-[#a7a7a7]">
                                    {stat.label}
                                </span>
                                {stat.icon}
                            </div>
                            <div className="font-sans text-[36px] font-semibold tracking-[-0.84px] text-[#ffffff]">
                                {stat.value}
                            </div>
                            <p className="mt-1 text-[13px] text-[#a7a7a7]">
                                {stat.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Two Column Grid for Upcoming Interviews & Recent Applications */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Upcoming Interviews Card */}
                    <Card variant="carbon">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Jadwal Interview Terdekat</CardTitle>
                                <CardDescription>
                                    Pengingat otomatis aktif sebelum jadwal
                                    seleksi
                                </CardDescription>
                            </div>
                            <Link href="/interviews">
                                <Button variant="ghost" size="sm">
                                    Buka Kalender
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingInterviews.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-3 rounded-[8px] border border-[#313131] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-medium text-[#ffffff]">
                                            {item.company}
                                        </div>
                                        <div className="text-[13px] text-[#a7a7a7]">
                                            {item.role} • {item.type}
                                        </div>
                                        <div className="pt-1 font-mono text-[12px] text-[#6798ff]">
                                            {item.time}
                                        </div>
                                    </div>
                                    <Badge variant="accent" size="sm">
                                        Confirmed
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Recent Applications Card */}
                    <Card variant="carbon">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Lamaran Terbaru</CardTitle>
                                <CardDescription>
                                    Aktivitas terkini pada pipeline Anda
                                </CardDescription>
                            </div>
                            <Link href="/applications">
                                <Button variant="ghost" size="sm">
                                    Kelola Semua
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentApplications.map((app) => (
                                <div
                                    key={app.id}
                                    className="flex items-center justify-between gap-4 rounded-[8px] border border-[#313131] bg-[#141414] p-4"
                                >
                                    <div className="space-y-1">
                                        <div className="text-[14px] font-medium text-[#ffffff]">
                                            {app.company}
                                        </div>
                                        <div className="text-[13px] text-[#a7a7a7]">
                                            {app.role}
                                        </div>
                                        <div className="text-[12px] text-[#7c7c7c]">
                                            Dilamar pada {app.appliedAt}
                                        </div>
                                    </div>
                                    <Badge variant={app.badgeVariant} size="sm">
                                        {app.status}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Assistant Banner / Recommendation Preview (Strictly conforming to Dovetail: no gradient, flat tone) */}
                <div className="flex flex-col items-start justify-between gap-6 rounded-[8px] border border-[#313131] bg-[#141414] p-6 md:flex-row md:items-center">
                    <div className="max-w-2xl space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="accent" size="sm">
                                AI COPILOT
                            </Badge>
                            <span className="font-mono text-[12px] text-[#7c7c7c]">
                                SARAN TERVALIDASI
                            </span>
                        </div>
                        <h3 className="pt-1 text-[16px] font-semibold text-[#ffffff]">
                            Persiapan Interview Teknis: PT Teknologi Nusantara
                        </h3>
                        <p className="text-[13px] text-[#a7a7a7]">
                            AI telah menganalisis deskripsi pekerjaan dan
                            menyusun daftar pertanyaan teknis, evaluasi
                            kompetensi, serta checklist persiapan.
                        </p>
                    </div>
                    <div className="flex w-full items-center gap-3 md:w-auto">
                        <Link
                            href="/ai/interview-copilot"
                            className="w-full md:w-auto"
                        >
                            <Button
                                variant="primary"
                                size="md"
                                className="w-full md:w-auto"
                            >
                                Buka Persiapan Interview
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
