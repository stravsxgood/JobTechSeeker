import React, { useState, useEffect } from 'react';

interface QuickAddApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickAddApplicationModal({
    isOpen,
    onClose,
    onSuccess,
}: QuickAddApplicationModalProps) {
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [status, setStatus] = useState('applied');
    const [employmentType, setEmploymentType] = useState('full-time');
    const [location, setLocation] = useState('');
    const [source, setSource] = useState('LinkedIn');
    const [sourceUrl, setSourceUrl] = useState('');
    const [appliedAt, setAppliedAt] = useState(
        new Date().toISOString().split('T')[0],
    );
    const [followUpAt, setFollowUpAt] = useState(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
    );
    const [notes, setNotes] = useState('');

    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Escape key listener (R-32 Accessibility)
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

    // Check duplicate debounce
    useEffect(() => {
        if (!companyName.trim() || !jobTitle.trim() || !isOpen) {
            setDuplicateWarning(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const token = localStorage.getItem('careerpilot_token');
                const headers: Record<string, string> = {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                };
                if (token) headers.Authorization = `Bearer ${token}`;

                const url = `/api/v1/applications/check-duplicate?company_name=${encodeURIComponent(
                    companyName.trim(),
                )}&job_title=${encodeURIComponent(jobTitle.trim())}`;
                const res = await fetch(url, {
                    headers,
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.is_duplicate) {
                        setDuplicateWarning(
                            `Peringatan: Anda sudah pernah mencatat lamaran untuk "${jobTitle}" di "${companyName}".`,
                        );
                    } else {
                        setDuplicateWarning(null);
                    }
                }
            } catch {
                // Ignore
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [companyName, jobTitle, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError(null);

        if (!companyName.trim() || !jobTitle.trim()) {
            setServerError('Nama perusahaan dan posisi pekerjaan wajib diisi.');
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

            const payload = {
                company_name: companyName.trim(),
                job_title: jobTitle.trim(),
                status,
                employment_type: employmentType,
                location: location.trim() || null,
                source: source || null,
                source_url: sourceUrl.trim() || null,
                applied_at: status !== 'saved' ? appliedAt : null,
                follow_up_at: followUpAt || null,
                notes: notes.trim() || null,
            };

            const res = await fetch('/api/v1/applications', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || 'Gagal menyimpan lamaran.');
                setIsLoading(false);
                return;
            }

            // Reset & Close
            setCompanyName('');
            setJobTitle('');
            setLocation('');
            setSourceUrl('');
            setNotes('');
            setIsLoading(false);
            onSuccess();
            onClose();
        } catch {
            setServerError('Terjadi kesalahan jaringan. Silakan coba lagi.');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog (Dovetail Theme) */}
            <div className="relative z-10 w-full max-w-xl rounded-[8px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#313131] pb-4">
                    <div>
                        <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                            PENCATATAN LAMARAN
                        </span>
                        <h2
                            id="quick-add-title"
                            className="text-[18px] font-semibold tracking-[-0.3px] text-[#ffffff]"
                        >
                            Tambah Lamaran Baru
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup form"
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
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

                {serverError && (
                    <div className="mt-4 rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#f87171]">
                        {serverError}
                    </div>
                )}

                {duplicateWarning && (
                    <div className="mt-4 rounded-[6px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 p-3 text-[12px] text-[#f59e0b]">
                        {duplicateWarning}
                    </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Perusahaan{' '}
                                <span className="text-[#f87171]">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: GoTo, Shopee, Mandiri"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Posisi Pekerjaan{' '}
                                <span className="text-[#f87171]">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Frontend Engineer"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Status Awal
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            >
                                <option value="applied">
                                    Dilamar (Applied)
                                </option>
                                <option value="saved">Tersimpan (Saved)</option>
                                <option value="screening">Screening</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Penawaran (Offer)</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Tipe Kerja
                            </label>
                            <select
                                value={employmentType}
                                onChange={(e) =>
                                    setEmploymentType(e.target.value)
                                }
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            >
                                <option value="full-time">Full-time</option>
                                <option value="contract">Kontrak</option>
                                <option value="internship">
                                    Magang (Intern)
                                </option>
                                <option value="part-time">Part-time</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Lokasi / Mode
                            </label>
                            <input
                                type="text"
                                placeholder="Jakarta / Remote"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Sumber Lowongan
                            </label>
                            <select
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            >
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="JobStreet">JobStreet</option>
                                <option value="Glints">Glints</option>
                                <option value="Website Perusahaan">
                                    Website Perusahaan
                                </option>
                                <option value="Referral">
                                    Rekomendasi Teman
                                </option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                URL Lowongan (Opsional)
                            </label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={sourceUrl}
                                onChange={(e) => setSourceUrl(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Tanggal Lamar
                            </label>
                            <input
                                type="date"
                                value={appliedAt}
                                onChange={(e) => setAppliedAt(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                                Tanggal Target Follow-up
                            </label>
                            <input
                                type="date"
                                value={followUpAt}
                                onChange={(e) => setFollowUpAt(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-[12px] font-medium text-[#a7a7a7]">
                            Catatan / Catatan Seleksi
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Catatan mengenai recruiter, berkas yang dikirim, atau gaji..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 border-t border-[#313131] pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-[6px] border border-[#454545] bg-[#1e1e1e] px-4 py-2 text-[13px] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-[6px] bg-[#ffffff] px-4 py-2 text-[13px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#a7a7a7] disabled:opacity-50"
                        >
                            {isLoading ? 'Menyimpan...' : 'Simpan Lamaran'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
