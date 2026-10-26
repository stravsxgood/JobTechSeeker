import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

interface User {
    id: string;
    name: string;
    email: string;
    timezone?: string;
}

export function UserDropdown() {
    const { auth } = usePage<{ auth?: { user?: User } }>().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

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

    const handleLogout = async () => {
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

            // Call API logout
            await fetch('/api/v1/logout', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });
        } catch {
            // Ignore failure
        } finally {
            localStorage.removeItem('careerpilot_token');
            // Also trigger web logout form/visit
            router.post('/logout');
        }
    };

    if (!user) {
        return (
            <Link
                href="/login"
                className="flex min-h-[44px] items-center rounded-[8px] border border-[#313131] bg-[#1e1e1e] px-4 text-[13px] font-medium text-[#ffffff] transition-colors hover:border-[#6798ff]"
            >
                Masuk
            </Link>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label={`Menu pengguna ${user.name}`}
                className="flex min-h-[44px] items-center gap-2.5 rounded-[8px] border border-transparent p-1.5 transition-colors hover:border-[#313131] hover:bg-[#141414] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
            >
                {/* User Initials Avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] font-mono text-[11px] font-semibold text-[#6798ff]">
                    {getInitials(user.name)}
                </div>
                <div className="hidden text-left xl:block">
                    <p className="max-w-[120px] truncate text-[13px] leading-tight font-medium text-[#ffffff]">
                        {user.name}
                    </p>
                    <p className="max-w-[120px] truncate text-[11px] text-[#7c7c7c]">
                        {user.email}
                    </p>
                </div>
                <svg
                    className={`h-4 w-4 text-[#7c7c7c] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Profile Dropdown Panel (Dovetail Theme) */}
            {isOpen && (
                <div
                    className="absolute top-full right-0 z-50 mt-2.5 w-72 overflow-hidden rounded-[8px] border border-[#313131] bg-[#141414] text-[#ffffff] shadow-2xl focus:outline-none sm:w-80"
                    role="menu"
                    aria-orientation="vertical"
                >
                    {/* Header info */}
                    <div className="border-b border-[#313131] bg-[#0a0a0a]/60 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] font-mono text-[13px] font-semibold text-[#6798ff]">
                                {getInitials(user.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] leading-tight font-semibold text-[#ffffff]">
                                    {user.name}
                                </p>
                                <p
                                    className="mt-0.5 truncate text-[12px] text-[#a7a7a7]"
                                    title={user.email}
                                >
                                    {user.email}
                                </p>
                            </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#313131]/40 pt-2 font-mono text-[11px] text-[#7c7c7c]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#34d399]" />
                            <span className="truncate">
                                Zona Waktu: {user.timezone || 'Asia/Jakarta'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-1 p-1.5">
                        <Link
                            href="/settings"
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] text-[#a7a7a7] transition-colors hover:bg-[#1e1e1e] hover:text-[#ffffff]"
                            role="menuitem"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors group-hover:border-[#6798ff] group-hover:text-[#6798ff]">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-[#ffffff]">
                                    Pengaturan Profil
                                </span>
                                <span className="text-[11px] text-[#7c7c7c]">
                                    Kelola profil dan target karier
                                </span>
                            </div>
                        </Link>
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="group flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] text-[#a7a7a7] transition-colors hover:bg-[#1e1e1e] hover:text-[#ffffff]"
                            role="menuitem"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] text-[#a7a7a7] transition-colors group-hover:border-[#6798ff] group-hover:text-[#6798ff]">
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
                            <div className="flex flex-col">
                                <span className="font-medium text-[#ffffff]">
                                    Pusat Notifikasi
                                </span>
                                <span className="text-[11px] text-[#7c7c7c]">
                                    Jadwal interview & pengingat
                                </span>
                            </div>
                        </Link>
                    </div>

                    <div className="border-t border-[#313131] p-1.5">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="group flex w-full items-center gap-3 rounded-[6px] px-3 py-2.5 text-left text-[13px] font-medium text-[#f87171] transition-colors hover:bg-[#f87171]/10"
                            role="menuitem"
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171] transition-colors group-hover:bg-[#f87171]/20">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                            <span>Keluar dari Akun</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
