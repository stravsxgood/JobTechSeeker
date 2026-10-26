import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';

export interface FollowUpItem {
    id: string;
    job_title: string;
    company: {
        id: string;
        name: string;
    };
    status: string;
    applied_at?: string | null;
    follow_up_at?: string | null;
    updated_at: string;
}

export interface UpcomingInterviewItem {
    id: string;
    job_title?: string;
    company_name?: string;
    interview_type: string;
    start_at: string;
    meeting_url?: string | null;
    location?: string | null;
}

interface CustomTodo {
    id: string;
    application_id?: string;
    company_name: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
}

interface ApplicationTodoListProps {
    followUpsDue: FollowUpItem[];
    upcomingInterviews: UpcomingInterviewItem[];
    onStatusChangeClick?: (applicationId: string) => void;
    onRefresh?: () => void;
}

export function ApplicationTodoList({
    followUpsDue,
    upcomingInterviews,
    onStatusChangeClick,
    onRefresh,
}: ApplicationTodoListProps) {
    const [filter, setFilter] = useState<'all' | 'followup' | 'interview' | 'stagnant' | 'custom'>('all');
    const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
    const [customTodos, setCustomTodos] = useState<CustomTodo[]>([
        {
            id: 'custom-1',
            company_name: 'Semua Lamaran Aktif',
            title: 'Periksa folder spam & inbox rekrutmen email setiap pagi',
            is_completed: false,
        },
    ]);
    const [isAddingTodo, setIsAddingTodo] = useState(false);
    const [newTodoTitle, setNewTodoTitle] = useState('');
    const [newTodoCompany, setNewTodoCompany] = useState('');

    const toggleTask = (taskId: string) => {
        setCompletedTasks((prev) => ({
            ...prev,
            [taskId]: !prev[taskId],
        }));
    };

    const handleAddCustomTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodoTitle.trim()) return;

        setCustomTodos((prev) => [
            {
                id: `custom-${Date.now()}`,
                company_name: newTodoCompany.trim() || 'Lamaran Kerja',
                title: newTodoTitle.trim(),
                is_completed: false,
            },
            ...prev,
        ]);

        setNewTodoTitle('');
        setNewTodoCompany('');
        setIsAddingTodo(false);
    };

    // Calculate stagnant applications (>= 14 days without status update)
    const stagnantItems = followUpsDue.filter((app) => {
        const updatedDate = new Date(app.updated_at);
        const diffDays = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 14;
    });

    const totalActiveTodos =
        followUpsDue.length +
        upcomingInterviews.length +
        customTodos.filter((t) => !completedTasks[t.id]).length;

    return (
        <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-[0.85px] text-[#6798ff]">
                            TINDAKAN & AGENDA
                        </span>
                        <span className="rounded-[4px] bg-[#1e1e1e] border border-[#313131] px-1.5 py-0.5 font-mono text-[10px] text-[#ffffff]">
                            {totalActiveTodos} tugas aktif
                        </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#ffffff] tracking-[-0.2px]">
                        To-Do List Lamaran Yang Sudah Dilamar
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsAddingTodo(!isAddingTodo)}
                        className="flex min-h-[36px] items-center gap-1.5 rounded-[6px] border border-[#454545] bg-[#1e1e1e] px-3 text-[12px] font-medium text-[#ffffff] hover:border-[#6798ff] transition-colors focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Tambah To-Do</span>
                    </button>
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            aria-label="Segarkan to-do"
                            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] hover:text-[#ffffff] transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6" />
                                <path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Add To-Do Form */}
            {isAddingTodo && (
                <form
                    onSubmit={handleAddCustomTodo}
                    className="mt-4 rounded-[6px] border border-[#6798ff]/40 bg-[#0a0a0a] p-3.5 space-y-3"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                            <label className="block text-[11px] font-mono text-[#a7a7a7] uppercase mb-1">
                                Perusahaan / Topik
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: Shopee / Take-Home Test"
                                value={newTodoCompany}
                                onChange={(e) => setNewTodoCompany(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#141414] px-3 py-1.5 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono text-[#a7a7a7] uppercase mb-1">
                                Aktivitas / Tindakan <span className="text-[#f87171]">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Contoh: Kirim email follow-up berkas portofolio"
                                value={newTodoTitle}
                                onChange={(e) => setNewTodoTitle(e.target.value)}
                                className="w-full rounded-[6px] border border-[#313131] bg-[#141414] px-3 py-1.5 text-[13px] text-[#ffffff] focus:border-[#6798ff] focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setIsAddingTodo(false)}
                            className="rounded-[6px] border border-transparent px-3 py-1 text-[12px] text-[#a7a7a7] hover:text-[#ffffff]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="rounded-[6px] bg-[#ffffff] px-3 py-1 text-[12px] font-medium text-[#0a0a0a] hover:bg-[#a7a7a7] transition-colors"
                        >
                            Simpan Tugas
                        </button>
                    </div>
                </form>
            )}

            {/* Category Filter Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[#313131] pb-3">
                {[
                    { key: 'all', label: 'Semua Tindakan', count: totalActiveTodos },
                    { key: 'followup', label: 'Follow-Up', count: followUpsDue.length },
                    { key: 'interview', label: 'Interview', count: upcomingInterviews.length },
                    { key: 'stagnant', label: 'Stagnan (2 Minggu)', count: stagnantItems.length },
                    { key: 'custom', label: 'Checklist Mandiri', count: customTodos.length },
                ].map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setFilter(item.key as typeof filter)}
                        className={`inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                            filter === item.key
                                ? 'bg-[#1e1e1e] border border-[#6798ff] text-[#ffffff]'
                                : 'text-[#7c7c7c] hover:bg-[#1e1e1e]/60 hover:text-[#ffffff]'
                        }`}
                    >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] text-[#a7a7a7]">({item.count})</span>
                    </button>
                ))}
            </div>

            {/* To-Do Items List */}
            <div className="mt-3 divide-y divide-[#1e1e1e] max-h-96 overflow-y-auto">
                {/* 1. Upcoming Interview Action Items */}
                {(filter === 'all' || filter === 'interview') &&
                    upcomingInterviews.map((interview) => {
                        const taskId = `int-${interview.id}`;
                        const isDone = completedTasks[taskId];
                        const dateFormatted = new Date(interview.start_at).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        });

                        return (
                            <div
                                key={taskId}
                                className={`flex items-start gap-3 py-3 transition-colors ${
                                    isDone ? 'opacity-40' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isDone || false}
                                    onChange={() => toggleTask(taskId)}
                                    aria-label={`Tandai persiapan wawancara ${interview.job_title} selesai`}
                                    className="mt-1 h-4 w-4 rounded-[4px] border border-[#454545] bg-[#0a0a0a] text-[#6798ff] focus:ring-1 focus:ring-[#6798ff] cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[13px] font-medium text-[#ffffff]">
                                            Persiapan Sesi Interview: {interview.job_title || 'Posisi'}
                                        </span>
                                        <Badge variant="accent" size="sm">
                                            {interview.interview_type}
                                        </Badge>
                                        <span className="font-mono text-[11px] text-[#f59e0b]">
                                            {dateFormatted}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[12px] text-[#a7a7a7]">
                                        Perusahaan: <span className="text-[#ffffff]">{interview.company_name}</span>
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/ai/interview-copilot?job_title=${encodeURIComponent(
                                                interview.job_title || ''
                                            )}`}
                                            className="inline-flex items-center gap-1 rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2 py-1 text-[11px] text-[#6798ff] hover:border-[#6798ff] transition-colors"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                                <polyline points="20 17 12 22 2 17" />
                                            </svg>
                                            <span>Latihan Simulasi AI</span>
                                        </Link>
                                        {interview.meeting_url && (
                                            <a
                                                href={interview.meeting_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2 py-1 text-[11px] text-[#34d399] hover:border-[#34d399] transition-colors"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M15 10l5-5v14l-5-5" />
                                                    <rect x="2" y="6" width="13" height="12" rx="2" />
                                                </svg>
                                                <span>Buka Meeting</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {/* 2. Follow-Up Action Items */}
                {(filter === 'all' || filter === 'followup') &&
                    followUpsDue.map((app) => {
                        const taskId = `fu-${app.id}`;
                        const isDone = completedTasks[taskId];
                        const followUpDate = app.follow_up_at
                            ? new Date(app.follow_up_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                              })
                            : 'Segera';

                        return (
                            <div
                                key={taskId}
                                className={`flex items-start gap-3 py-3 transition-colors ${
                                    isDone ? 'opacity-40' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isDone || false}
                                    onChange={() => toggleTask(taskId)}
                                    aria-label={`Tandai follow-up ${app.job_title} selesai`}
                                    className="mt-1 h-4 w-4 rounded-[4px] border border-[#454545] bg-[#0a0a0a] text-[#6798ff] focus:ring-1 focus:ring-[#6798ff] cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[13px] font-medium text-[#ffffff]">
                                            Follow-Up Lamaran: {app.job_title}
                                        </span>
                                        <span className="rounded-[4px] bg-[#6798ff]/15 border border-[#6798ff]/30 px-1.5 py-0.2 font-mono text-[10px] text-[#6798ff]">
                                            Tenggat: {followUpDate}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[12px] text-[#a7a7a7]">
                                        Perusahaan: <span className="text-[#ffffff]">{app.company?.name}</span>
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        {onStatusChangeClick && (
                                            <button
                                                type="button"
                                                onClick={() => onStatusChangeClick(app.id)}
                                                className="rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2 py-1 text-[11px] text-[#ffffff] hover:border-[#6798ff] transition-colors"
                                            >
                                                Perbarui Status
                                            </button>
                                        )}
                                        <Link
                                            href={`/applications?search=${encodeURIComponent(app.company?.name || '')}`}
                                            className="text-[11px] text-[#7c7c7c] hover:text-[#ffffff] transition-colors"
                                        >
                                            Lihat Riwayat →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {/* 3. Stagnant Warning Items */}
                {(filter === 'all' || filter === 'stagnant') &&
                    stagnantItems.map((app) => {
                        const taskId = `stag-${app.id}`;
                        const isDone = completedTasks[taskId];

                        return (
                            <div
                                key={taskId}
                                className={`flex items-start gap-3 py-3 transition-colors ${
                                    isDone ? 'opacity-40' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isDone || false}
                                    onChange={() => toggleTask(taskId)}
                                    aria-label={`Tandai evaluasi stagnan ${app.job_title} selesai`}
                                    className="mt-1 h-4 w-4 rounded-[4px] border border-[#f59e0b] bg-[#0a0a0a] text-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-[13px] font-medium text-[#f59e0b]">
                                            Perhatian: Lamaran Belum Ada Kabar $\ge 14$ Hari
                                        </span>
                                        <span className="rounded-[4px] bg-[#f59e0b]/15 border border-[#f59e0b]/30 px-1.5 py-0.2 font-mono text-[10px] text-[#f59e0b]">
                                            Stagnan
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[12px] text-[#a7a7a7]">
                                        <span className="text-[#ffffff]">{app.job_title}</span> di {app.company?.name}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Link
                                            href={`/ai/career-planner`}
                                            className="inline-flex items-center gap-1 rounded-[4px] border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-2 py-1 text-[11px] text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-colors"
                                        >
                                            <span>Minta Alternatif Lowongan AI</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {/* 4. Custom User Tasks */}
                {(filter === 'all' || filter === 'custom') &&
                    customTodos.map((todo) => {
                        const isDone = completedTasks[todo.id] || todo.is_completed;

                        return (
                            <div
                                key={todo.id}
                                className={`flex items-start gap-3 py-3 transition-colors ${
                                    isDone ? 'opacity-40' : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() => toggleTask(todo.id)}
                                    aria-label={`Tandai to-do ${todo.title} selesai`}
                                    className="mt-1 h-4 w-4 rounded-[4px] border border-[#454545] bg-[#0a0a0a] text-[#6798ff] focus:ring-1 focus:ring-[#6798ff] cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className={`text-[13px] font-medium text-[#ffffff] ${isDone ? 'line-through text-[#7c7c7c]' : ''}`}>
                                        {todo.title}
                                    </p>
                                    <span className="font-mono text-[11px] text-[#7c7c7c]">
                                        Terkait: {todo.company_name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                {/* Empty State */}
                {totalActiveTodos === 0 && (
                    <div className="py-8 text-center">
                        <svg
                            className="mx-auto h-8 w-8 text-[#7c7c7c]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <p className="mt-2 text-[14px] font-medium text-[#ffffff]">
                            Semua To-Do Lamaran Selesai!
                        </p>
                        <p className="mt-1 text-[12px] text-[#7c7c7c]">
                            Tidak ada follow-up jatuh tempo atau agenda tertunda hari ini.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
