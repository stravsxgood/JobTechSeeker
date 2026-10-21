import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

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
        { name: 'Interview Copilot', href: '/ai/interview-copilot', badge: 'AI' },
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
        <div className="min-h-screen bg-[#0a0a0a] text-[#ffffff] font-sans flex flex-col selection:bg-[#1e1e1e] selection:text-[#6798ff]">
            {/* Top Bar / Header */}
            <header className="sticky top-0 z-40 w-full border-b border-[#313131] bg-[#0a0a0a]/95 backdrop-blur-sm">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] rounded-[4px]"
                        >
                            <div className="w-7 h-7 rounded-[4px] bg-[#1e1e1e] border border-[#313131] flex items-center justify-center text-[#6798ff] group-hover:border-[#6798ff] transition-colors">
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
                                <span className="font-semibold text-[15px] tracking-[-0.2px] text-[#ffffff]">
                                    CareerPilot
                                </span>
                                <span className="font-mono text-[11px] text-[#a7a7a7] uppercase tracking-[0.85px]">
                                    AI
                                </span>
                            </div>
                        </Link>

                        {/* Local Timezone Indicator (PRD FR-AUTH-002) */}
                        <div className="hidden xl:flex items-center gap-1.5 text-[12px] text-[#7c7c7c] font-mono border-l border-[#313131] pl-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                            <span>WIB (Asia/Jakarta)</span>
                        </div>
                    </div>

                    {/* Right Header Utilities & Actions */}
                    <div className="flex items-center gap-3">
                        {/* Notification Link */}
                        <Link
                            href="/notifications"
                            aria-label="Notifikasi"
                            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] text-[#a7a7a7] hover:text-[#ffffff] hover:bg-[#1e1e1e] border border-transparent hover:border-[#313131] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]"
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
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#6798ff]" />
                        </Link>

                        {/* Custom Context Action or Default + Tambah Lamaran */}
                        {action ? (
                            action
                        ) : (
                            <Link href="/applications/create">
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
                                    <span>Tambah Lamaran</span>
                                </Button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle Button (Tap target >= 44px) */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation"
                            aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] bg-[#141414] border border-[#454545] text-[#ffffff] hover:bg-[#1e1e1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff]"
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
                    className="hidden lg:block border-t border-[#1e1e1e] bg-[#0a0a0a]"
                >
                    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                        <ul className="flex items-center space-x-1 overflow-x-auto py-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-2 rounded-[6px] transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] ${
                                                active
                                                    ? 'text-[#ffffff] bg-[#1e1e1e] border border-[#313131]'
                                                    : 'text-[#a7a7a7] hover:text-[#ffffff] hover:bg-[#141414]'
                                            }`}
                                        >
                                            <span>{item.name}</span>
                                            {item.badge && (
                                                <Badge
                                                    variant={active ? 'accent' : 'default'}
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
                        className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-[#0a0a0a]/98 border-t border-[#313131] p-4 flex flex-col justify-between overflow-y-auto"
                    >
                        <nav aria-label="Navigasi Mobile" className="space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center justify-between min-h-[44px] px-4 rounded-[8px] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] ${
                                            active
                                                ? 'bg-[#1e1e1e] text-[#ffffff] border border-[#313131]'
                                                : 'text-[#a7a7a7] hover:bg-[#141414] hover:text-[#ffffff]'
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        {item.badge && (
                                            <Badge
                                                variant={active ? 'accent' : 'default'}
                                                size="sm"
                                            >
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-[#313131] text-[12px] text-[#7c7c7c] font-mono flex items-center justify-between">
                            <span>Timezone: Asia/Jakarta</span>
                            <span className="text-[#6798ff]">v1.0.0</span>
                        </div>
                    </div>
                )}
            </header>

            {/* Page Header (if title specified) */}
            {title && (
                <div className="border-b border-[#1e1e1e] bg-[#0a0a0a]">
                    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#ffffff] tracking-[-0.5px]">
                            {title}
                        </h1>
                    </div>
                </div>
            )}

            {/* Main Canvas with subtle blueprint grid motif */}
            <main className="flex-1 bg-grid-pattern">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#313131] bg-[#0a0a0a] py-6 text-[12px] text-[#7c7c7c] font-sans">
                <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[#a7a7a7] font-medium">CareerPilot AI</span>
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
