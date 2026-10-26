import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotificationDropdown } from '@/components/layout/NotificationDropdown';
import { UserDropdown } from '@/components/layout/UserDropdown';

export interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    action?: React.ReactNode;
}

interface NavItem {
    name: string;
    href: string;
    badge?: string;
}

export function AppLayout({ children, title, action }: AppLayoutProps) {
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Keyboard support: Escape closes mobile drawer (R-32)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mobileMenuOpen]);

    const navItems: NavItem[] = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Lamaran', href: '/applications' },
        { name: 'Kanban', href: '/kanban' },
        { name: 'Interview', href: '/interviews' },
        { name: 'Notifikasi', href: '/notifications' },
        { name: 'AI Planner', href: '/ai/career-planner', badge: 'AI' },
        {
            name: 'Interview Copilot',
            href: '/ai/interview-copilot',
            badge: 'AI',
        },
        { name: 'Analitik', href: '/analytics' },
        { name: 'Integrasi', href: '/integrations' },
        { name: 'Pengaturan', href: '/settings' },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return url === '/dashboard' || url === '/';
        }
        return url.startsWith(href);
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sans text-[#ffffff] selection:bg-[#1e1e1e] selection:text-[#6798ff]">
            {/* Top Bar / Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#313131] bg-[#0a0a0a]/95 backdrop-blur-sm">
                <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-2.5 rounded-[4px] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] text-[#6798ff] transition-colors group-hover:border-[#6798ff]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                    <polyline points="2 17 12 22 22 17" />
                                    <polyline points="2 12 12 17 22 12" />
                                </svg>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[15px] font-semibold tracking-[-0.2px] text-[#ffffff]">
                                    CareerPilot
                                </span>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    AI
                                </span>
                            </div>
                        </Link>

                        {/* Local Timezone Indicator (PRD FR-AUTH-002) */}
                        <div className="hidden items-center gap-1.5 border-l border-[#313131] pl-6 font-mono text-[12px] text-[#7c7c7c] xl:flex">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                            <span>WIB (Asia/Jakarta)</span>
                        </div>
                    </div>

                    {/* Right Header Utilities & Actions */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Notification Bell Dropdown */}
                        <NotificationDropdown />

                        {/* User Profile Dropdown */}
                        <UserDropdown />

                        {/* Custom Context Action or Default + Tambah Lamaran */}
                        {action ? (
                            action
                        ) : (
                            <Link href="/applications?create=true">
                                <Button variant="primary" size="md">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    <span className="hidden sm:inline">
                                        Tambah Lamaran
                                    </span>
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle Button (Tap target >= 44px) */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation"
                            aria-label={
                                mobileMenuOpen
                                    ? 'Tutup navigasi'
                                    : 'Buka navigasi'
                            }
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[8px] border border-[#454545] bg-[#141414] text-[#ffffff] hover:bg-[#1e1e1e] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none lg:hidden"
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
                                {mobileMenuOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </>
                                ) : (
                                    <>
                                        <line x1="4" y1="12" x2="20" y2="12" />
                                        <line x1="4" y1="6" x2="20" y2="6" />
                                        <line x1="4" y1="18" x2="20" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Sub-navigation bar (Desktop) */}
                <nav
                    aria-label="Navigasi Utama"
                    className="hidden border-t border-[#1e1e1e] bg-[#0a0a0a] lg:block"
                >
                    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                        <ul className="flex items-center space-x-1 overflow-x-auto py-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`relative inline-flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none ${
                                                active
                                                    ? 'border border-[#313131] bg-[#1e1e1e] text-[#ffffff]'
                                                    : 'text-[#a7a7a7] hover:bg-[#141414] hover:text-[#ffffff]'
                                            }`}
                                        >
                                            <span>{item.name}</span>
                                            {item.badge && (
                                                <Badge
                                                    variant={
                                                        active
                                                            ? 'accent'
                                                            : 'default'
                                                    }
                                                    size="sm"
                                                >
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </nav>

                {/* Mobile Drawer Navigation (Accessible, keyboard navigable) */}
                {mobileMenuOpen && (
                    <div
                        id="mobile-navigation"
                        className="fixed inset-x-0 top-20 bottom-0 z-50 flex flex-col justify-between overflow-y-auto border-t border-[#313131] bg-[#0a0a0a]/98 p-4 lg:hidden"
                    >
                        <nav aria-label="Navigasi Mobile" className="space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex min-h-[44px] items-center justify-between rounded-[8px] px-4 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none ${
                                            active
                                                ? 'border border-[#313131] bg-[#1e1e1e] text-[#ffffff]'
                                                : 'text-[#a7a7a7] hover:bg-[#141414] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        {item.badge && (
                                            <Badge
                                                variant={
                                                    active
                                                        ? 'accent'
                                                        : 'default'
                                                }
                                                size="sm"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="flex items-center justify-between border-t border-[#313131] p-4 font-mono text-[12px] text-[#7c7c7c]">
                            <span>Timezone: Asia/Jakarta</span>
                            <span className="text-[#6798ff]">v1.0.0</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Page Header (if title specified) */}
            {title && (
                <div className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[28px]">
                            {title}
                        </h1>
                    </div>
                </div>
            )}

            {/* Main Canvas with subtle blueprint grid motif */}
            <main className="bg-grid-pattern flex-1">
                <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#313131] bg-[#0a0a0a] py-6 font-sans text-[12px] text-[#7c7c7c]">
                <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-[#a7a7a7]">
                            CareerPilot AI
                        </span>
                        <span>•</span>
                        <span>Personal Job-Search Management</span>
                    </div>
                    <div className="flex items-center gap-4 text-[#7c7c7c]">
                        <span>AI-assisted, user-controlled</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
