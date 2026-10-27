import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/layouts/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface EmailEventItem {
    id: string;
    sender_name: string;
    sender_address: string;
    subject: string;
    snippet: string;
    received_at: string;
    classification:
        | 'interview_invitation'
        | 'accepted'
        | 'pending'
        | 'rejected';
    classification_label: string;
    extracted_payload?: {
        company_name?: string;
        job_title?: string;
        interview_details?: {
            date?: string;
            start_time?: string;
            end_time?: string;
            timezone?: string;
            mode?: 'online' | 'offline';
            meeting_url?: string;
            location?: string;
        };
        uncertainty_notes?: string | null;
    } | null;
    uncertainty_notes?: string | null;
    related_application_id?: string | null;
    related_application?: {
        id: string;
        job_title: string;
        company?: {
            name: string;
        };
    } | null;
    processing_status: string;
    requires_confirmation: boolean;
}

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    body: string;
    payload?: {
        job_application_id?: string;
        job_title?: string;
        company_name?: string;
        days_since_update?: number;
        analysis?: string;
        advice?: string;
        recommendations?: Array<{
            job_title: string;
            reason: string;
            key_skills: string[];
            suggested_portals: string[];
        }>;
        interview_id?: string;
    } | null;
    job_application_id?: string | null;
    interview_id?: string | null;
    read_at: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState<
        'all' | 'triage' | 'stagnant' | 'reminders'
    >('all');
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [emailEvents, setEmailEvents] = useState<EmailEventItem[]>([]);
    const [_isLoading, setIsLoading] = useState(false);
    const [actionFeedback, setActionFeedback] = useState<string | null>(null);

    // Email Preview Modal for Stagnant Email Alerts
    const [previewNotification, setPreviewNotification] =
        useState<NotificationItem | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) headers.Authorization = `Bearer ${token}`;

            // Fetch In-App Notifications
            const notifRes = await fetch('/api/v1/notifications?per_page=50', {
                headers,
                credentials: 'same-origin',
            });
            if (notifRes.ok) {
                const notifJson = await notifRes.json();
                setNotifications(notifJson.data || []);
            }

            // Fetch Pending Email Events
            const eventsRes = await fetch(
                '/api/v1/email/events?pending_review_only=1&per_page=50',
                {
                    headers,
                    credentials: 'same-origin',
                },
            );
            if (eventsRes.ok) {
                const eventsJson = await eventsRes.json();
                setEmailEvents(eventsJson.data || []);
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    // Mark single notification as read
    const handleMarkAsRead = async (id: string) => {
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

            const res = await fetch(`/api/v1/notifications/${id}/read`, {
                method: 'PATCH',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id
                            ? {
                                  ...n,
                                  is_read: true,
                                  read_at: new Date().toISOString(),
                              }
                            : n,
                    ),
                );
            }
        } catch {
            // Silently ignore
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
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

            const res = await fetch('/api/v1/notifications/mark-all-read', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({
                        ...n,
                        is_read: true,
                        read_at: new Date().toISOString(),
                    })),
                );
                setActionFeedback('Semua notifikasi ditandai sudah dibaca.');
                setTimeout(() => setActionFeedback(null), 3000);
            }
        } catch {
            // Silently ignore
        }
    };

    // Delete single notification
    const handleDeleteNotification = async (id: string) => {
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

            const res = await fetch(`/api/v1/notifications/${id}`, {
                method: 'DELETE',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }
        } catch {
            // Silently ignore
        }
    };

    // Confirm Email Event
    const handleConfirmEvent = async (event: EmailEventItem) => {
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

            let actionType = 'none';
            const bodyPayload: Record<string, any> = {};

            if (event.classification === 'interview_invitation') {
                actionType = 'create_interview';
                const iDetails = event.extracted_payload?.interview_details;
                const startDateStr =
                    iDetails?.date && iDetails?.start_time
                        ? `${iDetails.date}T${iDetails.start_time}:00`
                        : new Date(Date.now() + 86400000 * 2).toISOString();
                const endDateStr =
                    iDetails?.date && iDetails?.end_time
                        ? `${iDetails.date}T${iDetails.end_time}:00`
                        : new Date(
                              Date.now() + 86400000 * 2 + 3600000,
                          ).toISOString();

                bodyPayload.action_type = actionType;
                bodyPayload.interview_details = {
                    job_application_id: event.related_application_id,
                    interview_type: 'Wawancara Rekrutmen (Dari Email)',
                    start_at: startDateStr,
                    end_at: endDateStr,
                    timezone: iDetails?.timezone || 'Asia/Jakarta',
                    meeting_url: iDetails?.meeting_url || null,
                    location: iDetails?.location || null,
                    notes: `Dikonfirmasi dari email: ${event.subject}`,
                };
            } else if (event.classification === 'accepted') {
                actionType = 'update_status';
                bodyPayload.action_type = actionType;
                bodyPayload.status = 'offer';
                bodyPayload.notes = `Status diubah menjadi Tawaran (Offer) dari email: ${event.subject}`;
            } else if (event.classification === 'rejected') {
                actionType = 'update_status';
                bodyPayload.action_type = actionType;
                bodyPayload.status = 'rejected';
                bodyPayload.notes = `Status diubah menjadi Ditolak dari email: ${event.subject}`;
            } else {
                bodyPayload.action_type = 'none';
            }

            const res = await fetch(
                `/api/v1/email/events/${event.id}/confirm`,
                {
                    method: 'POST',
                    headers,
                    credentials: 'same-origin',
                    body: JSON.stringify(bodyPayload),
                },
            );

            if (res.ok) {
                setEmailEvents((prev) => prev.filter((e) => e.id !== event.id));
                setActionFeedback(
                    `Email dari "${event.sender_name}" berhasil dikonfirmasi dan diproses.`,
                );
                setTimeout(() => setActionFeedback(null), 4000);
            }
        } catch {
            // Silently ignore
        }
    };

    // Dismiss Email Event
    const handleDismissEvent = async (id: string) => {
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

            const res = await fetch(`/api/v1/email/events/${id}/dismiss`, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });

            if (res.ok) {
                setEmailEvents((prev) => prev.filter((e) => e.id !== id));
            }
        } catch {
            // Silently ignore
        }
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const stagnantNotifications = notifications.filter(
        (n) => n.type === 'stagnant_job_alert',
    );
    const reminderNotifications = notifications.filter(
        (n) => n.type.includes('reminder') || n.type.includes('interview'),
    );

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <AppLayout
            title="Pusat Notifikasi & Triase Email"
            action={
                <div className="flex items-center gap-2">
                    <Link
                        href="/integrations"
                        aria-label="Pengaturan Akun Gmail"
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[8px] border border-[#313131] bg-[#141414] px-2.5 py-2 text-[13px] font-medium text-[#a7a7a7] transition-colors hover:border-[#6798ff] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:px-3.5"
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span className="hidden sm:inline">
                            Pengaturan Akun Gmail
                        </span>
                    </Link>

                    {unreadCount > 0 && (
                        <Button
                            variant="secondary"
                            aria-label="Tandai Semua Dibaca"
                            onClick={handleMarkAllAsRead}
                            className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5"
                        >
                            <svg
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="hidden sm:inline">
                                Tandai Semua Dibaca
                            </span>
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Pusat Notifikasi & Triase Email - CareerPilot AI" />

            <div className="space-y-6">
                {/* Header Banner */}
                <div className="rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    NOTIFICATION CENTER & EMAIL TRIAGE
                                </span>
                                {unreadCount > 0 && (
                                    <span className="rounded-[4px] bg-[#6798ff]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#6798ff]">
                                        {unreadCount} Belum Dibaca
                                    </span>
                                )}
                            </div>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]">
                                Pusat Notifikasi & Triase Email Rekrutmen
                            </h2>
                            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#a7a7a7]">
                                Pantau hasil ekstraksi email rekrutmen dari HR,
                                konfirmasi jadwal interview langsung ke
                                kalender, serta tinjau notifikasi email
                                peringatan lamaran stagnan lebih dari 14 hari.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Feedback Toast */}
                {actionFeedback && (
                    <div className="rounded-[6px] border border-[#34d399]/40 bg-[#34d399]/10 p-3.5 text-[13px] text-[#34d399]">
                        ✓ {actionFeedback}
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex scrollbar-none items-center gap-2 overflow-x-auto border-b border-[#313131] pb-3 sm:flex-wrap">
                    {[
                        {
                            id: 'all',
                            label: `Semua Notifikasi (${notifications.length})`,
                        },
                        {
                            id: 'triage',
                            label: `Triase Email Masuk (${emailEvents.length})`,
                            highlight: emailEvents.length > 0,
                        },
                        {
                            id: 'stagnant',
                            label: `Lamaran Stagnan (${stagnantNotifications.length})`,
                        },
                        {
                            id: 'reminders',
                            label: `Pengingat Interview (${reminderNotifications.length})`,
                        },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex shrink-0 items-center gap-1.5 rounded-[6px] px-3.5 py-2 text-[13px] font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'border border-[#6798ff] bg-[#1e1e1e] text-[#ffffff]'
                                    : 'border border-transparent text-[#7c7c7c] hover:bg-[#141414] hover:text-[#ffffff]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.highlight && (
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#6798ff]"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* TAB 1: PENDING EMAIL TRIAGE REVIEWS */}
                {(activeTab === 'all' || activeTab === 'triage') &&
                    emailEvents.length > 0 && (
                        <div className="space-y-4 rounded-[8px] border border-[#6798ff]/30 bg-[#141414] p-5 sm:p-6">
                            <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6798ff]/20 font-mono text-[11px] font-semibold text-[#6798ff]">
                                        {emailEvents.length}
                                    </span>
                                    <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                        Pesan Email Rekrutmen Perlu Ditinjau
                                        (Awaiting Review)
                                    </h3>
                                </div>
                                <span className="font-mono text-[11px] text-[#7c7c7c]">
                                    AI Structured Extraction
                                </span>
                            </div>

                            <div className="space-y-3.5">
                                {emailEvents.map((event) => {
                                    const details =
                                        event.extracted_payload
                                            ?.interview_details;
                                    const isInterview =
                                        event.classification ===
                                        'interview_invitation';
                                    const isOffer =
                                        event.classification === 'accepted';
                                    const isRejection =
                                        event.classification === 'rejected';

                                    return (
                                        <div
                                            key={event.id}
                                            className="space-y-3 rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-4 transition-colors hover:border-[#454545] sm:p-5"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                isInterview
                                                                    ? 'accent'
                                                                    : isOffer
                                                                      ? 'success'
                                                                      : isRejection
                                                                        ? 'danger'
                                                                        : 'warning'
                                                            }
                                                            size="sm"
                                                        >
                                                            {event.classification_label ||
                                                                event.classification}
                                                        </Badge>
                                                        <span className="font-mono text-[11px] text-[#7c7c7c]">
                                                            {formatDate(
                                                                event.received_at,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-[15px] font-semibold text-[#ffffff]">
                                                        {event.subject}
                                                    </h4>
                                                    <p className="text-[12px] text-[#a7a7a7]">
                                                        Dari:{' '}
                                                        <span className="text-[#ffffff]">
                                                            {event.sender_name}
                                                        </span>{' '}
                                                        &lt;
                                                        {event.sender_address}
                                                        &gt;
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex w-full flex-wrap items-center gap-2 pt-3 sm:w-auto sm:shrink-0 sm:pt-0">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleConfirmEvent(
                                                                event,
                                                            )
                                                        }
                                                        className="min-h-[40px] flex-1 justify-center sm:min-h-[36px] sm:flex-none"
                                                    >
                                                        {isInterview
                                                            ? 'Konfirmasi & Masuk Kalender'
                                                            : isOffer
                                                              ? 'Konfirmasi Status Tawaran'
                                                              : 'Konfirmasi Pembaruan Status'}
                                                    </Button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDismissEvent(
                                                                event.id,
                                                            )
                                                        }
                                                        className="min-h-[40px] rounded-[6px] border border-[#313131] bg-[#141414] px-3.5 py-1.5 text-[12px] text-[#a7a7a7] transition-colors hover:text-[#ffffff] sm:min-h-0"
                                                    >
                                                        Abaikan
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Snippet text */}
                                            <p className="rounded-[6px] border border-[#313131]/60 bg-[#141414] p-3 text-[12px] leading-relaxed text-[#a7a7a7] italic">
                                                "{event.snippet}"
                                            </p>

                                            {/* AI Extracted Highlights */}
                                            <div className="grid grid-cols-1 gap-2.5 pt-1 text-[12px] sm:grid-cols-2">
                                                {event.extracted_payload
                                                    ?.company_name && (
                                                    <div className="flex items-center gap-1.5 text-[#ffffff]">
                                                        <span className="text-[#7c7c7c]">
                                                            Perusahaan:
                                                        </span>
                                                        <strong className="text-[#6798ff]">
                                                            {
                                                                event
                                                                    .extracted_payload
                                                                    .company_name
                                                            }
                                                        </strong>
                                                    </div>
                                                )}

                                                {event.extracted_payload
                                                    ?.job_title && (
                                                    <div className="flex items-center gap-1.5 text-[#ffffff]">
                                                        <span className="text-[#7c7c7c]">
                                                            Posisi:
                                                        </span>
                                                        <span>
                                                            {
                                                                event
                                                                    .extracted_payload
                                                                    .job_title
                                                            }
                                                        </span>
                                                    </div>
                                                )}

                                                {details?.date && (
                                                    <div className="flex items-center gap-1.5 text-[#ffffff]">
                                                        <span className="text-[#7c7c7c]">
                                                            Jadwal Terdeteksi:
                                                        </span>
                                                        <span className="font-mono text-[#34d399]">
                                                            {details.date} (
                                                            {details.start_time ||
                                                                '10:00'}{' '}
                                                            -{' '}
                                                            {details.end_time ||
                                                                '11:00'}{' '}
                                                            {details.timezone ||
                                                                'WIB'}
                                                            )
                                                        </span>
                                                    </div>
                                                )}

                                                {details?.meeting_url && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[#7c7c7c]">
                                                            Meeting URL:
                                                        </span>
                                                        <a
                                                            href={
                                                                details.meeting_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="max-w-[200px] truncate text-[#6798ff] hover:underline"
                                                        >
                                                            {
                                                                details.meeting_url
                                                            }
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                {/* TAB 2 & GENERAL: IN-APP NOTIFICATIONS LIST */}
                <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                    <div className="flex items-center justify-between border-b border-[#313131] pb-3">
                        <h3 className="text-[16px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                            Riwayat Notifikasi Sistem & Peringatan Email
                        </h3>
                        <span className="font-mono text-[11px] text-[#7c7c7c]">
                            In-App Alerts
                        </span>
                    </div>

                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((item) => {
                                const isStagnant =
                                    item.type === 'stagnant_job_alert';

                                return (
                                    <div
                                        key={item.id}
                                        className={`rounded-[8px] border p-4 transition-colors sm:p-5 ${
                                            !item.is_read
                                                ? 'border-[#6798ff]/50 bg-[#1e1e1e]'
                                                : 'border-[#313131] bg-[#141414]'
                                        }`}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex-1 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!item.is_read && (
                                                        <span className="h-2 w-2 rounded-full bg-[#6798ff]"></span>
                                                    )}
                                                    <Badge
                                                        variant={
                                                            isStagnant
                                                                ? 'warning'
                                                                : item.type.includes(
                                                                        'interview',
                                                                    )
                                                                  ? 'accent'
                                                                  : 'default'
                                                        }
                                                        size="sm"
                                                    >
                                                        {isStagnant
                                                            ? 'Lamaran Stagnan'
                                                            : item.type.includes(
                                                                    'interview',
                                                                )
                                                              ? 'Jadwal Interview'
                                                              : 'Notifikasi Sistem'}
                                                    </Badge>
                                                    <span className="font-mono text-[11px] text-[#7c7c7c]">
                                                        {formatDate(
                                                            item.created_at,
                                                        )}
                                                    </span>
                                                </div>

                                                <h4 className="text-[15px] font-semibold text-[#ffffff]">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[13px] leading-relaxed text-[#a7a7a7]">
                                                    {item.body}
                                                </p>

                                                {/* For Stagnant Alerts: Preview email alert button */}
                                                {isStagnant && item.payload && (
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewNotification(
                                                                    item,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#6798ff] bg-[#6798ff]/10 px-3 py-1.5 text-[12px] font-medium text-[#6798ff] transition-colors hover:bg-[#6798ff]/20"
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                            >
                                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                                <polyline points="22,6 12,13 2,6"></polyline>
                                                            </svg>
                                                            <span>
                                                                Lihat Format
                                                                Email Yang
                                                                Dikirimkan
                                                            </span>
                                                        </button>

                                                        {item.payload
                                                            .job_application_id && (
                                                            <Link
                                                                href={`/ai/career-planner`}
                                                                className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#313131] bg-[#0a0a0a] px-3 py-1.5 text-[12px] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                                                            >
                                                                Buka AI Career
                                                                Planner →
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action icons */}
                                            <div className="flex shrink-0 items-center gap-2 pt-2 sm:pt-0">
                                                {!item.is_read && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleMarkAsRead(
                                                                item.id,
                                                            )
                                                        }
                                                        className="rounded-[6px] border border-[#313131] bg-[#0a0a0a] px-2.5 py-1 text-[11px] text-[#a7a7a7] transition-colors hover:text-[#ffffff]"
                                                    >
                                                        Tandai Dibaca
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteNotification(
                                                            item.id,
                                                        )
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#7c7c7c] transition-colors hover:bg-[#f87171]/10 hover:text-[#f87171]"
                                                    title="Hapus notifikasi"
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2 py-12 text-center text-[#7c7c7c]">
                            <svg
                                className="mx-auto h-8 w-8 text-[#555555]"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                            >
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <p className="text-[13px]">
                                Belum ada notifikasi baru saat ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: PREVIEW FORMAT EMAIL NOTIFIKASI */}
            {previewNotification && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/85 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[8px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl">
                        <div className="mb-4 flex items-center justify-between border-b border-[#313131] pb-3">
                            <div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#6798ff] uppercase">
                                    PREVIEW EMAIL NOTIFIKASI RESMI
                                </span>
                                <h3 className="text-[18px] font-semibold tracking-[-0.3px] text-[#ffffff]">
                                    Format Email Yang Dikirimkan ke Kotak Masuk
                                    Anda
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewNotification(null)}
                                aria-label="Tutup preview email"
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

                        {/* Visual Email Template Simulation */}
                        <div className="space-y-4 rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-5 font-sans sm:p-6">
                            {/* Email Subject Header */}
                            <div className="space-y-1 border-b border-[#313131] pb-3">
                                <span className="font-mono text-[10px] text-[#7c7c7c] uppercase">
                                    SUBJEK EMAIL:
                                </span>
                                <p className="text-[14px] font-semibold text-[#ffffff]">
                                    Update Lamaran: Tidak Ada Perkembangan pada{' '}
                                    {previewNotification.payload?.job_title} di{' '}
                                    {previewNotification.payload?.company_name}
                                </p>
                            </div>

                            {/* Badge */}
                            <div>
                                <span className="inline-block rounded-[4px] border border-[#313131] bg-[#1e1e1e] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.8px] text-[#6798ff] uppercase">
                                    CAREERPILOT AI MONITORING
                                </span>
                                <h4 className="mt-2 text-[18px] font-semibold text-[#ffffff]">
                                    Tidak Ada Perkembangan Lamaran (2+ Minggu)
                                </h4>
                                <p className="text-[13px] text-[#a7a7a7]">
                                    Posisi{' '}
                                    <strong>
                                        {previewNotification.payload?.job_title}
                                    </strong>{' '}
                                    di{' '}
                                    <strong>
                                        {
                                            previewNotification.payload
                                                ?.company_name
                                        }
                                    </strong>
                                </p>
                            </div>

                            {/* Analisis Status */}
                            <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#141414] p-4">
                                <span className="font-mono text-[11px] font-semibold tracking-[0.5px] text-[#6798ff] uppercase">
                                    ANALISIS STATUS
                                </span>
                                <p className="text-[13px] leading-relaxed text-[#d1d5db]">
                                    {previewNotification.payload?.analysis ||
                                        `Lamaran kerja ini belum mendapatkan pembaruan status selama lebih dari 14 hari sejak pertama kali didaftarkan.`}
                                </p>
                            </div>

                            {/* Saran Advisor */}
                            <div className="space-y-1 rounded-[6px] border border-[#313131] bg-[#141414] p-4">
                                <span className="font-mono text-[11px] font-semibold tracking-[0.5px] text-[#34d399] uppercase">
                                    SARAN DARI CAREER ADVISOR
                                </span>
                                <p className="text-[13px] leading-relaxed text-[#d1d5db]">
                                    {previewNotification.payload?.advice ||
                                        `Jangan berkecil hati. Situasi ini lazim terjadi pada proses rekrutmen. Disarankan untuk tetap aktif menyebarkan portofolio dan melamar lowongan serupa.`}
                                </p>
                            </div>

                            {/* Rekomendasi Lowongan Serupa */}
                            {previewNotification.payload?.recommendations &&
                                previewNotification.payload.recommendations
                                    .length > 0 && (
                                    <div className="space-y-2.5 pt-1">
                                        <span className="block font-mono text-[11px] font-semibold tracking-[0.5px] text-[#6798ff] uppercase">
                                            REKOMENDASI LOWONGAN SERUPA UNTUK
                                            DILAMAR
                                        </span>
                                        {previewNotification.payload.recommendations.map(
                                            (rec, rIdx) => (
                                                <div
                                                    key={rIdx}
                                                    className="space-y-1.5 rounded-[6px] border border-[#313131] bg-[#1e1e1e] p-3.5"
                                                >
                                                    <h5 className="text-[14px] font-semibold text-[#ffffff]">
                                                        {rec.job_title}
                                                    </h5>
                                                    <p className="text-[12px] text-[#a7a7a7]">
                                                        {rec.reason}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                        <span className="text-[11px] text-[#7c7c7c]">
                                                            Skill:
                                                        </span>
                                                        {rec.key_skills.map(
                                                            (skill, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="rounded-[4px] border border-[#454545] bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[10px] text-[#a7a7a7]"
                                                                >
                                                                    {skill}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                                        <span className="text-[11px] text-[#7c7c7c]">
                                                            Cari di:
                                                        </span>
                                                        {rec.suggested_portals.map(
                                                            (portal, pIdx) => (
                                                                <span
                                                                    key={pIdx}
                                                                    className="rounded-[4px] border border-[#6798ff]/40 bg-[#6798ff]/10 px-1.5 py-0.5 font-mono text-[10px] text-[#6798ff]"
                                                                >
                                                                    {portal}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}

                            {/* Footer */}
                            <div className="border-t border-[#313131] pt-4 text-center text-[11px] text-[#7c7c7c]">
                                Email ini dikirim otomatis oleh CareerPilot AI
                                ke alamat terdaftar Anda.
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setPreviewNotification(null)}
                            >
                                Tutup Preview
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
