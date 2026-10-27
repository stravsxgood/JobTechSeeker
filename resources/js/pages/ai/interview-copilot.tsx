import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface InterviewOverview {
    job_title: string;
    job_source: string;
    interviewer_persona: string;
    summary: string;
}

interface InterviewQuestion {
    number: number;
    category: 'introductory' | 'technical' | 'behavioral' | 'case_scenario';
    question: string;
    why_asked: string;
    key_points_to_answer: string[];
    sample_good_response: string;
    pitfall_to_avoid: string;
}

interface StrategicQuestion {
    question: string;
    purpose: string;
}

interface InterviewPrepResult {
    interview_overview: InterviewOverview;
    questions: InterviewQuestion[];
    questions_to_ask_interviewer: StrategicQuestion[];
    preparation_checklist: string[];
}

interface ApplicationOption {
    id: string;
    job_title: string;
    company_name?: string;
    company?: {
        id: string;
        name: string;
    };
    source_url?: string | null;
    description?: string | null;
}

export default function InterviewCopilotPage() {
    // Form states
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobUrl, setJobUrl] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [selectedApplicationId, setSelectedApplicationId] =
        useState<string>('');
    const [interviewFocus, setInterviewFocus] = useState<
        'all' | 'technical' | 'behavioral' | 'hr'
    >('all');

    // Applications dropdown list
    const [applications, setApplications] = useState<ApplicationOption[]>([]);
    const [isLoadingApps, setIsLoadingApps] = useState(false);

    // AI Generation states
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<InterviewPrepResult | null>(null);

    // Filter & UI states
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedQuestions, setExpandedQuestions] = useState<
        Record<number, boolean>
    >({});
    const [userNotes, setUserNotes] = useState<Record<number, string>>({});
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(
        {},
    );
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch user's tracked applications on mount to allow one-click autofill
    useEffect(() => {
        const fetchUserApplications = async () => {
            setIsLoadingApps(true);
            try {
                const token = localStorage.getItem('careerpilot_token');
                const headers: Record<string, string> = {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                };
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await fetch('/api/v1/applications?per_page=50', {
                    headers,
                    credentials: 'same-origin',
                });

                if (res.ok) {
                    const json = await res.json();
                    setApplications(json.data || []);
                }
            } catch {
                // Silently ignore
            } finally {
                setIsLoadingApps(false);
            }
        };

        void fetchUserApplications();

        // Read query parameters if navigated from dashboard/application modal
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const qAppId = params.get('application_id');
            const qTitle = params.get('job_title');
            const qCompany = params.get('company');
            const qUrl = params.get('url');

            if (qAppId) setSelectedApplicationId(qAppId);
            if (qTitle) setJobTitle(qTitle);
            if (qCompany) setCompanyName(qCompany);
            if (qUrl) setJobUrl(qUrl);
        }
    }, []);

    // Detect portal domain from URL
    const getPortalHint = (url: string) => {
        try {
            const host = new URL(url).hostname.toLowerCase();
            if (host.includes('linkedin')) return 'LinkedIn';
            if (host.includes('glints')) return 'Glints';
            if (host.includes('jobstreet')) return 'JobStreet';
            if (host.includes('indeed')) return 'Indeed';
            if (host.includes('kalibrr')) return 'Kalibrr';
            if (host.includes('pintarnya')) return 'Pintarnya';
            return 'Portal Karier';
        } catch {
            return null;
        }
    };

    // Handle selecting an existing tracked application
    const handleSelectApplication = (appId: string) => {
        setSelectedApplicationId(appId);
        if (!appId) return;

        const found = applications.find((a) => a.id === appId);
        if (found) {
            setJobTitle(found.job_title || '');
            setCompanyName(found.company?.name || found.company_name || '');
            if (found.source_url) setJobUrl(found.source_url);
            if (found.description) setJobDescription(found.description);
        }
    };

    // Quick fill sample data for quick preview & testing
    const handleFillSample = () => {
        setJobTitle('Senior Fullstack Engineer');
        setCompanyName('Tokopedia (GoTo Group)');
        setJobUrl('https://www.linkedin.com/jobs/view/3829102847');
        setJobDescription(
            'Membangun sistem frontend berskala besar dengan React, Next.js, dan microservices backend Node.js / Go. Berpengalaman dalam database PostgreSQL, Redis caching, dan arsitektur event-driven.',
        );
        setSelectedApplicationId('');
        setInterviewFocus('all');
    };

    // Submit generation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!jobTitle.trim()) {
            setErrorMessage('Nama posisi / pekerjaan wajib diisi.');
            return;
        }

        if (!jobUrl.trim()) {
            setErrorMessage(
                'Tautan lowongan pekerjaan (URL) wajib diisi untuk mendeteksi portal.',
            );
            return;
        }

        setIsLoading(true);

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

            const response = await fetch('/api/v1/ai/interview-preparation', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    job_title: jobTitle.trim(),
                    job_url: jobUrl.trim(),
                    company_name: companyName.trim() || null,
                    job_description: jobDescription.trim() || null,
                    interview_focus: interviewFocus,
                    application_id: selectedApplicationId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.message ||
                        'Layanan AI sedang sibuk. Silakan periksa kembali input atau coba beberapa saat lagi.',
                );
                setIsLoading(false);
                return;
            }

            setResult(data.data);
            setSelectedCategory('all');

            // Default open first 2 questions
            setExpandedQuestions({ 1: true, 2: true });

            // Restore user notes & checklist from storage if matching job
            const savedNotesKey = `cp_interview_notes_${jobTitle.trim()}`;
            const localNotes = localStorage.getItem(savedNotesKey);
            if (localNotes) {
                try {
                    setUserNotes(JSON.parse(localNotes));
                } catch {
                    // Ignore corrupted JSON
                }
            }
        } catch {
            setErrorMessage(
                'Terjadi gangguan jaringan saat memproses persiapan wawancara. Pastikan koneksi internet aktif.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle accordion state
    const toggleQuestion = (num: number) => {
        setExpandedQuestions((prev) => ({
            ...prev,
            [num]: !prev[num],
        }));
    };

    // Toggle checklist item
    const toggleCheckItem = (idx: number) => {
        setCheckedItems((prev) => ({
            ...prev,
            [idx]: !prev[idx],
        }));
    };

    // Save individual note
    const handleNoteChange = (num: number, val: string) => {
        const nextNotes = { ...userNotes, [num]: val };
        setUserNotes(nextNotes);
        if (result?.interview_overview.job_title) {
            localStorage.setItem(
                `cp_interview_notes_${result.interview_overview.job_title}`,
                JSON.stringify(nextNotes),
            );
        }
    };

    // Copy entire interview package
    const handleCopyAll = () => {
        if (!result) return;

        const overview = result.interview_overview;
        let text = `=== SIMULASI & PANDUAN INTERVIEW: ${overview.job_title} ===\n`;
        text += `Sumber / Portal: ${overview.job_source}\n`;
        text += `Pewawancara: ${overview.interviewer_persona}\n`;
        text += `Ringkasan: ${overview.summary}\n\n`;

        text += `--- DAFTAR PERTANYAAN WAWANCARA ---\n\n`;
        result.questions.forEach((q) => {
            text += `[#${q.number} - ${q.category.toUpperCase()}]\n`;
            text += `Pertanyaan: ${q.question}\n`;
            text += `Tujuan Rekruter: ${q.why_asked}\n`;
            text += `Poin Kunci Jawaban:\n${q.key_points_to_answer.map((p) => `  * ${p}`).join('\n')}\n`;
            text += `Contoh Jawaban Baik:\n${q.sample_good_response}\n`;
            text += `Jebakan yang Dihindari: ${q.pitfall_to_avoid}\n`;
            if (userNotes[q.number]) {
                text += `Catatan Pribadi: ${userNotes[q.number]}\n`;
            }
            text += `\n`;
        });

        text += `--- PERTANYAAN STRATEGIS UNTUK PEWAWANCARA ---\n\n`;
        result.questions_to_ask_interviewer.forEach((qi, idx) => {
            text += `${idx + 1}. "${qi.question}"\n   Tujuan: ${qi.purpose}\n\n`;
        });

        text += `--- CHECKLIST PRA-INTERVIEW ---\n\n`;
        result.preparation_checklist.forEach((item, idx) => {
            const isDone = checkedItems[idx] ? '[x]' : '[ ]';
            text += `${isDone} ${item}\n`;
        });

        void navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2500);
    };

    const portalHint = getPortalHint(jobUrl);

    // Filter questions by active category
    const filteredQuestions = result?.questions.filter((q) => {
        if (selectedCategory === 'all') return true;
        return q.category === selectedCategory;
    });

    const categoryBadges: Record<
        string,
        { label: string; variant: 'default' | 'accent' | 'warning' | 'success' }
    > = {
        introductory: { label: 'Introductory', variant: 'accent' },
        technical: { label: 'Technical', variant: 'warning' },
        behavioral: { label: 'Behavioral (STAR)', variant: 'success' },
        case_scenario: { label: 'Case Study', variant: 'default' },
    };

    // Checklist progress calculation
    const totalChecklist = result?.preparation_checklist.length || 0;
    const completedChecklist =
        Object.values(checkedItems).filter(Boolean).length;
    const checklistProgress =
        totalChecklist > 0
            ? Math.round((completedChecklist / totalChecklist) * 100)
            : 0;

    return (
        <AppLayout
            title="AI Interview Copilot"
            action={
                <Link
                    href="/ai/career-planner"
                    className="flex min-h-[44px] items-center gap-2 rounded-[8px] border border-[#313131] bg-[#141414] px-3.5 py-2 text-[13px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                >
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span className="hidden sm:inline">Buka Career Planner</span>
                    <span className="sm:hidden">Career Planner</span>
                </Link>
            }
        >
            <Head title="AI Interview Copilot - Simulasi & Panduan Wawancara Kerja" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    LARAVEL AI SDK & GEMINI
                                </span>
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]">
                                    v1.0
                                </span>
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                                AI Interview Copilot
                            </h2>
                            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                Simulasi wawancara kerja profesional berdasarkan
                                tautan lowongan asli (LinkedIn, Glints,
                                JobStreet, Indeed, dll.). Dapatkan prediksi
                                pertanyaan teknis, studi kasus nyata, panduan
                                behavioral dengan metode STAR, serta checklist
                                pra-wawancara.
                            </p>
                        </div>

                        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                            <button
                                type="button"
                                onClick={handleFillSample}
                                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-3.5 py-2 text-[12px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:w-auto"
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <span>Isi Contoh Cepat</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Input Panel */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-[#313131] pb-3">
                        <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                            Parameter Simulasi Wawancara
                        </h3>
                        {applications.length > 0 && (
                            <span className="font-mono text-[11px] text-[#7c7c7c]">
                                {applications.length} lamaran terlacak
                            </span>
                        )}
                    </div>

                    {errorMessage && (
                        <div className="mb-4 rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#f87171]">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Auto-fill from active application */}
                        {applications.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Pilih Dari Lamaran Anda (Opsional -
                                    Auto-fill data)
                                </label>
                                <select
                                    value={selectedApplicationId}
                                    onChange={(e) =>
                                        handleSelectApplication(e.target.value)
                                    }
                                    disabled={isLoadingApps || isLoading}
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                >
                                    <option value="">
                                        -- Masukkan Manual / Lowongan Baru --
                                    </option>
                                    {applications.map((app) => (
                                        <option key={app.id} value={app.id}>
                                            {app.job_title} -{' '}
                                            {app.company?.name ||
                                                app.company_name ||
                                                'Perusahaan'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Posisi / Pekerjaan Yang Dilamar{' '}
                                    <span className="text-[#f87171]">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Senior Backend Engineer, Product Manager"
                                    value={jobTitle}
                                    onChange={(e) =>
                                        setJobTitle(e.target.value)
                                    }
                                    disabled={isLoading}
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Nama Perusahaan (Opsional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Gojek, Shopee, BCA, Telkom"
                                    value={companyName}
                                    onChange={(e) =>
                                        setCompanyName(e.target.value)
                                    }
                                    disabled={isLoading}
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Tautan Lowongan Pekerjaan (URL Portal){' '}
                                    <span className="text-[#f87171]">*</span>
                                </label>
                                {portalHint && (
                                    <span className="font-mono text-[11px] text-[#6798ff]">
                                        Terdeteksi: {portalHint}
                                    </span>
                                )}
                            </div>
                            <input
                                type="url"
                                required
                                placeholder="https://www.linkedin.com/jobs/view/... atau tautan Glints, JobStreet, Indeed"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                disabled={isLoading}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>

                        {/* Focus Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                Fokus Simulasi Wawancara
                            </label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    {
                                        id: 'all',
                                        label: 'Komprehensif',
                                        sub: 'Semua Aspek',
                                    },
                                    {
                                        id: 'technical',
                                        label: 'Technical',
                                        sub: 'Koding & Arsitektur',
                                    },
                                    {
                                        id: 'behavioral',
                                        label: 'Behavioral',
                                        sub: 'Metode STAR',
                                    },
                                    {
                                        id: 'hr',
                                        label: 'HR & Fit',
                                        sub: 'Motivasi & Culture',
                                    },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            setInterviewFocus(item.id as any)
                                        }
                                        className={`flex min-h-[44px] flex-col items-center justify-center rounded-[6px] p-2 text-center transition-all ${
                                            interviewFocus === item.id
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span className="text-[13px] font-medium">
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] text-[#7c7c7c]">
                                            {item.sub}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional Job Description */}
                        <div className="space-y-1.5">
                            <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                Catatan / Ringkasan Deskripsi Lowongan
                                (Opsional)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Salin poin kualifikasi lowongan atau catatan khusus yang ingin diuji..."
                                value={jobDescription}
                                onChange={(e) =>
                                    setJobDescription(e.target.value)
                                }
                                disabled={isLoading}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>

                        <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
                            <span className="text-[12px] text-[#7c7c7c]">
                                AI menggunakan Gemini & Laravel AI SDK untuk
                                menghasilkan output terstruktur.
                            </span>

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                className="w-full min-w-[200px] sm:w-auto"
                            >
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>Mulai Simulasi Wawancara</span>
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Loading Banner State */}
                {isLoading && (
                    <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#6798ff]/30 bg-[#6798ff]/10 text-[#6798ff]">
                            <svg
                                className="h-6 w-6 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[16px] font-medium text-[#ffffff]">
                                Menyusun Simulasi Wawancara...
                            </h4>
                            <p className="mx-auto max-w-md text-[13px] text-[#a7a7a7]">
                                Membaca persyaratan posisi {jobTitle}, menyusun
                                pertanyaan realistis, menganalisis jebakan
                                rekruter, dan merancang checklist persiapan.
                            </p>
                        </div>
                    </div>
                )}

                {/* AI Results Section */}
                {result && !isLoading && (
                    <div className="space-y-6">
                        {/* Overview Banner Card */}
                        <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="accent" size="sm">
                                            {
                                                result.interview_overview
                                                    .job_source
                                            }
                                        </Badge>
                                        <span className="font-mono text-[11px] text-[#7c7c7c]">
                                            Pewawancara:{' '}
                                            {
                                                result.interview_overview
                                                    .interviewer_persona
                                            }
                                        </span>
                                    </div>
                                    <h3 className="text-[20px] font-semibold tracking-[-0.3px] text-[#ffffff]">
                                        {result.interview_overview.job_title}
                                    </h3>
                                    <p className="max-w-3xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                        {result.interview_overview.summary}
                                    </p>
                                </div>

                                <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleCopyAll}
                                        className="min-h-[44px] w-full justify-center sm:min-h-[40px] sm:w-auto"
                                    >
                                        {copySuccess ? (
                                            <>
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#34d399"
                                                    strokeWidth="2.5"
                                                >
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                <span className="text-[#34d399]">
                                                    Materi Tersalin!
                                                </span>
                                            </>
                                        ) : (
                                            <>
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
                                                    ></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                <span>Salin Semua Materi</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Questions Section with Filter Tabs */}
                        <div className="space-y-5 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="flex flex-col gap-3 border-b border-[#313131] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h4 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                        Daftar Pertanyaan & Panduan Menjawab
                                    </h4>
                                    <p className="text-[12px] text-[#7c7c7c]">
                                        Klik pada setiap pertanyaan untuk
                                        membuka detail tujuan rekruter, poin
                                        kunci, dan contoh jawaban.
                                    </p>
                                </div>

                                {/* Category Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none">
                                    {[
                                        {
                                            id: 'all',
                                            label: `Semua (${result.questions.length})`,
                                        },
                                        {
                                            id: 'introductory',
                                            label: `Intro (${result.questions.filter((q) => q.category === 'introductory').length})`,
                                        },
                                        {
                                            id: 'technical',
                                            label: `Teknis (${result.questions.filter((q) => q.category === 'technical').length})`,
                                        },
                                        {
                                            id: 'behavioral',
                                            label: `STAR (${result.questions.filter((q) => q.category === 'behavioral').length})`,
                                        },
                                        {
                                            id: 'case_scenario',
                                            label: `Kasus (${result.questions.filter((q) => q.category === 'case_scenario').length})`,
                                        },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedCategory(tab.id)
                                            }
                                            className={`shrink-0 rounded-[4px] px-2.5 py-1.5 sm:py-1 text-[12px] font-medium transition-colors ${
                                                selectedCategory === tab.id
                                                    ? 'bg-[#6798ff] font-semibold text-[#0a0a0a]'
                                                    : 'bg-[#1e1e1e] text-[#a7a7a7] hover:text-[#ffffff]'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-4">
                                {filteredQuestions &&
                                filteredQuestions.length > 0 ? (
                                    filteredQuestions.map((q) => {
                                        const isOpen =
                                            !!expandedQuestions[q.number];
                                        const badgeInfo = categoryBadges[
                                            q.category
                                        ] || {
                                            label: q.category,
                                            variant: 'default',
                                        };

                                        return (
                                            <div
                                                key={q.number}
                                                className="overflow-hidden rounded-[8px] border border-[#313131] bg-[#1e1e1e] transition-colors"
                                            >
                                                {/* Question Header Accordion Trigger */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleQuestion(q.number)
                                                    }
                                                    className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-[#252525] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:p-5"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-[#313131] bg-[#0a0a0a] font-mono text-[11px] font-semibold text-[#6798ff]">
                                                            {q.number}
                                                        </span>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant={
                                                                        badgeInfo.variant
                                                                    }
                                                                    size="sm"
                                                                >
                                                                    {
                                                                        badgeInfo.label
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            <p className="text-[15px] leading-snug font-medium text-[#ffffff]">
                                                                {q.question}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 pt-0.5 text-[#7c7c7c]">
                                                        <svg
                                                            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <polyline points="6 9 12 15 18 9"></polyline>
                                                        </svg>
                                                    </div>
                                                </button>

                                                {/* Expanded Content */}
                                                {isOpen && (
                                                    <div className="space-y-4 border-t border-[#313131] bg-[#141414] p-4 sm:p-5">
                                                        {/* Why Asked */}
                                                        <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3.5">
                                                            <span className="font-mono text-[10px] tracking-[0.85px] text-[#6798ff] uppercase">
                                                                Tujuan Rekruter
                                                                (Mengapa
                                                                Ditanyakan)
                                                            </span>
                                                            <p className="text-[13px] leading-relaxed text-[#a7a7a7]">
                                                                {q.why_asked}
                                                            </p>
                                                        </div>

                                                        {/* Key Points To Answer */}
                                                        <div className="space-y-1.5">
                                                            <span className="font-mono text-[10px] tracking-[0.85px] text-[#34d399] uppercase">
                                                                Poin Kunci
                                                                Jawaban Yang
                                                                Dinilai
                                                            </span>
                                                            <ul className="space-y-1">
                                                                {q.key_points_to_answer.map(
                                                                    (
                                                                        point,
                                                                        pIdx,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                pIdx
                                                                            }
                                                                            className="flex items-start gap-2 text-[13px] text-[#ffffff]"
                                                                        >
                                                                            <svg
                                                                                className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]"
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                            >
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                            </svg>
                                                                            <span>
                                                                                {
                                                                                    point
                                                                                }
                                                                            </span>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </div>

                                                        {/* Sample Good Response */}
                                                        <div className="space-y-1.5 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <svg
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="#6798ff"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                                </svg>
                                                                <span className="font-mono text-[10px] tracking-[0.85px] text-[#6798ff] uppercase">
                                                                    Contoh
                                                                    Jawaban Yang
                                                                    Kuat &
                                                                    Meyakinkan
                                                                </span>
                                                            </div>
                                                            <p className="border-l-2 border-[#6798ff] pl-2 text-[13px] leading-relaxed whitespace-pre-line text-[#ffffff] italic">
                                                                "
                                                                {
                                                                    q.sample_good_response
                                                                }
                                                                "
                                                            </p>
                                                        </div>

                                                        {/* Pitfall to avoid */}
                                                        <div className="space-y-1 rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3.5">
                                                            <div className="flex items-center gap-1.5 text-[#f87171]">
                                                                <svg
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                                                    <line
                                                                        x1="12"
                                                                        y1="9"
                                                                        x2="12"
                                                                        y2="13"
                                                                    ></line>
                                                                    <line
                                                                        x1="12"
                                                                        y1="17"
                                                                        x2="12.01"
                                                                        y2="17"
                                                                    ></line>
                                                                </svg>
                                                                <span className="font-mono text-[10px] tracking-[0.85px] uppercase">
                                                                    Jebakan Yang
                                                                    Harus
                                                                    Dihindari
                                                                </span>
                                                            </div>
                                                            <p className="text-[13px] leading-relaxed text-[#f87171]">
                                                                {
                                                                    q.pitfall_to_avoid
                                                                }
                                                            </p>
                                                        </div>

                                                        {/* Personal Draft / Mock Note */}
                                                        <div className="space-y-1.5 border-t border-[#313131] pt-2">
                                                            <div className="flex items-center justify-between">
                                                                <label className="font-mono text-[11px] text-[#a7a7a7]">
                                                                    DRAFT
                                                                    JAWABAN ANDA
                                                                    (Tersimpan
                                                                    otomatis di
                                                                    browser)
                                                                </label>
                                                                {userNotes[
                                                                    q.number
                                                                ] && (
                                                                    <span className="font-mono text-[10px] text-[#34d399]">
                                                                        Tersimpan
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Tuliskan poin atau cerita pengalaman Anda sendiri untuk menjawab pertanyaan ini..."
                                                                value={
                                                                    userNotes[
                                                                        q.number
                                                                    ] || ''
                                                                }
                                                                onChange={(e) =>
                                                                    handleNoteChange(
                                                                        q.number,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[12px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-[13px] text-[#7c7c7c]">
                                        Tidak ada pertanyaan pada kategori ini.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reverse Interview: Questions to Ask the Interviewer */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    REVERSE INTERVIEW
                                </span>
                                <h4 className="mt-1 text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                    Pertanyaan Strategis Untuk Diajukan Kepada
                                    Pewawancara
                                </h4>
                                <p className="text-[12px] text-[#7c7c7c]">
                                    Ajukan pertanyaan ini saat rekruter
                                    memberikan kesempatan bertanya di akhir sesi
                                    interview untuk menunjukkan kedalaman dan
                                    antusiasme Anda.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                                {result.questions_to_ask_interviewer.map(
                                    (qi, idx) => (
                                        <div
                                            key={idx}
                                            className="space-y-2 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-4"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#6798ff]/20 font-mono text-[10px] text-[#6798ff]">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-[14px] font-medium text-[#ffffff]">
                                                    "{qi.question}"
                                                </p>
                                            </div>
                                            <p className="pl-7 text-[12px] leading-relaxed text-[#a7a7a7]">
                                                <span className="font-medium text-[#6798ff]">
                                                    Tujuan:
                                                </span>{' '}
                                                {qi.purpose}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>

                        {/* Pre-Interview Preparation Checklist */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <span className="font-mono text-[11px] tracking-[0.85px] text-[#34d399] uppercase">
                                        CHECKLIST PRA-INTERVIEW
                                    </span>
                                    <h4 className="mt-1 text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                        Persiapan Sebelum Hari-H Interview
                                    </h4>
                                    <p className="text-[12px] text-[#7c7c7c]">
                                        Tandai setiap langkah persiapan saat
                                        Anda telah menyelesaikannya.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[12px] text-[#a7a7a7]">
                                        {completedChecklist} / {totalChecklist}{' '}
                                        Selesai ({checklistProgress}%)
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e1e]">
                                <div
                                    className="h-full bg-[#34d399] transition-all duration-300"
                                    style={{ width: `${checklistProgress}%` }}
                                ></div>
                            </div>

                            <div className="space-y-2 pt-1">
                                {result.preparation_checklist.map(
                                    (item, idx) => {
                                        const isDone = !!checkedItems[idx];
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() =>
                                                    toggleCheckItem(idx)
                                                }
                                                className={`flex w-full items-start gap-3 rounded-[6px] border p-3 text-left transition-colors ${
                                                    isDone
                                                        ? 'border-[#1e3a2f] bg-[#141414] text-[#7c7c7c]'
                                                        : 'border-[#313131] bg-[#1e1e1e] text-[#ffffff] hover:border-[#6798ff]'
                                                }`}
                                            >
                                                <div
                                                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                                                        isDone
                                                            ? 'border-[#34d399] bg-[#34d399] text-[#0a0a0a]'
                                                            : 'border-[#454545] bg-[#0a0a0a]'
                                                    }`}
                                                >
                                                    {isDone && (
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                        >
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </div>
                                                <span
                                                    className={`text-[13px] leading-snug ${isDone ? 'text-[#7c7c7c] line-through' : 'text-[#ffffff]'}`}
                                                >
                                                    {item}
                                                </span>
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
