import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SkillGapAnalysis {
    matching_skills: string[];
    missing_skills: string[];
}

interface LearningResource {
    skill_name: string;
    media_type: 'youtube' | 'website' | 'documentation' | 'course';
    platform_or_channel: string;
    title: string;
    search_query_or_url: string;
    why_recommended: string;
}

interface Milestone {
    month: number;
    theme: string;
    description: string;
    action_items: string[];
    learning_resources: LearningResource[];
}

interface PortfolioProject {
    title: string;
    description: string;
    tech_stack: string[];
}

interface CareerPlanResult {
    summary: string;
    target_role: string;
    duration_months: number;
    skill_gap_analysis: SkillGapAnalysis;
    milestones: Milestone[];
    portfolio_projects: PortfolioProject[];
    tips_for_success: string[];
}

export default function CareerPlannerPage() {
    const [targetRole, setTargetRole] = useState('');
    const [durationMonths, setDurationMonths] = useState<3 | 5>(3);
    const [currentSkillsInput, setCurrentSkillsInput] = useState('');
    const [cvText, setCvText] = useState('');
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<CareerPlanResult | null>(null);
    const [activeMonthTab, setActiveMonthTab] = useState<number>(1);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!targetRole.trim()) {
            setErrorMessage('Posisi pekerjaan target wajib diisi.');
            return;
        }

        setIsLoading(true);

        const currentSkills = currentSkillsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const response = await fetch('/api/v1/ai/career-plan', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    target_role: targetRole.trim(),
                    duration_months: durationMonths,
                    current_skills: currentSkills,
                    cv_text: cvText.trim() || null,
                    notes: notes.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.message ||
                        'Gagal menyusun roadmap karier. Silakan coba kembali.',
                );
                setIsLoading(false);
                return;
            }

            setResult(data.data);
            setActiveMonthTab(1);
        } catch {
            setErrorMessage(
                'Terjadi gangguan jaringan saat memproses roadmap AI. Pastikan koneksi aktif.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyRoadmap = () => {
        if (!result) return;
        const textToCopy =
            `=== ROADMAP KARIER: ${result.target_role} (${result.duration_months} BULAN) ===\n\n` +
            `Ringkasan: ${result.summary}\n\n` +
            `Skill Yang Dimiliki: ${result.skill_gap_analysis.matching_skills.join(', ')}\n` +
            `Skill Yang Perlu Dipelajari: ${result.skill_gap_analysis.missing_skills.join(', ')}\n\n` +
            result.milestones
                .map(
                    (m) =>
                        `[BULAN ${m.month}] ${m.theme}\n${m.description}\n` +
                        m.action_items
                            .map((item) => `- [ ] ${item}`)
                            .join('\n'),
                )
                .join('\n\n');

        void navigator.clipboard.writeText(textToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const getMediaBadge = (type: string) => {
        switch (type) {
            case 'youtube':
                return (
                    <Badge variant="accent" size="sm">
                        YouTube
                    </Badge>
                );
            case 'documentation':
                return (
                    <Badge variant="default" size="sm">
                        Dokumentasi
                    </Badge>
                );
            case 'website':
                return (
                    <Badge variant="default" size="sm">
                        Platform Belajar
                    </Badge>
                );
            default:
                return (
                    <Badge variant="default" size="sm">
                        Kursus
                    </Badge>
                );
        }
    };

    return (
        <AppLayout title="AI Career Planner">
            <Head title="AI Career Planner - Roadmap Belajar & Gap Skill" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    LARAVEL AI SDK
                                </span>
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]">
                                    v1.0
                                </span>
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                                Rencana Karier & Analisis Gap Skill
                            </h2>
                            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                AI mengevaluasi skill Anda saat ini terhadap
                                target pekerjaan, menyusun roadmap bulanan
                                realistis (3 atau 5 bulan), merekomendasikan
                                media pembelajaran terpercaya (YouTube, docs
                                resmi, roadmap.sh), serta ide portofolio nyata.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Generator Input */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <h3 className="mb-4 border-b border-[#313131] pb-3 text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                        Tentukan Posisi Target & Durasi Roadmap
                    </h3>

                    {errorMessage && (
                        <div className="mb-4 rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#f87171]">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Pekerjaan / Posisi Target{' '}
                                    <span className="text-[#f87171]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Senior Frontend Developer, Data Analyst, Product Manager"
                                    value={targetRole}
                                    onChange={(e) =>
                                        setTargetRole(e.target.value)
                                    }
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Target Durasi Belajar
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDurationMonths(3)}
                                        className={`flex min-h-[40px] items-center justify-center rounded-[6px] text-[13px] font-medium transition-all ${
                                            durationMonths === 3
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span className="hidden sm:inline">3 Bulan (Intensif)</span>
                                        <span className="sm:hidden">3 Bulan</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDurationMonths(5)}
                                        className={`flex min-h-[40px] items-center justify-center rounded-[6px] text-[13px] font-medium transition-all ${
                                            durationMonths === 5
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span className="hidden sm:inline">5 Bulan (Mendalam)</span>
                                        <span className="sm:hidden">5 Bulan</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                Skill Yang Anda Kuasai Saat Ini (Pisahkan dengan
                                koma)
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: HTML, CSS, JavaScript dasar, React, Git, REST API"
                                value={currentSkillsInput}
                                onChange={(e) =>
                                    setCurrentSkillsInput(e.target.value)
                                }
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Ringkasan CV / Pengalaman Kerja (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Tempelkan ringkasan CV atau latar belakang pengalaman Anda di sini agar analisis AI lebih presisi..."
                                    value={cvText}
                                    onChange={(e) => setCvText(e.target.value)}
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Catatan / Preferensi Pembelajaran (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Contoh: Lebih menyukai video tutorial YouTube berbahasa Indonesia/Inggris, ingin fokus ke backend Laravel, punya waktu 2 jam per hari..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                {isLoading ? (
                                    <>
                                        <svg
                                            className="h-4 w-4 animate-spin text-[#0a0a0a]"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                strokeOpacity="0.25"
                                            />
                                            <path d="M12 2a10 10 0 0 1 10 10" />
                                        </svg>
                                        <span>
                                            Menyusun Roadmap dengan AI...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                            <polyline points="20 17 12 22 2 17" />
                                            <polyline points="2 12 12 17 22 12" />
                                        </svg>
                                        <span>Buat Roadmap Karier AI</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Loading Radar Animation */}
                {isLoading && (
                    <div className="space-y-3 rounded-[8px] border border-[#313131] bg-[#141414] p-12 text-center">
                        <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-full border border-[#6798ff]/40 bg-[#6798ff]/10 text-[#6798ff]">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                            </svg>
                        </div>
                        <h4 className="text-[16px] font-semibold text-[#ffffff]">
                            Ai Sedang Menganalisis Gap Skill & Menyusun
                            Kurikulum...
                        </h4>
                        <p className="mx-auto max-w-md text-[13px] text-[#a7a7a7]">
                            Menghitung tahapan bulanan, rekomendasi media
                            YouTube & website belajar, dan ide portofolio nyata
                            untuk {targetRole}.
                        </p>
                    </div>
                )}

                {/* AI RESULT PRESENTATION */}
                {result && !isLoading && (
                    <div className="space-y-6">
                        {/* Summary & Actions Bar */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="flex flex-col gap-3 border-b border-[#313131] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                        HASIL ANALISIS KESIAPAN
                                    </span>
                                    <h3 className="text-[18px] font-semibold text-[#ffffff]">
                                        Roadmap {result.target_role} (
                                        {result.duration_months} Bulan)
                                    </h3>
                                </div>
                                <div className="flex w-full items-center gap-2 sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleCopyRoadmap}
                                        className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-[6px] border border-[#454545] bg-[#1e1e1e] px-3.5 text-[12px] font-medium text-[#ffffff] transition-colors hover:border-[#6798ff] sm:w-auto sm:min-h-[38px]"
                                    >
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <rect
                                                x="9"
                                                y="9"
                                                width="13"
                                                height="13"
                                                rx="2"
                                                ry="2"
                                            />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                        <span>
                                            {copySuccess
                                                ? 'Tersalin!'
                                                : 'Salin Seluruh Rencana'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <p className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4 text-[14px] leading-relaxed text-[#ffffff]">
                                {result.summary}
                            </p>

                            {/* Skill Gap Analysis Box */}
                            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                                {/* Matching Skills */}
                                <div className="rounded-[6px] border border-[#34d399]/30 bg-[#34d399]/5 p-4">
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#34d399]/20 font-mono text-[11px] text-[#34d399]">
                                            ✓
                                        </span>
                                        <h4 className="text-[13px] font-semibold text-[#34d399]">
                                            Skill Yang Sudah Sesuai (Matching)
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.skill_gap_analysis.matching_skills.map(
                                            (skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-[4px] border border-[#34d399]/40 bg-[#34d399]/15 px-2 py-0.5 text-[12px] text-[#34d399]"
                                                >
                                                    {skill}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Missing Skills */}
                                <div className="rounded-[6px] border border-[#6798ff]/30 bg-[#6798ff]/5 p-4">
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6798ff]/20 font-mono text-[11px] text-[#6798ff]">
                                            +
                                        </span>
                                        <h4 className="text-[13px] font-semibold text-[#6798ff]">
                                            Skill Yang Perlu Dipelajari (Missing
                                            Gap)
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {result.skill_gap_analysis.missing_skills.map(
                                            (skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-[4px] border border-[#6798ff]/40 bg-[#6798ff]/15 px-2 py-0.5 text-[12px] text-[#6798ff]"
                                                >
                                                    {skill}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Month-by-Month Milestones */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                                <div>
                                    <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                        TAHAPAN BELAJAR
                                    </span>
                                    <h3 className="text-[17px] font-semibold text-[#ffffff]">
                                        Kurikulum & Milestone Per Bulan
                                    </h3>
                                </div>
                                <span className="font-mono text-[12px] text-[#a7a7a7]">
                                    {result.milestones.length} Bulan
                                </span>
                            </div>

                            {/* Month Selector Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {result.milestones.map((m) => (
                                    <button
                                        key={m.month}
                                        type="button"
                                        onClick={() =>
                                            setActiveMonthTab(m.month)
                                        }
                                        className={`flex min-h-[40px] shrink-0 items-center gap-2 rounded-[6px] px-4 text-[13px] font-medium transition-colors ${
                                            activeMonthTab === m.month
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span className="font-mono text-[11px] text-[#6798ff]">
                                            M{m.month}
                                        </span>
                                        <span>Bulan {m.month}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Active Month Detail */}
                            {(() => {
                                const activeM = result.milestones.find(
                                    (m) => m.month === activeMonthTab,
                                );
                                if (!activeM) return null;

                                return (
                                    <div className="space-y-4 pt-2">
                                        <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    Fokus Bulan {activeM.month}
                                                </Badge>
                                                <h4 className="text-[15px] font-semibold text-[#ffffff]">
                                                    {activeM.theme}
                                                </h4>
                                            </div>
                                            <p className="mt-2 text-[13px] leading-relaxed text-[#a7a7a7]">
                                                {activeM.description}
                                            </p>
                                        </div>

                                        {/* Action Items Checklist */}
                                        <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4">
                                            <h5 className="mb-2.5 font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                                TUGAS & ACTION ITEMS WAJIB
                                            </h5>
                                            <ul className="space-y-2">
                                                {activeM.action_items.map(
                                                    (item, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2.5 text-[13px] text-[#ffffff]"
                                                        >
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] font-mono text-[10px] text-[#6798ff]">
                                                                {idx + 1}
                                                            </span>
                                                            <span>{item}</span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>

                                        {/* Recommended Learning Resources */}
                                        <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4">
                                            <h5 className="mb-3 font-mono text-[11px] tracking-[0.85px] text-[#34d399] uppercase">
                                                REKOMENDASI MEDIA BELAJAR
                                                (YOUTUBE / DOKUMENTASI /
                                                WEBSITE)
                                            </h5>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {activeM.learning_resources.map(
                                                    (res, rIdx) => (
                                                        <div
                                                            key={rIdx}
                                                            className="space-y-1.5 rounded-[6px] border border-[#313131] bg-[#141414] p-3.5"
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="truncate text-[13px] font-semibold text-[#ffffff]">
                                                                    {res.title}
                                                                </span>
                                                                {getMediaBadge(
                                                                    res.media_type,
                                                                )}
                                                            </div>
                                                            <p className="font-mono text-[12px] text-[#6798ff]">
                                                                Platform:{' '}
                                                                {
                                                                    res.platform_or_channel
                                                                }
                                                            </p>
                                                            <p className="text-[12px] leading-snug text-[#a7a7a7]">
                                                                {
                                                                    res.why_recommended
                                                                }
                                                            </p>
                                                            <div className="pt-1">
                                                                <span className="block truncate font-mono text-[10px] text-[#7c7c7c]">
                                                                    Query / URL:{' '}
                                                                    {
                                                                        res.search_query_or_url
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Portfolio Projects Recommendation */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="border-b border-[#313131] pb-3">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    PEMBUKTIAN KOMPETENSI
                                </span>
                                <h3 className="text-[17px] font-semibold text-[#ffffff]">
                                    Rekomendasi Ide Proyek Portofolio Nyata
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {result.portfolio_projects.map((proj, pIdx) => (
                                    <div
                                        key={pIdx}
                                        className="space-y-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4"
                                    >
                                        <h4 className="text-[15px] font-semibold text-[#ffffff]">
                                            {proj.title}
                                        </h4>
                                        <p className="text-[13px] leading-relaxed text-[#a7a7a7]">
                                            {proj.description}
                                        </p>
                                        <div className="border-t border-[#313131]/60 pt-2">
                                            <span className="mb-1 block font-mono text-[10px] text-[#7c7c7c] uppercase">
                                                Tech Stack:
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {proj.tech_stack.map((t) => (
                                                    <span
                                                        key={t}
                                                        className="rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2 py-0.5 font-mono text-[11px] text-[#6798ff]"
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips for Success */}
                        <div className="space-y-3 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <h4 className="font-mono text-[11px] tracking-[0.85px] text-[#f59e0b] uppercase">
                                TIPS KONSISTENSI BELAJAR & PENCARIAN KERJA
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {result.tips_for_success.map((tip, tIdx) => (
                                    <div
                                        key={tIdx}
                                        className="flex items-start gap-2.5 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 text-[13px] text-[#a7a7a7]"
                                    >
                                        <span className="font-mono font-bold text-[#f59e0b]">
                                            #
                                        </span>
                                        <span>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
