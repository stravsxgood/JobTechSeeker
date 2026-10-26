import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';

export interface StatusHistoryItem {
    id: string;
    previous_status: string | null;
    new_status: string;
    change_source: string;
    notes: string | null;
    changed_at: string;
}

export interface ApplicationDetailData {
    id: string;
    job_title: string;
    company_name?: string;
    company?: {
        id: string;
        name: string;
    };
    status: string;
    status_label: string;
    is_active: boolean;
    is_terminal: boolean;
    employment_type?: string;
    location?: string | null;
    description?: string | null;
    source?: string | null;
    source_url?: string | null;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_currency?: string | null;
    applied_at?: string | null;
    follow_up_at?: string | null;
    notes?: string | null;
    status_histories?: StatusHistoryItem[];
    created_at: string;
    updated_at: string;
}

interface ApplicationDetailModalProps {
    applicationId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
    saved: ['applied', 'withdrawn'],
    applied: ['screening', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn'],
    screening: ['assessment', 'interview', 'offer', 'rejected', 'withdrawn'],
    assessment: ['screening', 'interview', 'offer', 'rejected', 'withdrawn'],
    interview: ['assessment', 'offer', 'rejected', 'withdrawn'],
    offer: ['withdrawn'],
    rejected: ['applied', 'screening', 'interview'],
    withdrawn: ['applied', 'screening', 'interview'],
};

const STATUS_LABELS: Record<string, string> = {
    saved: 'Tersimpan',
    applied: 'Dilamar',
    screening: 'Screening',
    assessment: 'Assessment',
    interview: 'Interview',
    offer: 'Tawaran (Offer)',
    rejected: 'Ditolak',
    withdrawn: 'Ditarik',
};

export function ApplicationDetailModal({
    applicationId,
    isOpen,
    onClose,
    onUpdated,
}: ApplicationDetailModalProps) {
    const [data, setData] = useState<ApplicationDetailData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');
    const [transitionNotes, setTransitionNotes] = useState<string>('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionError, setTransitionError] = useState<string | null>(null);

    // Stagnant AI Advisor state
    const [isCheckingStagnant, setIsCheckingStagnant] = useState(false);
    const [stagnantResult, setStagnantResult] = useState<Record<string, unknown> | null>(null);
    const [stagnantError, setStagnantError] = useState<string | null>(null);

    // Fetch full application details
    const fetchDetail = async (id: string) => {
        setIsLoading(true);
        setTransitionError(null);
        setStagnantResult(null);
        setStagnantError(null);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`/api/v1/applications/${id}`, {
                headers,
                credentials: 'same-origin',
            });
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
                const nextOptions = VALID_TRANSITIONS[json.data.status] || [];
                setSelectedNewStatus(nextOptions[0] || '');
            }
        } catch {
            // Ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && applicationId) {
            fetchDetail(applicationId);
        } else {
            setData(null);
        }
    }, [isOpen, applicationId]);

    // Escape listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleStatusTransition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data || !selectedNewStatus) return;

        setTransitionError(null);
        setIsTransitioning(true);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`/api/v1/applications/${data.id}/status`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    status: selectedNewStatus,
                    notes: transitionNotes.trim() || null,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setTransitionError(json.message || 'Gagal mengubah status.');
                setIsTransitioning(false);
                return;
            }

            setTransitionNotes('');
            setIsTransitioning(false);
            onUpdated();
            fetchDetail(data.id);
        } catch {
            setTransitionError('Terjadi kesalahan jaringan.');
            setIsTransitioning(false);
        }
    };

    const handleCheckStagnant = async () => {
        if (!data) return;
        setIsCheckingStagnant(true);
        setStagnantError(null);

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`/api/v1/applications/${data.id}/check-stagnant`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });

            const json = await res.json();
            if (res.ok) {
                setStagnantResult(json.data || json);
            } else {
                setStagnantError(json.message || 'Gagal memproses analisis stagnan.');
            }
        } catch {
            setStagnantError('Gagal terhubung ke layanan AI.');
        } finally {
            setIsCheckingStagnant(false);
        }
    };

    if (!isOpen) return null;

    const availableTransitions = data ? VALID_TRANSITIONS[data.status] || [] : [];
    const isStagnant = data ? (Date.now() - new Date(data.updated_at).getTime()) / (1000 * 60 * 60 * 24) >= 14 : false;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
        >
            <div
                className="fixed inset-0 bg-[#000000]/85 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-2xl rounded-[8px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#313131] pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#6798ff]">
                                DETAIL LAMARAN KERJA
                            </span>
                            {isStagnant && (
                                <span className="rounded-[4px] bg-[#f59e0b]/15 border border-[#f59e0b]/40 px-1.5 py-0.2 font-mono text-[10px] text-[#f59e0b]">
                                    Stagnan $\ge 14$ Hari
                                </span>
                            )}
                        </div>
                        <h2 id="detail-modal-title" className="mt-1 text-[20px] font-semibold text-[#ffffff] tracking-[-0.3px]">
                            {data?.job_title || 'Memuat...'}
                        </h2>
                        <p className="text-[14px] text-[#a7a7a7]">
                            {data?.company_name || data?.company?.name || 'Perusahaan'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup detail modal"
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] hover:border-[#6798ff] hover:text-[#ffffff] transition-colors focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {isLoading || !data ? (
                    <div className="py-12 text-center text-[#7c7c7c]">
                        Memuat data lamaran...
                    </div>
                ) : (
                    <div className="mt-5 space-y-6">
                        {/* Stagnant Warning Alert */}
                        {isStagnant && (
                            <div className="rounded-[6px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-[13px] font-semibold text-[#f59e0b]">
                                            Lamaran Tidak Ada Kabar Selama 2+ Minggu
                                        </h4>
                                        <p className="mt-1 text-[12px] text-[#a7a7a7]">
                                            Status lamaran belum diperbarui sejak{' '}
                                            {new Date(data.updated_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}. Jangan patah semangat, Anda dapat meminta rekomendasi alternatif lowongan serupa dari AI.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCheckStagnant}
                                        disabled={isCheckingStagnant}
                                        className="shrink-0 rounded-[6px] border border-[#f59e0b] bg-[#f59e0b]/20 px-3 py-1.5 text-[12px] font-medium text-[#f59e0b] hover:bg-[#f59e0b]/30 transition-colors disabled:opacity-50"
                                    >
                                        {isCheckingStagnant ? 'Menganalisis AI...' : 'Cek Alternatif AI'}
                                    </button>
                                </div>

                                {stagnantError && (
                                    <p className="mt-2 text-[12px] text-[#f87171]">{stagnantError}</p>
                                )}

                                {stagnantResult && (
                                    <div className="mt-3 border-t border-[#f59e0b]/30 pt-3 text-[12px] text-[#ffffff] space-y-2">
                                        <p className="font-medium text-[#34d399]">
                                            ✓ Analisis AI & Notifikasi Email Berhasil Dikirimkan!
                                        </p>
                                        <p className="text-[#a7a7a7]">
                                            Rekomendasi lowongan serupa telah diterbitkan ke Pusat Notifikasi dan email terdaftar Anda.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status & Attributes Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3">
                                <span className="font-mono text-[10px] text-[#7c7c7c] uppercase">STATUS SAAT INI</span>
                                <div className="mt-1">
                                    <Badge variant={data.is_active ? 'accent' : 'default'} size="md">
                                        {data.status_label}
                                    </Badge>
                                </div>
                            </div>
                            <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3">
                                <span className="font-mono text-[10px] text-[#7c7c7c] uppercase">TIPE KERJA</span>
                                <p className="mt-1 text-[13px] font-medium text-[#ffffff] capitalize">
                                    {data.employment_type?.replace('_', ' ') || '-'}
                                </p>
                            </div>
                            <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3">
                                <span className="font-mono text-[10px] text-[#7c7c7c] uppercase">TANGGAL LAMAR</span>
                                <p className="mt-1 font-mono text-[12px] text-[#ffffff]">
                                    {data.applied_at || 'Belum dilamar'}
                                </p>
                            </div>
                            <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3">
                                <span className="font-mono text-[10px] text-[#7c7c7c] uppercase">FOLLOW-UP</span>
                                <p className="mt-1 font-mono text-[12px] text-[#6798ff]">
                                    {data.follow_up_at
                                        ? new Date(data.follow_up_at).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                          })
                                        : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Metadata Details */}
                        <div className="space-y-2 text-[13px]">
                            {data.location && (
                                <div className="flex items-center gap-2 text-[#a7a7a7]">
                                    <span className="font-mono text-[11px] text-[#7c7c7c] w-28 uppercase">Lokasi:</span>
                                    <span className="text-[#ffffff]">{data.location}</span>
                                </div>
                            )}
                            {data.source && (
                                <div className="flex items-center gap-2 text-[#a7a7a7]">
                                    <span className="font-mono text-[11px] text-[#7c7c7c] w-28 uppercase">Sumber:</span>
                                    <span className="text-[#ffffff]">{data.source}</span>
                                    {data.source_url && (
                                        <a
                                            href={data.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] text-[#6798ff] hover:underline"
                                        >
                                            [Buka Tautan Lowongan]
                                        </a>
                                    )}
                                </div>
                            )}
                            {data.notes && (
                                <div className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 mt-2">
                                    <span className="font-mono text-[10px] text-[#7c7c7c] uppercase block mb-1">CATATAN PRIBADI</span>
                                    <p className="text-[12px] leading-relaxed text-[#ffffff] whitespace-pre-wrap">
                                        {data.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* AI Copilot & Career Tools Quick Action */}
                        <div className="rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.85px] text-[#6798ff]">
                                        AI TOOLS BANTUAN
                                    </span>
                                </div>
                                <p className="text-[12px] text-[#a7a7a7]">
                                    Siapkan jawaban interview nyata atau susun roadmap karier untuk posisi ini.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={`/ai/interview-copilot?application_id=${data.id}&job_title=${encodeURIComponent(data.job_title)}&company=${encodeURIComponent(data.company_name || data.company?.name || '')}&url=${encodeURIComponent(data.source_url || '')}`}
                                    className="flex items-center gap-1.5 rounded-[6px] border border-[#6798ff] bg-[#6798ff]/10 px-3 py-1.5 text-[12px] font-medium text-[#6798ff] hover:bg-[#6798ff]/20 transition-colors"
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span>Simulasi Interview</span>
                                </a>
                            </div>
                        </div>

                        {/* Status Transition Panel */}
                        {availableTransitions.length > 0 && (
                            <form
                                onSubmit={handleStatusTransition}
                                className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#6798ff]">
                                        TRANSISI STATUS RESMI
                                    </span>
                                    <span className="text-[11px] text-[#7c7c7c]">Aturan Audit PRD</span>
                                </div>

                                {transitionError && (
                                    <div className="rounded-[4px] border border-[#f87171]/40 bg-[#f87171]/10 p-2 text-[12px] text-[#f87171]">
                                        {transitionError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-mono text-[#a7a7a7] uppercase mb-1">
                                            Ubah Ke Status
                                        </label>
                                        <select
                                            value={selectedNewStatus}
                                            onChange={(e) => setSelectedNewStatus(e.target.value)}
                                            className="w-full rounded-[6px] border border-[#313131] bg-[#141414] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                        >
                                            {availableTransitions.map((st) => (
                                                <option key={st} value={st}>
                                                    {STATUS_LABELS[st] || st}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-mono text-[#a7a7a7] uppercase mb-1">
                                            Catatan Riwayat / Alasan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Lolos berkas, dipanggil HRD"
                                            value={transitionNotes}
                                            onChange={(e) => setTransitionNotes(e.target.value)}
                                            className="w-full rounded-[6px] border border-[#313131] bg-[#141414] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={isTransitioning}
                                        className="rounded-[6px] bg-[#ffffff] px-4 py-1.5 text-[12px] font-medium text-[#0a0a0a] hover:bg-[#a7a7a7] transition-colors disabled:opacity-50"
                                    >
                                        {isTransitioning ? 'Memproses...' : 'Perbarui Status'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Audit Status History Timeline */}
                        <div>
                            <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#a7a7a7] block mb-3">
                                RIWAYAT PERUBAHAN STATUS (AUDIT LOG)
                            </span>
                            <div className="space-y-2 border-l border-[#313131] pl-4 ml-2">
                                {data.status_histories && data.status_histories.length > 0 ? (
                                    data.status_histories.map((hist) => (
                                        <div key={hist.id} className="relative">
                                            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#6798ff]" />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[12px] font-medium text-[#ffffff]">
                                                    {hist.previous_status ? `${STATUS_LABELS[hist.previous_status] || hist.previous_status} → ` : 'Awal: '}
                                                    <span className="text-[#6798ff]">{STATUS_LABELS[hist.new_status] || hist.new_status}</span>
                                                </span>
                                                <span className="font-mono text-[10px] text-[#7c7c7c]">
                                                    {new Date(hist.changed_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            {hist.notes && (
                                                <p className="mt-0.5 text-[11px] text-[#a7a7a7] italic">
                                                    "{hist.notes}"
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[12px] text-[#7c7c7c]">Belum ada riwayat transisi status.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
