import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';

interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read_at: string | null;
    created_at: string;
    data?: Record<string, unknown>;
}

export interface NotificationDropdownProps {
    onOpen?: () => void;
}

export function NotificationDropdown({ onOpen }: NotificationDropdownProps = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch('/api/v1/notifications/unread-count', {
                headers,
                credentials: 'same-origin',
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(
                    typeof data.count === 'number'
                        ? data.count
                        : (data.unread_count ?? 0),
                );
            }
        } catch {
            // Silently ignore network failures on background poll
        }
    };

    const fetchRecentNotifications = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('careerpilot_token');
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch('/api/v1/notifications?per_page=5', {
                headers,
                credentials: 'same-origin',
            });
            if (res.ok) {
                const json = await res.json();
                setNotifications(json.data || []);
            }
        } catch {
            // Silently ignore
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('careerpilot_token');
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch('/api/v1/notifications/mark-all-read', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });
            if (res.ok) {
                setUnreadCount(0);
                setNotifications((prev) =>
                    prev.map((n) => ({
                        ...n,
                        read_at: new Date().toISOString(),
                    })),
                );
            }
        } catch {
            // Ignore
        }
    };

    // Initial fetch and periodic polling (every 60s)
    useEffect(() => {
        void fetchUnreadCount();
        const interval = setInterval(() => {
            void fetchUnreadCount();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch details when dropdown is opened
    useEffect(() => {
        if (isOpen) {
            void fetchRecentNotifications();
        }
    }, [isOpen]);

    // Close on click outside & Escape key (R-32 Accessibility)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const getNotificationIcon = (type: string) => {
        if (type.includes('stagnant')) {
            return (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
            );
        }
        if (type.includes('interview')) {
            return (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#6798ff]/30 bg-[#6798ff]/10 text-[#6798ff]">
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
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </div>
            );
        }
        return (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7]">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
            </div>
        );
    };

    return (
        <div className="relative shrink-0" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => {
                    if (!isOpen) onOpen?.();
                    setIsOpen(!isOpen);
                }}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={
                    unreadCount > 0
                        ? `${unreadCount} notifikasi belum dibaca`
                        : 'Pusat Notifikasi'
                }
                className="relative flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[8px] border border-transparent text-[#a7a7a7] transition-colors hover:border-[#313131] hover:bg-[#1e1e1e] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#6798ff] px-1 font-mono text-[10px] font-semibold text-[#0a0a0a]">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown Panel (Dovetail Theme) */}
            {isOpen && (
                <div
                    className="fixed inset-x-3 top-[calc(5rem+4px)] z-50 mx-auto max-w-[420px] overflow-hidden rounded-[8px] border border-[#313131] bg-[#141414] text-[#ffffff] shadow-2xl focus:outline-none sm:absolute sm:top-full sm:right-0 sm:inset-auto sm:mt-2.5 sm:w-96 sm:max-w-none sm:mx-0"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="flex items-center justify-between border-b border-[#313131] px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#ffffff]">
                                Notifikasi
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-[4px] bg-[#6798ff]/15 px-1.5 py-0.5 font-mono text-[11px] font-medium text-[#6798ff]">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-[11px] text-[#a7a7a7] transition-colors hover:text-[#ffffff] focus-visible:underline focus-visible:outline-none"
                            >
                                Tandai semua dibaca
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 divide-y divide-[#1e1e1e] overflow-y-auto">
                        {isLoading && notifications.length === 0 ? (
                            <div className="py-8 text-center text-[13px] text-[#7c7c7c]">
                                Memuat notifikasi...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <p className="text-[13px] font-medium text-[#a7a7a7]">
                                    Belum ada notifikasi baru
                                </p>
                                <p className="mt-1 text-[11px] text-[#7c7c7c]">
                                    Pengingat jadwal dan status lamaran akan
                                    muncul di sini.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const isUnread = notif.read_at === null;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-[#1e1e1e]/60 ${
                                            isUnread ? 'bg-[#1e1e1e]/30' : ''
                                        }`}
                                    >
                                        {getNotificationIcon(notif.type)}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-[12px] font-semibold text-[#ffffff]">
                                                    {notif.title}
                                                </p>
                                                {isUnread && (
                                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6798ff]" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#a7a7a7]">
                                                {notif.message}
                                            </p>
                                            <span className="mt-1 block font-mono text-[10px] text-[#7c7c7c]">
                                                {new Date(
                                                    notif.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="border-t border-[#313131] p-2 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block rounded-[6px] py-1.5 text-[12px] font-medium text-[#6798ff] transition-colors hover:bg-[#1e1e1e]"
                        >
                            Buka Pusat Notifikasi Lengkap →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
