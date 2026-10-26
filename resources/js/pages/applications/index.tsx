import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuickAddApplicationModal } from '@/components/dashboard/QuickAddApplicationModal';
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal';

interface Company {
    id: string;
    name: string;
}

interface ApplicationItem {
    id: string;
    job_title: string;
    company_name?: string;
    company?: Company;
    status: string;
    status_label: string;
    is_active: boolean;
    is_terminal: boolean;
    employment_type?: string;
    location?: string | null;
    source?: string | null;
    source_url?: string | null;
    applied_at?: string | null;
    follow_up_at?: string | null;
    updated_at: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}

interface ApplicationsPageProps {
    initialView?: 'list' | 'kanban';
}

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

export default function ApplicationsIndex({
    initialView = 'list',
}: ApplicationsPageProps) {
    // Check URL param or initialView
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const initialMode =
        urlParams?.get('view') === 'kanban' ? 'kanban' : initialView;

    const [viewMode, setViewMode] = useState<'list' | 'kanban'>(initialMode);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 20,
    });

    const [searchQuery, setSearchQuery] = useState(
        urlParams?.get('search') || '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        urlParams?.get('status') || 'all',
    );
    const [selectedSource, setSelectedSource] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(
        urlParams?.get('create') === 'true',
    );
    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(
        null,
    );

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('q', searchQuery.trim());
            if (selectedStatus !== 'all')
                params.append('status', selectedStatus);
            if (selectedSource !== 'all')
                params.append('source', selectedSource);
            params.append('page', String(currentPage));
            params.append('per_page', viewMode === 'kanban' ? '100' : '15');

            const res = await fetch(
                `/api/v1/applications?${params.toString()}`,
                {
                    headers,
                    credentials: 'same-origin',
                },
            );

            if (res.ok) {
                const json = await res.json();
                setApplications(json.data || []);
                if (json.meta) {
                    setMeta({
                        current_page: json.meta.current_page || 1,
                        last_page: json.meta.last_page || 1,
                        total: json.meta.total || 0,
                        per_page: json.meta.per_page || 15,
                    });
                }
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced search & filter
    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchApplications();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedStatus, selectedSource, currentPage, viewMode]);

    const handleDelete = async (id: string, jobTitle: string) => {
        if (
            !confirm(
                `Apakah Anda yakin ingin menghapus lamaran "${jobTitle}"? Seluruh pengingat terkait akan dibatalkan.`,
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            const res = await fetch(`/api/v1/applications/${id}`, {
                method: 'DELETE',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                void fetchApplications();
            }
        } catch {
            alert('Gagal menghapus lamaran.');
        }
    };

    // Kanban columns definition
    const kanbanColumns = [
        {
            key: 'saved',
            title: 'Tersimpan',
            statuses: ['saved'],
            color: '#7c7c7c',
        },
        {
            key: 'applied',
            title: 'Dilamar',
            statuses: ['applied'],
            color: '#6798ff',
        },
        {
            key: 'in_progress',
            title: 'Tahap Seleksi',
            statuses: ['screening', 'assessment', 'interview'],
            color: '#f59e0b',
        },
        {
            key: 'offer',
            title: 'Tawaran (Offer)',
            statuses: ['offer'],
            color: '#34d399',
        },
        {
            key: 'closed',
            title: 'Selesai / Ditolak',
            statuses: ['rejected', 'withdrawn'],
            color: '#f87171',
        },
    ];

    return (
        <AppLayout
            action={
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsCreateOpen(true)}
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
                    <span>Tambah Lamaran</span>
                </Button>
            }
        >
            <Head title="Manajemen Lamaran & Kanban - CareerPilot AI" />

            <div className="space-y-5">
                {/* Header & Controls Toolbar */}
                <div className="flex flex-col gap-4 rounded-[8px] border border-[#313131] bg-[#141414] p-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* View Switcher Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex min-h-[34px] items-center gap-1.5 rounded-[4px] px-3 text-[12px] font-medium transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-[#1e1e1e] text-[#ffffff]'
                                        : 'text-[#7c7c7c] hover:text-[#ffffff]'
                                }`}
                            >
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                                <span>Daftar Tabel</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('kanban')}
                                className={`flex min-h-[34px] items-center gap-1.5 rounded-[4px] px-3 text-[12px] font-medium transition-colors ${
                                    viewMode === 'kanban'
                                        ? 'bg-[#1e1e1e] text-[#ffffff]'
                                        : 'text-[#7c7c7c] hover:text-[#ffffff]'
                                }`}
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
                                        x="3"
                                        y="3"
                                        width="7"
                                        height="18"
                                        rx="1"
                                    />
                                    <rect
                                        x="14"
                                        y="3"
                                        width="7"
                                        height="18"
                                        rx="1"
                                    />
                                </svg>
                                <span>Kanban Board</span>
                            </button>
                        </div>
                        <span className="hidden font-mono text-[12px] text-[#7c7c7c] sm:inline">
                            {meta.total} Total Lamaran
                        </span>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative min-w-[200px] flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="Cari posisi atau perusahaan..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] py-1.5 pr-3 pl-8 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                            />
                            <svg
                                className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-[#7c7c7c]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                        </div>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-1.5 text-[12px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                        >
                            <option value="all">Semua Status</option>
                            <option value="applied">Dilamar (Applied)</option>
                            <option value="saved">Tersimpan (Saved)</option>
                            <option value="screening">Screening</option>
                            <option value="assessment">Assessment</option>
                            <option value="interview">Interview</option>
                            <option value="offer">Tawaran (Offer)</option>
                            <option value="rejected">Ditolak</option>
                            <option value="withdrawn">Ditarik</option>
                        </select>

                        {/* Source Filter */}
                        <select
                            value={selectedSource}
                            onChange={(e) => {
                                setSelectedSource(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-1.5 text-[12px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                        >
                            <option value="all">Semua Sumber</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="JobStreet">JobStreet</option>
                            <option value="Glints">Glints</option>
                            <option value="Website Perusahaan">
                                Website Perusahaan
                            </option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                </div>

                {/* VIEW 1: TABLE / LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="overflow-hidden rounded-[8px] border border-[#313131] bg-[#141414]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px]">
                                <thead className="border-b border-[#313131] bg-[#0a0a0a] font-mono text-[11px] text-[#7c7c7c] uppercase">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">
                                            Perusahaan & Lokasi
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Posisi
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Sumber
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Tanggal Dilamar
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Follow-Up
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 text-right"
                                        >
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e1e1e]">
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center text-[#7c7c7c]"
                                            >
                                                Memuat data lamaran...
                                            </td>
                                        </tr>
                                    ) : applications.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="py-12 text-center"
                                            >
                                                <p className="text-[14px] font-medium text-[#ffffff]">
                                                    Tidak ada lamaran ditemukan
                                                </p>
                                                <p className="mt-1 text-[12px] text-[#7c7c7c]">
                                                    Ubah kata kunci pencarian
                                                    atau tambah catatan lamaran
                                                    baru.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        applications.map((app) => {
                                            const isStagnant =
                                                (Date.now() -
                                                    new Date(
                                                        app.updated_at,
                                                    ).getTime()) /
                                                    (1000 * 60 * 60 * 24) >=
                                                14;

                                            return (
                                                <tr
                                                    key={app.id}
                                                    className="transition-colors hover:bg-[#1e1e1e]/60"
                                                >
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-[#ffffff]">
                                                                {app.company_name ||
                                                                    app.company
                                                                        ?.name ||
                                                                    'Perusahaan'}
                                                            </span>
                                                            {isStagnant && (
                                                                <span
                                                                    title="Lamaran belum ada pembaruan status >= 14 hari"
                                                                    className="py-0.2 rounded-[4px] border border-[#f59e0b]/40 bg-[#f59e0b]/15 px-1 font-mono text-[9px] text-[#f59e0b]"
                                                                >
                                                                    Stagnan
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="block text-[11px] text-[#7c7c7c]">
                                                            {app.location ||
                                                                'Lokasi tidak ditentukan'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-medium text-[#ffffff]">
                                                            {app.job_title}
                                                        </span>
                                                        <span className="block text-[11px] text-[#a7a7a7] capitalize">
                                                            {app.employment_type?.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <Badge
                                                            variant={
                                                                app.is_active
                                                                    ? 'accent'
                                                                    : 'default'
                                                            }
                                                            size="sm"
                                                        >
                                                            {STATUS_LABELS[
                                                                app.status
                                                            ] ||
                                                                app.status_label ||
                                                                app.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-mono text-[11px] text-[#a7a7a7]">
                                                            {app.source || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 font-mono text-[12px] text-[#a7a7a7]">
                                                        {app.applied_at || '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-mono text-[12px] text-[#6798ff]">
                                                        {app.follow_up_at
                                                            ? new Date(
                                                                  app.follow_up_at,
                                                              ).toLocaleDateString(
                                                                  'id-ID',
                                                                  {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                  },
                                                              )
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedDetailId(
                                                                        app.id,
                                                                    )
                                                                }
                                                                className="rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2.5 py-1 text-[11px] font-medium text-[#ffffff] transition-colors hover:border-[#6798ff]"
                                                            >
                                                                Detail & Status
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        app.id,
                                                                        app.job_title,
                                                                    )
                                                                }
                                                                aria-label="Hapus lamaran"
                                                                className="flex h-7 w-7 items-center justify-center rounded-[4px] text-[#7c7c7c] transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
                                                            >
                                                                <svg
                                                                    width="13"
                                                                    height="13"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {meta.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-[#313131] bg-[#0a0a0a] px-4 py-3">
                                <span className="font-mono text-[11px] text-[#7c7c7c]">
                                    Halaman {meta.current_page} dari{' '}
                                    {meta.last_page} ({meta.total} item)
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={meta.current_page <= 1}
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(p - 1, 1),
                                            )
                                        }
                                        className="rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2.5 py-1 text-[11px] text-[#ffffff] disabled:opacity-40"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            meta.current_page >= meta.last_page
                                        }
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(p + 1, meta.last_page),
                                            )
                                        }
                                        className="rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2.5 py-1 text-[11px] text-[#ffffff] disabled:opacity-40"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* VIEW 2: KANBAN BOARD VIEW */}
                {viewMode === 'kanban' && (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {kanbanColumns.map((col) => {
                            const columnApps = applications.filter((app) =>
                                col.statuses.includes(app.status),
                            );

                            return (
                                <div
                                    key={col.key}
                                    className="flex max-h-[75vh] w-80 shrink-0 flex-col rounded-[8px] border border-[#313131] bg-[#141414] p-3"
                                >
                                    {/* Column Header */}
                                    <div className="mb-3 flex items-center justify-between border-b border-[#313131] pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: col.color,
                                                }}
                                            />
                                            <h4 className="text-[13px] font-semibold text-[#ffffff]">
                                                {col.title}
                                            </h4>
                                        </div>
                                        <span className="py-0.2 rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-1.5 font-mono text-[11px] text-[#a7a7a7]">
                                            {columnApps.length}
                                        </span>
                                    </div>

                                    {/* Column Cards */}
                                    <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                                        {columnApps.length === 0 ? (
                                            <div className="rounded-[6px] border border-dashed border-[#313131] py-8 text-center text-[12px] text-[#7c7c7c]">
                                                Tidak ada lamaran
                                            </div>
                                        ) : (
                                            columnApps.map((app) => {
                                                const isStagnant =
                                                    (Date.now() -
                                                        new Date(
                                                            app.updated_at,
                                                        ).getTime()) /
                                                        (1000 * 60 * 60 * 24) >=
                                                    14;

                                                return (
                                                    <div
                                                        key={app.id}
                                                        onClick={() =>
                                                            setSelectedDetailId(
                                                                app.id,
                                                            )
                                                        }
                                                        className="group cursor-pointer rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3 transition-all hover:border-[#6798ff]"
                                                    >
                                                        <div className="flex items-start justify-between gap-1">
                                                            <h5 className="line-clamp-1 text-[13px] font-semibold text-[#ffffff] group-hover:text-[#6798ff]">
                                                                {app.job_title}
                                                            </h5>
                                                            {isStagnant && (
                                                                <span
                                                                    title="Lamaran stagnan >= 14 hari"
                                                                    className="py-0.2 shrink-0 rounded-[4px] bg-[#f59e0b]/20 px-1 font-mono text-[9px] text-[#f59e0b]"
                                                                >
                                                                    2w+
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="mt-0.5 line-clamp-1 text-[12px] text-[#a7a7a7]">
                                                            {app.company_name ||
                                                                app.company
                                                                    ?.name ||
                                                                'Perusahaan'}
                                                        </p>

                                                        <div className="mt-2.5 flex items-center justify-between border-t border-[#313131]/60 pt-2 font-mono text-[10px] text-[#7c7c7c]">
                                                            <span>
                                                                {app.source ||
                                                                    'Direct'}
                                                            </span>
                                                            {app.follow_up_at && (
                                                                <span className="text-[#6798ff]">
                                                                    FU:{' '}
                                                                    {new Date(
                                                                        app.follow_up_at,
                                                                    ).toLocaleDateString(
                                                                        'id-ID',
                                                                        {
                                                                            day: 'numeric',
                                                                            month: 'short',
                                                                        },
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Add Application Modal */}
            <QuickAddApplicationModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={() => fetchApplications()}
            />

            {/* Application Detail & Status Transition Modal */}
            <ApplicationDetailModal
                applicationId={selectedDetailId}
                isOpen={selectedDetailId !== null}
                onClose={() => setSelectedDetailId(null)}
                onUpdated={() => fetchApplications()}
            />
        </AppLayout>
    );
}
