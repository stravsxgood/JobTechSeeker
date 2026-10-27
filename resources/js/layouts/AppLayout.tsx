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

    // Prevent background scrolling when mobile drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Automatically close mobile menu if viewport widens to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            <header className="sticky top-0 z-50 w-full border-b border-[#313131] bg-[#0a0a0a]/95 backdrop-blur-sm">
                <div className="mx-auto flex h-20 min-h-[5rem] max-w-[1280px] items-center justify-between gap-3 px-3.5 sm:gap-4 sm:px-6 lg:px-8">
                    {/* Brand / Logo */}
                    <div className="flex shrink-0 items-center gap-2.5 sm:gap-6">
                        <Link
                            href="/dashboard"
                            className="group flex shrink-0 items-center gap-2 rounded-[6px] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:gap-2.5"
                        >
                            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#6798ff] transition-colors group-hover:border-[#6798ff] md:flex">
                                <svg
                                    width="18"
                                    height="18"
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
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                                <span className="text-[16px] font-semibold tracking-[-0.3px] whitespace-nowrap text-[#ffffff] sm:text-[17px]">
                                    CareerPilot
                                </span>
                                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.85px] text-[#a7a7a7] sm:text-[11px]">
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
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
                        {/* Notification Bell Dropdown */}
                        <NotificationDropdown onOpen={() => setMobileMenuOpen(false)} />

                        {/* User Profile Dropdown */}
                        <UserDropdown onOpen={() => setMobileMenuOpen(false)} />

                        {/* Custom Context Action or Default + Tambah Lamaran */}
                        {action ? (
                            <div className="flex shrink-0 items-center [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:px-2.5 sm:[&_button]:px-4 [&_button>span:not(.sr-only)]:hidden sm:[&_button>span:not(.sr-only)]:inline [&_a]:min-h-[44px] [&_a]:min-w-[44px] [&_a]:px-2.5 sm:[&_a]:px-4 [&_a>span:not(.sr-only)]:hidden sm:[&_a>span:not(.sr-only)]:inline">
                                {action}
                            </div>
                        ) : (
                            <Link href="/applications?create=true" className="shrink-0">
                                <Button
                                    variant="primary"
                                    size="md"
                                    aria-label="Tambah Lamaran"
                                    className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5"
                                >
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
                            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[8px] border border-[#454545] bg-[#141414] text-[#ffffff] hover:bg-[#1e1e1e] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none md:hidden"
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

                {/* Sub-navigation bar (Tablet & Desktop, with horizontal scrolling for iPad) */}
                <nav
                    aria-label="Navigasi Utama"
                    className="hidden border-t border-[#1e1e1e] bg-[#0a0a0a] md:block"
                >
                    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
                        <ul className="flex scrollbar-none items-center space-x-1 overflow-x-auto py-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href} className="shrink-0">
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
                    <>
                        <div
                            className="fixed inset-0 top-20 z-40 bg-[#000000]/80 backdrop-blur-sm md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        <div
                            id="mobile-navigation"
                            className="fixed inset-x-0 top-20 bottom-0 z-50 flex h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] flex-col overflow-y-auto overscroll-contain border-t border-[#313131] bg-[#0a0a0a]/98 p-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-2xl md:hidden"
                        >
                            {/* Mobile Quick Action (Primary CTA) */}
                            <div className="mb-3 shrink-0 border-b border-[#313131] pb-3">
                                <Link
                                    href="/applications?create=true"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[8px] bg-[#ffffff] px-4 py-2.5 text-[14px] font-semibold text-[#0a0a0a] transition-opacity hover:bg-[#ffffff]/90 active:bg-[#ffffff]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]"
                                >
                                    <svg
                                        width="15"
                                        height="15"
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
                                    <span>Tambah Lamaran Baru</span>
                                </Link>
                            </div>

                            <nav
                                aria-label="Navigasi Mobile"
                                className="flex-1 space-y-1 pb-4"
                            >
                                {navItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
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
                            <div className="mt-auto shrink-0 border-t border-[#313131] pt-3 font-mono text-[12px] text-[#7c7c7c]">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                                        WIB (Asia/Jakarta)
                                    </span>
                                    <span className="text-[#6798ff]">v1.0.0</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </header>

            {/* Page Header (if title specified) */}
            {title && (
                <div className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                    <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 lg:px-8">
                        <h1 className="text-[20px] font-semibold tracking-[-0.4px] text-[#ffffff] sm:text-[26px]">
                            {title}
                        </h1>
                    </div>
                </div>
            )}

            {/* Main Canvas with subtle blueprint grid motif */}
            <main className="bg-grid-pattern flex-1">
                <div className="mx-auto max-w-[1280px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#313131] bg-[#0a0a0a] py-5 font-sans text-[12px] text-[#7c7c7c] sm:py-6">
                <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-3 text-center sm:flex-row sm:gap-4 sm:px-6 sm:text-left lg:px-8">
                    <div className="flex items-center gap-2.5 sm:gap-3">
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
