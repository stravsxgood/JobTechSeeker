import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Company {
    id: string;
    name: string;
}

interface JobApplication {
    id: string;
    job_title: string;
    company_name?: string;
    company?: Company;
    status: string;
}

interface InterviewItem {
    id: string;
    job_application_id: string;
    job_title?: string;
    company_name?: string;
    company?: Company;
    interview_type: string;
    start_at: string;
    end_at: string;
    timezone: string;
    meeting_url?: string | null;
    location?: string | null;
    status: 'scheduled' | 'completed' | 'cancelled';
    status_label: string;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

const INTERVIEW_TYPE_PRESETS = [
    'HR Screening',
    'Technical Assessment',
    'Live Coding',
    'User Interview',
    'Culture Fit',
    'Final / Offering',
];

export default function InterviewsPage() {
    const [viewMode, setViewMode] = useState<'calendar' | 'agenda'>('calendar');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [interviews, setInterviews] = useState<InterviewItem[]>([]);
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] =
        useState<string>('all');
    const [selectedCalendarDate, setSelectedCalendarDate] =
        useState<Date>(new Date());

    const isSameDay = (d1: Date, d2: Date) => {
        return (
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate()
        );
    };

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedDetailInterview, setSelectedDetailInterview] =
        useState<InterviewItem | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Form state for creating an interview
    const [formAppId, setFormAppId] = useState('');
    const [formType, setFormType] = useState('HR Screening');
    const [formStartDate, setFormStartDate] = useState('');
    const [formStartTime, setFormStartTime] = useState('10:00');
    const [formDurationMinutes, setFormDurationMinutes] = useState(60);
    const [formMode, setFormMode] = useState<'online' | 'offline'>('online');
    const [formMeetingUrl, setFormMeetingUrl] = useState('');
    const [formLocation, setFormLocation] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [_conflictWarning, setConflictWarning] = useState<boolean>(false);

    // Reschedule form state
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('10:00');
    const [rescheduleDuration, setRescheduleDuration] = useState(60);
    const [rescheduleNotes, setRescheduleNotes] = useState('');
    const [rescheduleError, setRescheduleError] = useState<string | null>(null);
    const [isRescheduleSubmitting, setIsRescheduleSubmitting] = useState(false);

    // Fetch applications on mount for the create dropdown
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('careerpilot_token');
                const headers: Record<string, string> = {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                };
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await fetch('/api/v1/applications?per_page=100', {
                    headers,
                    credentials: 'same-origin',
                });
                if (res.ok) {
                    const json = await res.json();
                    setApplications(json.data || []);
                }
            } catch {
                // Silently ignore
            }
        };

        void fetchApplications();
    }, []);

    // Fetch interviews whenever currentDate or selectedStatusFilter changes
    const fetchInterviews = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            // Calculate start and end date for current month view with a buffer
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month - 1, 20).toISOString();
            const endOfMonth = new Date(year, month + 2, 10).toISOString();

            const params = new URLSearchParams();
            params.append('start_date', startOfMonth);
            params.append('end_date', endOfMonth);
            if (selectedStatusFilter !== 'all') {
                params.append('status', selectedStatusFilter);
            }
            params.append('per_page', '100');

            const res = await fetch(`/api/v1/interviews?${params.toString()}`, {
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                const json = await res.json();
                setInterviews(json.data || []);
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchInterviews();
    }, [currentDate, selectedStatusFilter]);

    // Handle Month Navigation
    const handlePrevMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
        );
    };

    const handleNextMonth = () => {
        setCurrentDate(
            new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
        );
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Calculate days for the calendar grid
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Day of week index (Monday = 0, Sunday = 6)
        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        const days = [];

        // Previous month filler days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const dateObj = new Date(year, month - 1, dayNum);
            days.push({
                date: dateObj,
                isCurrentMonth: false,
                isToday: false,
                dayNumber: dayNum,
            });
        }

        // Current month days
        const today = new Date();
        const totalDays = lastDayOfMonth.getDate();
        for (let day = 1; day <= totalDays; day++) {
            const dateObj = new Date(year, month, day);
            const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

            days.push({
                date: dateObj,
                isCurrentMonth: true,
                isToday,
                dayNumber: day,
            });
        }

        // Next month filler days to complete 35 or 42 cells
        const remainingCells = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
            const dateObj = new Date(year, month + 1, i);
            days.push({
                date: dateObj,
                isCurrentMonth: false,
                isToday: false,
                dayNumber: i,
            });
        }

        return days;
    }, [currentDate]);

    // Helper: Find interviews for a given day
    const getInterviewsForDate = (date: Date) => {
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();

        return interviews.filter((item) => {
            const itemDate = new Date(item.start_at);
            return (
                itemDate.getFullYear() === y &&
                itemDate.getMonth() === m &&
                itemDate.getDate() === d
            );
        });
    };

    // Helper: Detect schedule conflicts for an interview
    const hasConflictWithOtherInterviews = (item: InterviewItem) => {
        if (item.status !== 'scheduled') return false;

        const startA = new Date(item.start_at).getTime();
        const endA = new Date(item.end_at).getTime();

        return interviews.some((other) => {
            if (other.id === item.id || other.status !== 'scheduled')
                return false;
            const startB = new Date(other.start_at).getTime();
            const endB = new Date(other.end_at).getTime();

            return (
                (startA >= startB && startA < endB) ||
                (endA > startB && endA <= endB) ||
                (startA <= startB && endA >= endB)
            );
        });
    };

    // Open create modal with pre-selected date
    const handleOpenCreateForDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        setFormStartDate(`${year}-${month}-${day}`);
        setFormStartTime('10:00');
        setFormError(null);
        setConflictWarning(false);
        setIsCreateOpen(true);
    };

    // Handle Create Submit
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formAppId) {
            setFormError('Silakan pilih lamaran kerja.');
            return;
        }

        if (!formStartDate || !formStartTime) {
            setFormError('Tanggal dan jam mulai interview wajib ditentukan.');
            return;
        }

        setIsSubmitting(true);

        const startDateTime = new Date(`${formStartDate}T${formStartTime}:00`);
        const endDateTime = new Date(
            startDateTime.getTime() + formDurationMinutes * 60 * 1000,
        );

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

            const response = await fetch('/api/v1/interviews', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({
                    job_application_id: formAppId,
                    interview_type: formType,
                    start_at: startDateTime.toISOString(),
                    end_at: endDateTime.toISOString(),
                    meeting_url:
                        formMode === 'online' ? formMeetingUrl || null : null,
                    location:
                        formMode === 'offline' ? formLocation || null : null,
                    notes: formNotes.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setFormError(
                    data.message || 'Gagal menyimpan jadwal interview.',
                );
                setIsSubmitting(false);
                return;
            }

            if (data.has_conflict) {
                setConflictWarning(true);
            }

            // Success: Close and refresh
            setIsCreateOpen(false);
            setFormAppId('');
            setFormMeetingUrl('');
            setFormLocation('');
            setFormNotes('');
            void fetchInterviews();
        } catch {
            setFormError('Terjadi kesalahan jaringan saat menyimpan jadwal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Status Change (Completed, Cancelled)
    const handleUpdateStatus = async (
        interviewId: string,
        newStatus: 'completed' | 'cancelled',
    ) => {
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

            const res = await fetch(`/api/v1/interviews/${interviewId}`, {
                method: 'PATCH',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify({ status: newStatus }),
            });

            if (res.ok) {
                void fetchInterviews();
                if (selectedDetailInterview?.id === interviewId) {
                    setSelectedDetailInterview((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  status: newStatus,
                                  status_label:
                                      newStatus === 'completed'
                                          ? 'Selesai'
                                          : 'Dibatalkan',
                              }
                            : null,
                    );
                }
            }
        } catch {
            // Silently ignore
        }
    };

    // Handle Reschedule Submit
    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDetailInterview) return;
        setRescheduleError(null);

        if (!rescheduleDate || !rescheduleTime) {
            setRescheduleError('Tanggal dan waktu baru wajib ditentukan.');
            return;
        }

        setIsRescheduleSubmitting(true);

        const startDateTime = new Date(
            `${rescheduleDate}T${rescheduleTime}:00`,
        );
        const endDateTime = new Date(
            startDateTime.getTime() + rescheduleDuration * 60 * 1000,
        );

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

            const res = await fetch(
                `/api/v1/interviews/${selectedDetailInterview.id}`,
                {
                    method: 'PATCH',
                    headers,
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        start_at: startDateTime.toISOString(),
                        end_at: endDateTime.toISOString(),
                        status: 'scheduled',
                        notes: rescheduleNotes.trim()
                            ? `${selectedDetailInterview.notes || ''}\n[Reschedule]: ${rescheduleNotes.trim()}`.trim()
                            : selectedDetailInterview.notes,
                    }),
                },
            );

            const data = await res.json();

            if (!res.ok) {
                setRescheduleError(
                    data.message || 'Gagal mengubah jadwal interview.',
                );
                setIsRescheduleSubmitting(false);
                return;
            }

            setIsRescheduling(false);
            setSelectedDetailInterview(data.data);
            void fetchInterviews();
        } catch {
            setRescheduleError('Terjadi gangguan jaringan saat reschedule.');
        } finally {
            setIsRescheduleSubmitting(false);
        }
    };

    // Handle Delete Interview
    const handleDeleteInterview = async (interviewId: string) => {
        if (
            !confirm(
                'Apakah Anda yakin ingin menghapus jadwal interview ini dari kalender?',
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

            const res = await fetch(`/api/v1/interviews/${interviewId}`, {
                method: 'DELETE',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                setSelectedDetailInterview(null);
                void fetchInterviews();
            }
        } catch {
            // Silently ignore
        }
    };

    const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];

    const formatTimeOnly = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDateFull = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Sort agenda interviews chronologically
    const sortedAgendaInterviews = useMemo(() => {
        return [...interviews].sort(
            (a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        );
    }, [interviews]);

    return (
        <AppLayout
            title="Kalender Wawancara"
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        onClick={() => {
                            const now = new Date();
                            const y = now.getFullYear();
                            const m = String(now.getMonth() + 1).padStart(
                                2,
                                '0',
                            );
                            const d = String(now.getDate()).padStart(2, '0');
                            setFormStartDate(`${y}-${m}-${d}`);
                            setFormStartTime('10:00');
                            setFormError(null);
                            setConflictWarning(false);
                            setIsCreateOpen(true);
                        }}
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span className="hidden sm:inline">Jadwalkan Wawancara</span>
                        <span className="sm:hidden">Jadwalkan</span>
                    </Button>
                </div>
            }
        >
            <Head title="Kalender Wawancara - CareerPilot AI" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    AGENDA & INTERVIEW TRACKER
                                </span>
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]">
                                    TIMEZONE AWARE
                                </span>
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                                Kalender Wawancara Kerja
                            </h2>
                            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                Pantau seluruh jadwal wawancara, link meeting
                                online (Google Meet, Zoom), venue interview
                                fisik, deteksi jadwal bertabrakan (conflict
                                detection), dan integrasi langsung ke AI
                                Interview Copilot.
                            </p>
                        </div>

                        {/* View Switcher & Filter */}
                        <div className="flex shrink-0 items-center gap-2">
                            {/* Status Filter */}
                            <select
                                value={selectedStatusFilter}
                                onChange={(e) =>
                                    setSelectedStatusFilter(e.target.value)
                                }
                                className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[12px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            >
                                <option value="all">Semua Status</option>
                                <option value="scheduled">Terjadwal</option>
                                <option value="completed">Selesai</option>
                                <option value="cancelled">Dibatalkan</option>
                            </select>

                            {/* View Toggle */}
                            <div className="flex rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                        viewMode === 'calendar'
                                            ? 'border border-[#454545] bg-[#1e1e1e] text-[#ffffff]'
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
                                            y="4"
                                            width="18"
                                            height="18"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="16"
                                            y1="2"
                                            x2="16"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="2"
                                            x2="8"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="10"
                                            x2="21"
                                            y2="10"
                                        ></line>
                                    </svg>
                                    <span>Bulan</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('agenda')}
                                    className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-[12px] font-medium transition-colors ${
                                        viewMode === 'agenda'
                                            ? 'border border-[#454545] bg-[#1e1e1e] text-[#ffffff]'
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
                                        <line
                                            x1="8"
                                            y1="6"
                                            x2="21"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="12"
                                            x2="21"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="8"
                                            y1="18"
                                            x2="21"
                                            y2="18"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="6"
                                            x2="3.01"
                                            y2="6"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="12"
                                            x2="3.01"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="3"
                                            y1="18"
                                            x2="3.01"
                                            y2="18"
                                        ></line>
                                    </svg>
                                    <span>Agenda</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Navigation Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[18px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                            {monthNames[currentDate.getMonth()]}{' '}
                            {currentDate.getFullYear()}
                        </h3>
                        <span className="font-mono text-[11px] text-[#7c7c7c]">
                            {interviews.length} sesi terdaftar
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleToday}
                            className="flex min-h-[36px] items-center rounded-[6px] border border-[#313131] bg-[#141414] px-3 text-[12px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff]"
                        >
                            Hari Ini
                        </button>
                        <div className="flex items-center rounded-[6px] border border-[#313131] bg-[#141414]">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                aria-label="Bulan sebelumnya"
                                className="flex h-9 w-9 items-center justify-center text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                aria-label="Bulan berikutnya"
                                className="flex h-9 w-9 items-center justify-center border-l border-[#313131] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conflict Alert Banner if any conflicts exist in scheduled interviews */}
                {interviews.some(hasConflictWithOtherInterviews) && (
                    <div className="rounded-[8px] border border-[#fbbf24]/40 bg-[#fbbf24]/10 p-4">
                        <div className="flex items-start gap-3">
                            <svg
                                className="mt-0.5 h-5 w-5 shrink-0 text-[#fbbf24]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <div>
                                <h4 className="text-[13px] font-semibold text-[#fbbf24]">
                                    Peringatan Konflik Waktu (Overlapping
                                    Schedules)
                                </h4>
                                <p className="mt-0.5 text-[12px] leading-relaxed text-[#ffffff]">
                                    Terdapat jadwal wawancara yang bertabrakan
                                    pada rentang jam yang sama. Silakan tinjau
                                    dan lakukan *Reschedule* agar sesi tidak
                                    bentrok.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MONTHLY CALENDAR GRID VIEW */}
                {viewMode === 'calendar' && (
                    <div className="space-y-4">
                        {/* Mobile Calendar Grid (Compact + Day Agenda View) */}
                        <div className="md:hidden space-y-4">
                            <div className="overflow-hidden rounded-[8px] border border-[#313131] bg-[#141414]">
                                <div className="grid grid-cols-7 border-b border-[#313131] bg-[#1e1e1e] text-center font-mono text-[10px] font-semibold text-[#a7a7a7]">
                                    <div className="py-2">SEN</div>
                                    <div className="py-2">SEL</div>
                                    <div className="py-2">RAB</div>
                                    <div className="py-2">KAM</div>
                                    <div className="py-2">JUM</div>
                                    <div className="py-2 text-[#6798ff]">SAB</div>
                                    <div className="py-2 text-[#f87171]">MIN</div>
                                </div>

                                <div className="grid auto-rows-fr grid-cols-7 divide-x divide-y divide-[#313131]">
                                    {calendarDays.map((cell, idx) => {
                                        const dayInterviews = getInterviewsForDate(cell.date);
                                        const isSelected = isSameDay(cell.date, selectedCalendarDate);
                                        const hasConflict = dayInterviews.some(hasConflictWithOtherInterviews);

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => setSelectedCalendarDate(cell.date)}
                                                className={`relative flex min-h-[56px] flex-col items-center justify-between p-1.5 transition-colors text-left ${
                                                    isSelected
                                                        ? 'bg-[#1e1e1e] ring-2 ring-inset ring-[#6798ff]'
                                                        : cell.isCurrentMonth
                                                          ? 'bg-[#141414] active:bg-[#1e1e1e]'
                                                          : 'bg-[#0e0e0e] text-[#555555]'
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] ${
                                                        cell.isToday
                                                            ? 'bg-[#6798ff] font-semibold text-[#0a0a0a]'
                                                            : isSelected
                                                              ? 'font-bold text-[#6798ff]'
                                                              : cell.isCurrentMonth
                                                                ? 'text-[#ffffff]'
                                                                : 'text-[#555555]'
                                                    }`}
                                                >
                                                    {cell.dayNumber}
                                                </span>

                                                {/* Mini dots indicator */}
                                                <div className="mt-1 flex min-h-[6px] items-center justify-center gap-1">
                                                    {dayInterviews.slice(0, 3).map((item, dotIdx) => (
                                                        <span
                                                            key={dotIdx}
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                hasConflict
                                                                    ? 'bg-[#fbbf24]'
                                                                    : item.status === 'completed'
                                                                      ? 'bg-[#34d399]'
                                                                      : 'bg-[#6798ff]'
                                                            }`}
                                                        />
                                                    ))}
                                                    {dayInterviews.length > 3 && (
                                                        <span className="font-mono text-[8px] text-[#6798ff]">
                                                            +{dayInterviews.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Mobile Selected Date Agenda Box */}
                            <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-4">
                                <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                                    <div>
                                        <span className="font-mono text-[10px] tracking-wider text-[#6798ff] uppercase">
                                            AGENDA HARIAN
                                        </span>
                                        <h4 className="text-[14px] font-semibold text-[#ffffff]">
                                            {formatDateFull(selectedCalendarDate.toISOString())}
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleOpenCreateForDate(selectedCalendarDate)}
                                        className="flex min-h-[36px] items-center gap-1 rounded-[6px] border border-[#6798ff] bg-[#6798ff]/10 px-2.5 text-[11px] font-medium text-[#6798ff] active:bg-[#6798ff]/20"
                                    >
                                        + Tambah
                                    </button>
                                </div>

                                <div className="mt-3 space-y-2.5">
                                    {getInterviewsForDate(selectedCalendarDate).length > 0 ? (
                                        getInterviewsForDate(selectedCalendarDate).map((item) => {
                                            const isConflict = hasConflictWithOtherInterviews(item);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`rounded-[6px] border p-3 ${
                                                        isConflict
                                                            ? 'border-[#fbbf24] bg-[#1e1e1e]'
                                                            : 'border-[#313131] bg-[#1e1e1e]'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Badge
                                                            variant={
                                                                item.status === 'completed'
                                                                    ? 'success'
                                                                    : item.status === 'cancelled'
                                                                      ? 'danger'
                                                                      : 'accent'
                                                            }
                                                            size="sm"
                                                        >
                                                            {item.status_label}
                                                        </Badge>
                                                        <span className="font-mono text-[11px] text-[#6798ff]">
                                                            {formatTimeOnly(item.start_at)} - {formatTimeOnly(item.end_at)}
                                                        </span>
                                                    </div>

                                                    <h5 className="mt-2 text-[14px] font-semibold text-[#ffffff]">
                                                        {item.job_title || item.interview_type}
                                                    </h5>
                                                    <p className="text-[12px] text-[#a7a7a7]">
                                                        {item.company_name || 'Perusahaan'}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[#313131]">
                                                        {item.meeting_url && (
                                                            <a
                                                                href={item.meeting_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[4px] border border-[#34d399]/40 bg-[#34d399]/10 px-2.5 text-[11px] font-medium text-[#34d399]"
                                                            >
                                                                Buka Meeting
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedDetailInterview(item)}
                                                            className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-[4px] border border-[#313131] bg-[#0a0a0a] px-2.5 text-[11px] font-medium text-[#ffffff]"
                                                        >
                                                            Kelola & Detail
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-6 text-center text-[12px] text-[#7c7c7c]">
                                            Tidak ada jadwal wawancara pada tanggal ini.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tablet & Desktop Calendar Grid */}
                        <div className="hidden md:block overflow-hidden rounded-[8px] border border-[#313131] bg-[#141414]">
                            {/* Days of week header */}
                            <div className="grid grid-cols-7 border-b border-[#313131] bg-[#1e1e1e] text-center font-mono text-[11px] font-semibold text-[#a7a7a7]">
                                <div className="py-2.5">SEN</div>
                                <div className="py-2.5">SEL</div>
                                <div className="py-2.5">RAB</div>
                                <div className="py-2.5">KAM</div>
                                <div className="py-2.5">JUM</div>
                                <div className="py-2.5 text-[#6798ff]">SAB</div>
                                <div className="py-2.5 text-[#f87171]">MIN</div>
                            </div>

                            {/* Calendar Day Cells */}
                            <div className="grid auto-rows-fr grid-cols-7 divide-x divide-y divide-[#313131]">
                                {calendarDays.map((cell, idx) => {
                                    const dayInterviews = getInterviewsForDate(
                                        cell.date,
                                    );

                                    return (
                                        <div
                                            key={idx}
                                            className={`group relative min-h-[105px] p-2 transition-colors sm:min-h-[120px] ${
                                                cell.isCurrentMonth
                                                    ? 'bg-[#141414] hover:bg-[#1a1a1a]'
                                                    : 'bg-[#0e0e0e] text-[#555555]'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[12px] font-medium ${
                                                        cell.isToday
                                                            ? 'bg-[#6798ff] font-semibold text-[#0a0a0a]'
                                                            : cell.isCurrentMonth
                                                              ? 'text-[#ffffff]'
                                                              : 'text-[#555555]'
                                                    }`}
                                                >
                                                    {cell.dayNumber}
                                                </span>

                                                {/* Quick Add icon on cell hover */}
                                                {cell.isCurrentMonth && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleOpenCreateForDate(
                                                                cell.date,
                                                            )
                                                        }
                                                        title="Tambah wawancara pada tanggal ini"
                                                        className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#1e1e1e] text-[#a7a7a7] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#6798ff] hover:text-[#0a0a0a]"
                                                    >
                                                        <svg
                                                            width="12"
                                                            height="12"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                        >
                                                            <line
                                                                x1="12"
                                                                y1="5"
                                                                x2="12"
                                                                y2="19"
                                                            ></line>
                                                            <line
                                                                x1="5"
                                                                y1="12"
                                                                x2="19"
                                                                y2="12"
                                                            ></line>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            {/* Interview Badges inside cell */}
                                            <div className="mt-1.5 space-y-1">
                                                {dayInterviews.map((item) => {
                                                    const isConflict =
                                                        hasConflictWithOtherInterviews(
                                                            item,
                                                        );

                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedDetailInterview(
                                                                    item,
                                                                )
                                                            }
                                                            className={`flex w-full items-center justify-between gap-1 truncate rounded-[4px] px-1.5 py-1 text-left text-[11px] transition-all ${
                                                                item.status ===
                                                                'completed'
                                                                    ? 'border border-[#1e3a2f] bg-[#141414] text-[#34d399]'
                                                                    : item.status ===
                                                                        'cancelled'
                                                                      ? 'border border-[#3b1c1c] bg-[#141414] text-[#7c7c7c] line-through'
                                                                      : isConflict
                                                                        ? 'border border-[#fbbf24] bg-[#3d2f14] text-[#fbbf24]'
                                                                        : 'border border-[#313131] bg-[#1e1e1e] text-[#ffffff] hover:border-[#6798ff]'
                                                            }`}
                                                        >
                                                            <span className="truncate">
                                                                <strong className="font-mono">
                                                                    {formatTimeOnly(
                                                                        item.start_at,
                                                                    )}
                                                                </strong>{' '}
                                                                {item.job_title ||
                                                                    item.interview_type}
                                                            </span>
                                                            {isConflict && (
                                                                <span
                                                                    title="Konflik jadwal!"
                                                                    className="shrink-0 font-bold text-[#fbbf24]"
                                                                >
                                                                    !
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* AGENDA / LIST VIEW */}
                {viewMode === 'agenda' && (
                    <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                        <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                            <h4 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                Daftar Agenda Wawancara
                            </h4>
                            <span className="font-mono text-[12px] text-[#7c7c7c]">
                                Terurut kronologis
                            </span>
                        </div>

                        {sortedAgendaInterviews.length > 0 ? (
                            <div className="space-y-3">
                                {sortedAgendaInterviews.map((item) => {
                                    const isConflict =
                                        hasConflictWithOtherInterviews(item);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`rounded-[8px] border p-4 transition-colors sm:p-5 ${
                                                isConflict
                                                    ? 'border-[#fbbf24] bg-[#1e1e1e]'
                                                    : 'border-[#313131] bg-[#1e1e1e] hover:border-[#454545]'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-1.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                item.status ===
                                                                'completed'
                                                                    ? 'success'
                                                                    : item.status ===
                                                                        'cancelled'
                                                                      ? 'danger'
                                                                      : 'accent'
                                                            }
                                                            size="sm"
                                                        >
                                                            {item.status_label}
                                                        </Badge>
                                                        <span className="rounded-[4px] border border-[#313131] bg-[#0a0a0a] px-2 py-0.5 font-mono text-[11px] text-[#a7a7a7]">
                                                            {
                                                                item.interview_type
                                                            }
                                                        </span>
                                                        {isConflict && (
                                                            <span className="rounded-[4px] border border-[#fbbf24] bg-[#fbbf24]/10 px-2 py-0.5 font-mono text-[10px] text-[#fbbf24]">
                                                                ⚠️ Konflik Waktu
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h4 className="text-[16px] font-semibold text-[#ffffff]">
                                                        {item.job_title ||
                                                            'Posisi Pekerjaan'}
                                                    </h4>
                                                    <p className="text-[13px] text-[#a7a7a7]">
                                                        Perusahaan:{' '}
                                                        <span className="font-medium text-[#ffffff]">
                                                            {item.company_name ||
                                                                'Perusahaan'}
                                                        </span>
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[12px] text-[#a7a7a7]">
                                                        <div className="flex items-center gap-1.5">
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
                                                                    y="4"
                                                                    width="18"
                                                                    height="18"
                                                                    rx="2"
                                                                    ry="2"
                                                                ></rect>
                                                                <line
                                                                    x1="16"
                                                                    y1="2"
                                                                    x2="16"
                                                                    y2="6"
                                                                ></line>
                                                                <line
                                                                    x1="8"
                                                                    y1="2"
                                                                    x2="8"
                                                                    y2="6"
                                                                ></line>
                                                                <line
                                                                    x1="3"
                                                                    y1="10"
                                                                    x2="21"
                                                                    y2="10"
                                                                ></line>
                                                            </svg>
                                                            <span>
                                                                {formatDateFull(
                                                                    item.start_at,
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 font-mono text-[#6798ff]">
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                ></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            <span>
                                                                {formatTimeOnly(
                                                                    item.start_at,
                                                                )}{' '}
                                                                -{' '}
                                                                {formatTimeOnly(
                                                                    item.end_at,
                                                                )}{' '}
                                                                {item.timezone}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Location / Meeting link */}
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        {item.meeting_url && (
                                                            <a
                                                                href={
                                                                    item.meeting_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#34d399]/40 bg-[#34d399]/10 px-2.5 py-1 text-[12px] font-medium text-[#34d399] transition-colors hover:bg-[#34d399]/20"
                                                            >
                                                                <svg
                                                                    width="13"
                                                                    height="13"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M15 10l5-5v14l-5-5" />
                                                                    <rect
                                                                        x="2"
                                                                        y="6"
                                                                        width="13"
                                                                        height="12"
                                                                        rx="2"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    Buka Link
                                                                    Meeting
                                                                </span>
                                                            </a>
                                                        )}
                                                        {item.location && (
                                                            <a
                                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#313131] bg-[#0a0a0a] px-2.5 py-1 text-[12px] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                                                            >
                                                                <svg
                                                                    width="13"
                                                                    height="13"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                >
                                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                                    <circle
                                                                        cx="12"
                                                                        cy="10"
                                                                        r="3"
                                                                    />
                                                                </svg>
                                                                <span>
                                                                    {
                                                                        item.location
                                                                    }{' '}
                                                                    (Maps)
                                                                </span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex w-full flex-wrap items-center gap-2 pt-3 sm:w-auto sm:shrink-0 sm:flex-col sm:items-end sm:pt-0">
                                                    <Link
                                                        href={`/ai/interview-copilot?application_id=${item.job_application_id}&job_title=${encodeURIComponent(
                                                            item.job_title ||
                                                                '',
                                                        )}&company=${encodeURIComponent(item.company_name || '')}`}
                                                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[#6798ff] bg-[#6798ff]/10 px-3 text-[12px] font-medium text-[#6798ff] transition-colors hover:bg-[#6798ff]/20 sm:flex-none sm:min-h-[36px]"
                                                    >
                                                        <svg
                                                            width="13"
                                                            height="13"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                            ></circle>
                                                            <polyline points="12 6 12 12 16 14"></polyline>
                                                        </svg>
                                                        <span>
                                                            Latihan Copilot
                                                        </span>
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedDetailInterview(
                                                                item,
                                                            )
                                                        }
                                                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 text-[12px] font-medium text-[#a7a7a7] transition-colors hover:text-[#ffffff] sm:flex-none sm:min-h-[36px]"
                                                    >
                                                        Kelola & Detail
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-2 py-12 text-center text-[#7c7c7c]">
                                <p className="text-[14px]">
                                    Belum ada jadwal wawancara untuk periode
                                    ini.
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        handleOpenCreateForDate(new Date())
                                    }
                                >
                                    Tambah Jadwal Sekarang
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL 1: JADWALKAN WAWANCARA BARU */}
            {isCreateOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[8px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-[#313131] pb-3">
                            <div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    JADWAL BARU
                                </span>
                                <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-[#ffffff]">
                                    Jadwalkan Wawancara Kerja
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                aria-label="Tutup form"
                                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#f87171]">
                                {formError}
                            </div>
                        )}

                        <form
                            onSubmit={handleCreateSubmit}
                            className="space-y-4"
                        >
                            {/* Lamaran Referensi */}
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Lamaran Kerja{' '}
                                    <span className="text-[#f87171]">*</span>
                                </label>
                                <select
                                    required
                                    value={formAppId}
                                    onChange={(e) =>
                                        setFormAppId(e.target.value)
                                    }
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                >
                                    <option value="">
                                        -- Pilih Lamaran Kerja --
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

                            {/* Tipe Interview */}
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Tahapan / Tipe Wawancara{' '}
                                    <span className="text-[#f87171]">*</span>
                                </label>
                                <div className="mb-2 flex flex-wrap gap-1.5">
                                    {INTERVIEW_TYPE_PRESETS.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setFormType(preset)}
                                            className={`rounded-[4px] px-2 py-0.5 font-mono text-[11px] transition-colors ${
                                                formType === preset
                                                    ? 'bg-[#6798ff] font-semibold text-[#0a0a0a]'
                                                    : 'bg-[#1e1e1e] text-[#a7a7a7] hover:text-[#ffffff]'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: HR Screening, Technical Round"
                                    value={formType}
                                    onChange={(e) =>
                                        setFormType(e.target.value)
                                    }
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>

                            {/* Waktu & Tanggal */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="space-y-1.5 sm:col-span-1">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Tanggal{' '}
                                        <span className="text-[#f87171]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formStartDate}
                                        onChange={(e) =>
                                            setFormStartDate(e.target.value)
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-1">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Jam Mulai{' '}
                                        <span className="text-[#f87171]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        value={formStartTime}
                                        onChange={(e) =>
                                            setFormStartTime(e.target.value)
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5 sm:col-span-1">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Durasi Sesi
                                    </label>
                                    <select
                                        value={formDurationMinutes}
                                        onChange={(e) =>
                                            setFormDurationMinutes(
                                                Number(e.target.value),
                                            )
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                    >
                                        <option value={30}>30 Menit</option>
                                        <option value={45}>45 Menit</option>
                                        <option value={60}>
                                            60 Menit (1 Jam)
                                        </option>
                                        <option value={90}>
                                            90 Menit (1.5 Jam)
                                        </option>
                                        <option value={120}>
                                            120 Menit (2 Jam)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Mode Interview: Online vs Offline */}
                            <div className="space-y-2">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Mode Wawancara
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormMode('online')}
                                        className={`flex items-center justify-center gap-2 rounded-[6px] py-2 text-[13px] font-medium transition-all ${
                                            formMode === 'online'
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c]'
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
                                            <path d="M15 10l5-5v14l-5-5" />
                                            <rect
                                                x="2"
                                                y="6"
                                                width="13"
                                                height="12"
                                                rx="2"
                                            />
                                        </svg>
                                        <span>Online (Meet / Zoom)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormMode('offline')}
                                        className={`flex items-center justify-center gap-2 rounded-[6px] py-2 text-[13px] font-medium transition-all ${
                                            formMode === 'offline'
                                                ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'border border-[#313131] bg-[#0a0a0a] text-[#7c7c7c]'
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
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <span>Offline / Tatap Muka</span>
                                    </button>
                                </div>
                            </div>

                            {formMode === 'online' ? (
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Tautan Rapat (Meeting URL)
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/... atau tautan Zoom / Teams"
                                        value={formMeetingUrl}
                                        onChange={(e) =>
                                            setFormMeetingUrl(e.target.value)
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Alamat Lokasi / Kantor
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Gedung Bursa Efek Indonesia Tower 2 Lt. 14, SCBD Jakarta"
                                        value={formLocation}
                                        onChange={(e) =>
                                            setFormLocation(e.target.value)
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Catatan Sesi */}
                            <div className="space-y-1.5">
                                <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                    Catatan / Pewawancara (Opsional)
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: Pewawancara Pak Budi (VP Engineering). Siapkan laptop dan portofolio React."
                                    value={formNotes}
                                    onChange={(e) =>
                                        setFormNotes(e.target.value)
                                    }
                                    className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] placeholder-[#7c7c7c] focus:border-[#6798ff] focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 border-t border-[#313131] pt-3">
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    isLoading={isSubmitting}
                                >
                                    Simpan Jadwal Wawancara
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DETAIL, RESCHEDULE & MANAGE INTERVIEW */}
            {selectedDetailInterview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[8px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl">
                        <div className="mb-4 flex items-start justify-between border-b border-[#313131] pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={
                                            selectedDetailInterview.status ===
                                            'completed'
                                                ? 'success'
                                                : selectedDetailInterview.status ===
                                                    'cancelled'
                                                  ? 'danger'
                                                  : 'accent'
                                        }
                                        size="sm"
                                    >
                                        {selectedDetailInterview.status_label}
                                    </Badge>
                                    <span className="font-mono text-[11px] text-[#a7a7a7]">
                                        {selectedDetailInterview.interview_type}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-[18px] font-semibold tracking-[-0.3px] text-[#ffffff]">
                                    {selectedDetailInterview.job_title}
                                </h3>
                                <p className="text-[13px] text-[#a7a7a7]">
                                    {selectedDetailInterview.company_name}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedDetailInterview(null);
                                    setIsRescheduling(false);
                                }}
                                aria-label="Tutup detail modal"
                                className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {!isRescheduling ? (
                            <div className="space-y-4">
                                {/* Waktu Info */}
                                <div className="space-y-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3.5">
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-[#a7a7a7]">
                                            Hari & Tanggal:
                                        </span>
                                        <span className="font-medium text-[#ffffff]">
                                            {formatDateFull(
                                                selectedDetailInterview.start_at,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px]">
                                        <span className="text-[#a7a7a7]">
                                            Waktu Sesi:
                                        </span>
                                        <span className="font-mono font-medium text-[#6798ff]">
                                            {formatTimeOnly(
                                                selectedDetailInterview.start_at,
                                            )}{' '}
                                            -{' '}
                                            {formatTimeOnly(
                                                selectedDetailInterview.end_at,
                                            )}{' '}
                                            {selectedDetailInterview.timezone}
                                        </span>
                                    </div>
                                </div>

                                {/* Link / Location */}
                                {selectedDetailInterview.meeting_url && (
                                    <div className="space-y-1">
                                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#34d399] uppercase">
                                            MEETING ONLINE
                                        </span>
                                        <div>
                                            <a
                                                href={
                                                    selectedDetailInterview.meeting_url
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#34d399]/40 bg-[#34d399]/10 px-3.5 py-2 text-[13px] font-medium text-[#34d399] transition-colors hover:bg-[#34d399]/20"
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M15 10l5-5v14l-5-5" />
                                                    <rect
                                                        x="2"
                                                        y="6"
                                                        width="13"
                                                        height="12"
                                                        rx="2"
                                                    />
                                                </svg>
                                                <span>
                                                    Buka Tautan Google Meet /
                                                    Zoom
                                                </span>
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedDetailInterview.location && (
                                    <div className="space-y-1">
                                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                            LOKASI TATAP MUKA (OFFLINE)
                                        </span>
                                        <div className="flex items-center justify-between gap-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 text-[13px] text-[#ffffff]">
                                            <span>
                                                {
                                                    selectedDetailInterview.location
                                                }
                                            </span>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDetailInterview.location)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 font-mono text-[11px] text-[#6798ff] hover:underline"
                                            >
                                                Google Maps ↗
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedDetailInterview.notes && (
                                    <div className="space-y-1">
                                        <span className="font-mono text-[10px] tracking-[0.85px] text-[#7c7c7c] uppercase">
                                            CATATAN INTERVIEW
                                        </span>
                                        <p className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-[#ffffff]">
                                            {selectedDetailInterview.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Copilot Link Shortcut */}
                                <div className="flex items-center justify-between gap-3 rounded-[6px] border border-[#6798ff]/30 bg-[#6798ff]/10 p-3.5">
                                    <div>
                                        <h5 className="text-[13px] font-semibold text-[#ffffff]">
                                            Latihan Jawaban Wawancara
                                        </h5>
                                        <p className="text-[11px] text-[#a7a7a7]">
                                            Simulasikan pertanyaan teknis &
                                            metode STAR dengan AI Copilot.
                                        </p>
                                    </div>
                                    <Link
                                        href={`/ai/interview-copilot?application_id=${selectedDetailInterview.job_application_id}&job_title=${encodeURIComponent(
                                            selectedDetailInterview.job_title ||
                                                '',
                                        )}&company=${encodeURIComponent(selectedDetailInterview.company_name || '')}`}
                                        className="shrink-0 rounded-[6px] border border-[#6798ff] bg-[#6798ff] px-3 py-1.5 text-[12px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#ffffff]"
                                    >
                                        Mulai Latihan
                                    </Link>
                                </div>

                                {/* Status & Manage Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#313131] pt-2">
                                    <div className="flex items-center gap-1.5">
                                        {selectedDetailInterview.status ===
                                            'scheduled' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleUpdateStatus(
                                                            selectedDetailInterview.id,
                                                            'completed',
                                                        )
                                                    }
                                                    className="rounded-[6px] border border-[#1e3a2f] bg-[#141414] px-3 py-1.5 text-[12px] font-medium text-[#34d399] transition-colors hover:bg-[#1e3a2f]/20"
                                                >
                                                    Tandai Selesai
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const dateObj =
                                                            new Date(
                                                                selectedDetailInterview.start_at,
                                                            );
                                                        const y =
                                                            dateObj.getFullYear();
                                                        const m = String(
                                                            dateObj.getMonth() +
                                                                1,
                                                        ).padStart(2, '0');
                                                        const d = String(
                                                            dateObj.getDate(),
                                                        ).padStart(2, '0');
                                                        setRescheduleDate(
                                                            `${y}-${m}-${d}`,
                                                        );
                                                        setRescheduleTime(
                                                            formatTimeOnly(
                                                                selectedDetailInterview.start_at,
                                                            ),
                                                        );
                                                        setRescheduleDuration(
                                                            60,
                                                        );
                                                        setRescheduleNotes('');
                                                        setRescheduleError(
                                                            null,
                                                        );
                                                        setIsRescheduling(true);
                                                    }}
                                                    className="rounded-[6px] border border-[#454545] bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#ffffff] transition-colors hover:border-[#6798ff]"
                                                >
                                                    Jadwalkan Ulang
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        {selectedDetailInterview.status ===
                                            'scheduled' && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleUpdateStatus(
                                                        selectedDetailInterview.id,
                                                        'cancelled',
                                                    )
                                                }
                                                className="rounded-[6px] border border-transparent px-2.5 py-1.5 text-[12px] text-[#f87171] transition-colors hover:bg-[#f87171]/10"
                                            >
                                                Batalkan
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteInterview(
                                                    selectedDetailInterview.id,
                                                )
                                            }
                                            className="rounded-[6px] border border-transparent px-2.5 py-1.5 text-[12px] text-[#7c7c7c] transition-colors hover:text-[#f87171]"
                                            title="Hapus dari database"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* RESCHEDULE FORM */
                            <form
                                onSubmit={handleRescheduleSubmit}
                                className="space-y-4"
                            >
                                <div className="rounded-[6px] border border-[#6798ff]/30 bg-[#6798ff]/10 p-3">
                                    <h4 className="text-[13px] font-medium text-[#ffffff]">
                                        Tentukan Waktu Baru Wawancara
                                    </h4>
                                    <p className="text-[11px] text-[#a7a7a7]">
                                        Pengingat otomatis akan dijadwalkan
                                        ulang sesuai dengan waktu baru yang Anda
                                        tentukan.
                                    </p>
                                </div>

                                {rescheduleError && (
                                    <div className="rounded-[6px] border border-[#f87171]/40 bg-[#f87171]/10 p-2.5 text-[12px] text-[#f87171]">
                                        {rescheduleError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="space-y-1.5 sm:col-span-1">
                                        <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                            Tanggal Baru
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={rescheduleDate}
                                            onChange={(e) =>
                                                setRescheduleDate(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-1">
                                        <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                            Jam Mulai Baru
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={rescheduleTime}
                                            onChange={(e) =>
                                                setRescheduleTime(
                                                    e.target.value,
                                                )
                                            }
                                            className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-1">
                                        <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                            Durasi
                                        </label>
                                        <select
                                            value={rescheduleDuration}
                                            onChange={(e) =>
                                                setRescheduleDuration(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                        >
                                            <option value={30}>30 Menit</option>
                                            <option value={45}>45 Menit</option>
                                            <option value={60}>60 Menit</option>
                                            <option value={90}>90 Menit</option>
                                            <option value={120}>
                                                120 Menit
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[12px] font-medium text-[#a7a7a7]">
                                        Alasan Reschedule (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Pewawancara berhalangan, dialihkan ke hari Kamis"
                                        value={rescheduleNotes}
                                        onChange={(e) =>
                                            setRescheduleNotes(e.target.value)
                                        }
                                        className="w-full rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-3.5 py-2 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 border-t border-[#313131] pt-2">
                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => setIsRescheduling(false)}
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        isLoading={isRescheduleSubmitting}
                                    >
                                        Konfirmasi Reschedule
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
