import React, { useRef, useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    motion,
    useScroll,
    useVelocity,
    useSpring,
    useTransform,
    useMotionValue,
    useAnimationFrame,
    useInView,
} from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuthModal } from '@/components/auth/AuthModal';

/**
 * VelocityScrollRow: authentic, butter-smooth continuous horizontal marquee.
 * Moves continuously in a fixed direction ('left' or 'right') and smoothly
 * accelerates when the user scrolls the page, without any stuttering or pausing.
 */
interface VelocityScrollRowProps {
    children: React.ReactNode;
    baseSpeed?: number;
    direction: 'left' | 'right';
    className?: string;
}

function VelocityScrollRow({
    children,
    baseSpeed = 0.6,
    direction,
    className = '',
}: VelocityScrollRowProps) {
    // Left starts at 0%, Right starts at -50%
    const baseX = useMotionValue(direction === 'left' ? 0 : -50);
    const { scrollY } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
        damping: 50,
        stiffness: 260,
    });

    const baseDirection = direction === 'right' ? 1 : -1;

    useAnimationFrame((_, delta) => {
        // Clamp delta to maximum 0.05s to prevent visual hitching during lag or tab switches
        const deltaSeconds = Math.min(delta / 1000, 0.05);

        // v > 0 when scrolling down, v < 0 when scrolling up (gulir dari bawah ke atas)
        const v = smoothVelocity.get();
        // Comfortable, calm acceleration boost that allows reversing when scrolling up
        const scrollBoost = Math.max(-1.6, Math.min(2.0, v * 0.002));

        // When scrolling down, accelerates in base direction.
        // When scrolling up (gulir dari bawah ke atas), smoothly slows down and reverses.
        const effectiveVelocity = baseDirection * (baseSpeed + scrollBoost);
        const moveBy = effectiveVelocity * deltaSeconds;

        let current = baseX.get() + moveBy;

        // Continuous wrap within [-50, 0)
        while (current <= -50) {
            current += 50;
        }
        while (current >= 0) {
            current -= 50;
        }

        baseX.set(current);
    });

    const x = useTransform(baseX, (v) => `${v}%`);

    return (
        <div className="w-full overflow-hidden py-1.5 whitespace-nowrap select-none">
            <motion.div
                className="flex w-max will-change-transform"
                style={{ x }}
            >
                {/* Segment 1 */}
                <div className={`flex shrink-0 items-center ${className}`}>
                    {children}
                </div>
                {/* Segment 2 (Exact duplicate for seamless infinite loop) */}
                <div
                    className={`flex shrink-0 items-center ${className}`}
                    aria-hidden="true"
                >
                    {children}
                </div>
            </motion.div>
        </div>
    );
}

/**
 * FadeInWhenVisible: fades + slides children up subtly when entering viewport.
 * Uses a gentle, single-time entrance without persistent layout shifting.
 */
function FadeInWhenVisible({
    children,
    className = '',
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * StarIcon: renders a single star glyph.
 */
function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={filled ? '#6798ff' : 'none'}
            stroke={filled ? '#6798ff' : '#454545'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

/**
 * StarRating: displays a row of 5 stars with numeric rating label.
 */
function StarRating({ rating, label }: { rating: number; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div
                className="flex items-center gap-0.5"
                role="img"
                aria-label={`Rating ${rating} dari 5`}
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= Math.round(rating)} />
                ))}
            </div>
            <span className="font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7]">
                {rating}/5
            </span>
            <span className="text-[12px] text-[#8a8a8a]">{label}</span>
        </div>
    );
}

// Features data: real product capabilities from MEMORY.md
const features = [
    {
        title: 'Pelacakan Lamaran Terstruktur',
        description:
            'Catat setiap lamaran dengan status, perusahaan, posisi, dan sumber. Deteksi duplikasi otomatis dan riwayat perubahan status tercatat penuh.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
        ),
    },
    {
        title: 'Kalender Interview & Pengingat',
        description:
            'Jadwalkan sesi wawancara, deteksi bentrok otomatis, dan terima pengingat H-24 jam serta H-2 jam sebelum jadwal.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
    },
    {
        title: 'AI Career Planner',
        description:
            'Roadmap belajar 3 atau 5 bulan berdasarkan gap skill Anda. Rekomendasi media belajar dan ide proyek portofolio terarah.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
        ),
    },
    {
        title: 'Simulasi Interview AI',
        description:
            'Latihan wawancara kerja dengan pertanyaan teknis, behavioral, dan studi kasus berdasarkan deskripsi lowongan nyata.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        ),
    },
    {
        title: 'Triase Email Rekrutmen',
        description:
            'Hubungkan Gmail dengan izin read-only. AI mengklasifikasi email masuk sebagai interview, offer, rejection, atau pending, lalu mengekstrak jadwal.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
            </svg>
        ),
    },
    {
        title: 'Analitik Pencarian Kerja',
        description:
            'Response rate, interview conversion, distribusi sumber lamaran, dan tren bulanan. Dihitung langsung dari data pipeline Anda.',
        icon: (
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6798ff"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
        ),
    },
];

// How it works steps: based on actual product flow
const steps = [
    {
        number: '01',
        title: 'Catat lamaran Anda',
        description:
            'Tambahkan setiap lamaran kerja beserta posisi, perusahaan, dan sumbernya. Sistem mendeteksi duplikasi dan mencatat riwayat status audit.',
    },
    {
        number: '02',
        title: 'Hubungkan email rekrutmen',
        description:
            'Sambungkan akun Gmail dengan izin read-only. AI mengklasifikasi pesan rekrutmen masuk dan mengekstrak jadwal wawancara.',
    },
    {
        number: '03',
        title: 'Konfirmasi dan kelola',
        description:
            'Review hasil triase AI, konfirmasi jadwal interview ke kalender, dan pantau progres mingguan pada dashboard analitik.',
    },
    {
        number: '04',
        title: 'Persiapkan diri dengan AI',
        description:
            'Gunakan AI Career Planner untuk roadmap belajar, dan Interview Copilot untuk simulasi wawancara berdasarkan lowongan nyata.',
    },
];

interface WelcomeProps {
    initialAuthModal?: 'login' | 'register';
}

export default function Welcome({ initialAuthModal }: WelcomeProps = {}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(
        Boolean(initialAuthModal),
    );
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>(
        initialAuthModal || 'login',
    );

    useEffect(() => {
        if (initialAuthModal) {
            setAuthModalMode(initialAuthModal);
            setAuthModalOpen(true);
        }
    }, [initialAuthModal]);

    const handleOpenAuth = (mode: 'login' | 'register') => {
        setAuthModalMode(mode);
        setAuthModalOpen(true);
    };

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

    const navLinks = [
        { name: 'Fitur', href: '#fitur' },
        { name: 'Alur Kerja', href: '#alur-kerja' },
        { name: 'AI Copilot', href: '#ai-copilot' },
        { name: 'Penilaian', href: '#penilaian' },
        { name: 'Prinsip', href: '#prinsip' },
    ];

    return (
        <>
            <Head title="CareerPilot AI - Platform Manajemen Pencarian Kerja Personal">
                <meta
                    name="description"
                    content="Catat lamaran kerja, jadwalkan interview, terima triase email rekrutmen, dan persiapkan diri dengan AI. Platform manajemen pencarian kerja personal."
                />
            </Head>
            <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#ffffff] selection:bg-[#1e1e1e] selection:text-[#6798ff]">
                {/* ===== TOP NAVIGATION BAR (DOVETAIL DESIGN) ===== */}
                <header className="sticky top-0 z-50 w-full border-b border-[#313131] bg-[#0a0a0a]/95 backdrop-blur-md">
                    <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-3 sm:px-6 lg:h-20 lg:px-8">
                        {/* Logo & Brand */}
                        <div className="flex shrink-0 items-center gap-4 lg:gap-8">
                            <Link
                                href="/"
                                className="group flex shrink-0 items-center gap-2.5 rounded-[6px] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:gap-3"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#313131] bg-[#1e1e1e] text-[#6798ff] transition-colors group-hover:border-[#6798ff] sm:h-9 sm:w-9 lg:h-10 lg:w-10">
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
                                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                    <span className="text-[17px] font-semibold tracking-[-0.3px] text-[#ffffff] sm:text-[18px]">
                                        CareerPilot
                                    </span>
                                    <span className="rounded-[4px] border border-[#313131] bg-[#141414] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[1px] text-[#6798ff] uppercase sm:text-[11px]">
                                        AI
                                    </span>
                                </div>
                            </Link>

                            {/* Desktop Nav Links (Visible on desktop >= 1024px to never squeeze or hide the logo on iPad/Mobile) */}
                            <nav
                                aria-label="Navigasi Utama Landing"
                                className="hidden items-center gap-1 lg:flex lg:gap-2"
                            >
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="rounded-[6px] px-3 py-1.5 text-[14px] font-medium text-[#a7a7a7] transition-colors hover:bg-[#141414] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none lg:px-3.5 lg:py-2 lg:text-[15px]"
                                    >
                                        {link.name}
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Right Utility Actions */}
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => handleOpenAuth('login')}
                                className="hidden h-9 items-center justify-center rounded-[6px] px-3 text-[13px] font-medium text-[#a7a7a7] transition-colors hover:bg-[#1e1e1e] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none md:inline-flex lg:h-10 lg:px-3.5 lg:text-[14px]"
                            >
                                Masuk
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenAuth('register')}
                                className="inline-flex h-9 shrink-0 items-center justify-center rounded-[6px] bg-[#ffffff] px-3 text-[12px] font-medium text-[#0a0a0a] transition-all hover:bg-[#ffffff]/90 focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] focus-visible:outline-none active:scale-[0.98] sm:px-4 sm:text-[13px] lg:h-10 lg:text-[14px]"
                            >
                                Daftar Gratis
                            </button>

                            {/* Mobile Hamburger Toggle (Matches exact h-9 on mobile) */}
                            <button
                                type="button"
                                onClick={() =>
                                    setMobileMenuOpen(!mobileMenuOpen)
                                }
                                aria-expanded={mobileMenuOpen}
                                aria-controls="landing-mobile-menu"
                                aria-label={
                                    mobileMenuOpen
                                        ? 'Tutup navigasi'
                                        : 'Buka navigasi'
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#313131] bg-[#141414] text-[#ffffff] transition-colors hover:border-[#454545] hover:bg-[#1e1e1e] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none sm:h-10 sm:w-10 lg:hidden"
                            >
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
                                    {mobileMenuOpen ? (
                                        <>
                                            <line
                                                x1="18"
                                                y1="6"
                                                x2="6"
                                                y2="18"
                                            />
                                            <line
                                                x1="6"
                                                y1="6"
                                                x2="18"
                                                y2="18"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <line
                                                x1="4"
                                                y1="12"
                                                x2="20"
                                                y2="12"
                                            />
                                            <line
                                                x1="4"
                                                y1="6"
                                                x2="20"
                                                y2="6"
                                            />
                                            <line
                                                x1="4"
                                                y1="18"
                                                x2="20"
                                                y2="18"
                                            />
                                        </>
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation Drawer */}
                    {mobileMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 top-16 z-40 bg-[#000000]/80 backdrop-blur-sm lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-hidden="true"
                            />
                            <div
                                id="landing-mobile-menu"
                                className="relative z-50 border-t border-[#313131] bg-[#0a0a0a]/98 px-4 py-4 shadow-2xl lg:hidden"
                            >
                                <nav
                                    aria-label="Navigasi Mobile Landing"
                                    className="space-y-1"
                                >
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.name}
                                            href={link.href}
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className="flex min-h-[44px] items-center rounded-[8px] px-3.5 text-[15px] font-medium text-[#a7a7a7] transition-colors hover:bg-[#141414] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                                        >
                                            {link.name}
                                        </a>
                                    ))}
                                </nav>
                                <div className="mt-4 flex flex-col gap-2.5 border-t border-[#313131] pt-4">
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        className="min-h-[44px] w-full justify-center"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            handleOpenAuth('login');
                                        }}
                                    >
                                        Masuk ke Akun
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="md"
                                        className="min-h-[44px] w-full justify-center"
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            handleOpenAuth('register');
                                        }}
                                    >
                                        Daftar Gratis
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </header>

                <main id="main-content">
                    {/* ===== HERO SECTION ===== */}
                    <section className="relative overflow-hidden border-b border-[#1e1e1e]">
                        {/* Blueprint grid motif (DESIGN.md) */}
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, rgba(30,30,30,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,30,30,0.3) 1px, transparent 1px)',
                                backgroundSize: '48px 48px',
                            }}
                            aria-hidden="true"
                        />

                        <div className="relative mx-auto max-w-[1200px] px-3 pt-12 pb-14 sm:px-6 sm:pt-20 sm:pb-20 lg:px-8">
                            {/* Hero Header & Value Proposition */}
                            <div className="mx-auto max-w-3xl text-center">
                                <p className="mb-3 font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase sm:mb-4 sm:text-[12px]">
                                    PERSONAL JOB-SEARCH MANAGEMENT
                                </p>
                                <h1 className="text-[30px] leading-[1.2] font-semibold tracking-[-0.6px] text-[#ffffff] sm:text-[50px] sm:leading-[1.12] sm:tracking-[-1.8px] lg:text-[60px] lg:tracking-[-2.2px]">
                                    Kendalikan pencarian kerja Anda dari satu
                                    tempat
                                </h1>
                                <p className="mt-4 text-[14px] leading-[1.6] tracking-[-0.17px] text-[#a7a7a7] sm:mt-5 sm:text-[18px] sm:leading-[1.5] sm:tracking-[-0.3px]">
                                    Catat lamaran, jadwalkan interview, terima
                                    triase email rekrutmen, dan persiapkan diri
                                    dengan AI. Semua data milik Anda, semua
                                    keputusan di tangan Anda.
                                </p>
                                <div className="mx-auto mt-6 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                            handleOpenAuth('register')
                                        }
                                    >
                                        Mulai Kelola Karier
                                    </Button>
                                    <a
                                        href="#fitur"
                                        className="w-full sm:w-auto"
                                    >
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="w-full sm:w-auto"
                                        >
                                            Lihat Fitur Lengkap
                                        </Button>
                                    </a>
                                </div>
                            </div>

                            {/* Product Preview Card (Dovetail Command Center Instrument) */}
                            <FadeInWhenVisible
                                delay={0.15}
                                className="mt-10 sm:mt-16"
                            >
                                <div className="mx-auto max-w-4xl rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-1 sm:p-1.5">
                                    <div className="rounded-[6px] border border-[#313131] bg-[#141414] p-3.5 sm:p-6">
                                        {/* Mockup Header Bar */}
                                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#313131] pb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-full bg-[#313131]" />
                                                <div className="h-2.5 w-2.5 rounded-full bg-[#313131]" />
                                                <div className="h-2.5 w-2.5 rounded-full bg-[#313131]" />
                                                <span className="ml-2 font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a] uppercase">
                                                    DASHBOARD PIPELINE
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    LIVE SYNC
                                                </Badge>
                                                <span className="font-mono text-[11px] text-[#8a8a8a]">
                                                    WIB
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mockup Stat Row (3 Columns per DESIGN.md) */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div className="rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-4">
                                                <p className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                                    Lamaran Aktif
                                                </p>
                                                <p className="mt-1 text-[28px] font-semibold tracking-[-0.5px] text-[#ffffff]">
                                                    12
                                                </p>
                                                <p className="text-[12px] text-[#8a8a8a]">
                                                    3 dalam tahap seleksi
                                                </p>
                                            </div>
                                            <div className="rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-4">
                                                <p className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                                    Interview Terdekat
                                                </p>
                                                <p className="mt-1 text-[28px] font-semibold tracking-[-0.5px] text-[#ffffff]">
                                                    2
                                                </p>
                                                <p className="text-[12px] text-[#8a8a8a]">
                                                    Technical interview minggu
                                                    ini
                                                </p>
                                            </div>
                                            <div className="rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-4">
                                                <p className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                                    Target Mingguan
                                                </p>
                                                <p className="mt-1 text-[28px] font-semibold tracking-[-0.5px] text-[#ffffff]">
                                                    4/5
                                                </p>
                                                <p className="text-[12px] text-[#8a8a8a]">
                                                    80% target tercapai
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mockup Activity Rows */}
                                        <div className="mt-4 space-y-2">
                                            <div className="flex flex-col gap-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-[14px] font-medium text-[#ffffff]">
                                                        PT Teknologi Nusantara
                                                    </p>
                                                    <p className="text-[12px] text-[#a7a7a7]">
                                                        Senior Fullstack
                                                        Engineer • Google Meet
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    Interview
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col gap-2 rounded-[6px] border border-[#313131] bg-[#0a0a0a] p-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-[14px] font-medium text-[#ffffff]">
                                                        GoForward Solutions
                                                    </p>
                                                    <p className="text-[12px] text-[#a7a7a7]">
                                                        Backend Developer
                                                        (Laravel) • Assessment
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="warning"
                                                    size="sm"
                                                >
                                                    In Review
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FadeInWhenVisible>
                        </div>
                    </section>

                    {/* ===== INTERACTIVE VELOCITY SCROLL BANNER (ZIG-ZAG MOTION & ADVANCED ADVANTAGES) ===== */}
                    <section
                        aria-label="Keunggulan dan Fitur Mendalam"
                        className="overflow-hidden border-b border-[#313131] bg-[#141414] py-3.5 sm:py-4"
                    >
                        <div className="space-y-1.5 font-mono text-[12px] tracking-[0.85px] uppercase sm:text-[13px]">
                            {/* Baris Atas: Bergerak Mulus ke KANAN */}
                            <VelocityScrollRow
                                baseSpeed={0.65}
                                direction="right"
                            >
                                <div className="flex items-center gap-6 pr-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            DETEKSI DUPLIKASI REAL-TIME:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Cegah melamar posisi dan perusahaan
                                            yang sama berulang kali
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            ALERT STAGNAN 14 HARI:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Pantau lamaran tanpa kabar 2 minggu
                                            plus rekomendasi lowongan baru AI
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            DETEKSI BENTROK KALENDER:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Peringatan otomatis saat jadwal
                                            wawancara saling bertabrakan
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            EKSTRAKSI MEETING & MAPS:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Pilah otomatis link Zoom/Meet online
                                            atau rute Google Maps offline
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            AUTO-MATCHING EMAIL REKRUTMEN:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Pesan Gmail masuk langsung ditautkan
                                            ke lamaran aktif Anda
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            PENGINGAT OTOMATIS H-24 & H-2:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Notifikasi terjadwal sebelum sesi
                                            wawancara dimulai
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>
                                </div>
                            </VelocityScrollRow>

                            {/* Baris Bawah: Bergerak Mulus ke KIRI */}
                            <VelocityScrollRow
                                baseSpeed={0.65}
                                direction="left"
                            >
                                <div className="flex items-center gap-6 pr-6">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            POSTGRESQL RLS ENFORCED:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Supabase Row Level Security aktif di
                                            seluruh tabel database
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            TOKEN ENKRIPSI SERVER-SIDE:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            OAuth Gmail disimpan terenkripsi
                                            dengan izin read-only minimal
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            AUDIT STATUS TRAIL:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Riwayat perubahan status dari
                                            Applied hingga Offer tercatat
                                            permanen
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            IDEMPOTENT RESCHEDULE:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Jadwal interview berubah, reminder
                                            lama otomatis diganti tanpa
                                            duplikasi
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            GRACEFUL DEGRADATION:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Pencatatan lamaran dan kalender
                                            tetap normal saat AI sedang offline
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>

                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[#6798ff]">
                                            PRIVACY BY DESIGN:
                                        </span>
                                        <span className="text-[#ffffff]">
                                            Kendali penuh pengguna untuk
                                            memutuskan koneksi atau hapus akun
                                            kapan saja
                                        </span>
                                    </div>
                                    <span className="text-[#6798ff]">•</span>
                                </div>
                            </VelocityScrollRow>
                        </div>
                    </section>

                    {/* ===== FEATURES SECTION ===== */}
                    <section
                        id="fitur"
                        className="border-b border-[#1e1e1e] py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <FadeInWhenVisible>
                                <p className="mb-3 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    APA YANG BISA ANDA LAKUKAN
                                </p>
                                <h2 className="max-w-2xl text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                    Satu platform untuk seluruh proses pencarian
                                    kerja
                                </h2>
                                <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-[#a7a7a7]">
                                    Dari pencatatan lamaran sampai persiapan
                                    interview, CareerPilot AI membantu Anda
                                    tetap terstruktur tanpa kehilangan kendali.
                                </p>
                            </FadeInWhenVisible>

                            {/* Feature grid: 3 columns on desktop, 1 on mobile */}
                            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((feature, idx) => (
                                    <FadeInWhenVisible
                                        key={feature.title}
                                        delay={idx * 0.06}
                                    >
                                        <div className="group h-full rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-6 transition-colors hover:border-[#454545]">
                                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#313131] bg-[#141414] transition-colors group-hover:border-[#6798ff]/40">
                                                {feature.icon}
                                            </div>
                                            <h3 className="mb-2 text-[16px] font-semibold tracking-[-0.19px] text-[#ffffff]">
                                                {feature.title}
                                            </h3>
                                            <p className="text-[14px] leading-[1.5] text-[#a7a7a7]">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </FadeInWhenVisible>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== HOW IT WORKS SECTION ===== */}
                    <section
                        id="alur-kerja"
                        className="border-b border-[#1e1e1e] bg-[#141414] py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <FadeInWhenVisible>
                                <p className="mb-3 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    ALUR KERJA
                                </p>
                                <h2 className="max-w-2xl text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                    Dari lamaran sampai persiapan interview
                                </h2>
                            </FadeInWhenVisible>

                            {/* Timeline layout: 4 columns on lg, 2 on sm, 1 on xs */}
                            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {steps.map((step, idx) => (
                                    <FadeInWhenVisible
                                        key={step.number}
                                        delay={idx * 0.08}
                                    >
                                        <div className="rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-6">
                                            <span className="font-mono text-[28px] leading-none font-semibold tracking-[-0.84px] text-[#6798ff]">
                                                {step.number}
                                            </span>
                                            <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.19px] text-[#ffffff]">
                                                {step.title}
                                            </h3>
                                            <p className="mt-2 text-[14px] leading-[1.5] text-[#a7a7a7]">
                                                {step.description}
                                            </p>
                                        </div>
                                    </FadeInWhenVisible>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== AI HIGHLIGHT SECTION (Asymmetric 2-column) ===== */}
                    <section
                        id="ai-copilot"
                        className="border-b border-[#1e1e1e] py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                                {/* Left: Copy & Explanations */}
                                <FadeInWhenVisible>
                                    <div>
                                        <Badge variant="accent" size="sm">
                                            AI-ASSISTED
                                        </Badge>
                                        <h2 className="mt-4 text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                            AI membantu, Anda yang memutuskan
                                        </h2>
                                        <p className="mt-4 text-[15px] leading-[1.6] text-[#a7a7a7]">
                                            CareerPilot AI memberikan
                                            rekomendasi, draf roadmap belajar,
                                            simulasi wawancara, dan triase
                                            email. Tetapi setiap keputusan
                                            penting tetap memerlukan konfirmasi
                                            Anda. Tidak ada perubahan status
                                            otomatis tanpa persetujuan.
                                        </p>
                                        <ul className="mt-6 space-y-3">
                                            {[
                                                'Roadmap belajar 3 atau 5 bulan berdasarkan analisis gap skill',
                                                'Simulasi wawancara berbasis deskripsi lowongan nyata',
                                                'Triase email rekrutmen dengan klasifikasi 4 kategori definitif',
                                                'Deteksi lamaran stagnan setelah 2 minggu tanpa ada pembaruan status',
                                            ].map((item) => (
                                                <li
                                                    key={item}
                                                    className="flex items-start gap-2.5"
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#6798ff"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden="true"
                                                        className="mt-0.5 shrink-0"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    <span className="text-[14px] leading-[1.5] text-[#a7a7a7]">
                                                        {item}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </FadeInWhenVisible>

                                {/* Right: AI Output Mockup Card */}
                                <FadeInWhenVisible delay={0.12}>
                                    <div className="rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-1.5">
                                        <div className="rounded-[6px] border border-[#313131] bg-[#141414] p-5 sm:p-6">
                                            <div className="mb-4 flex items-center justify-between border-b border-[#313131] pb-3">
                                                <Badge
                                                    variant="accent"
                                                    size="sm"
                                                >
                                                    AI CAREER PLANNER
                                                </Badge>
                                                <span className="font-mono text-[11px] text-[#8a8a8a]">
                                                    STRUCTURED OUTPUT
                                                </span>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a] uppercase">
                                                        TARGET POSISI
                                                    </p>
                                                    <p className="mt-1 text-[15px] font-medium text-[#ffffff]">
                                                        Senior Fullstack
                                                        Developer (Laravel +
                                                        React)
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a] uppercase">
                                                        GAP SKILL TERDETEKSI
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {[
                                                            'Docker & K8s',
                                                            'Inertia v3 SSR',
                                                            'PostgreSQL RLS',
                                                        ].map((s) => (
                                                            <span
                                                                key={s}
                                                                className="rounded-[4px] border border-[#313131] bg-[#0a0a0a] px-2.5 py-1 font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7]"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a] uppercase">
                                                        MILESTONE BULAN 1
                                                    </p>
                                                    <p className="mt-1 text-[13px] text-[#a7a7a7]">
                                                        Arsitektur
                                                        Microservices, Docker
                                                        containerization, dan
                                                        implementasi Supabase
                                                        Row Level Security.
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-[#313131] pt-3">
                                                    <span className="font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a] uppercase">
                                                        DURASI ROADMAP
                                                    </span>
                                                    <span className="text-[14px] font-semibold text-[#6798ff]">
                                                        3 Bulan Intensif
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeInWhenVisible>
                            </div>
                        </div>
                    </section>

                    {/* ===== RATINGS / SOCIAL PROOF SECTION ===== */}
                    {/* R-17, R-18, R-38: All ratings explicitly marked as placeholder data */}
                    <section
                        id="penilaian"
                        className="border-b border-[#1e1e1e] bg-[#141414] py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <FadeInWhenVisible className="text-center">
                                <p className="mb-3 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    PENILAIAN PENGGUNA
                                </p>
                                <h2 className="mx-auto max-w-2xl text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                    Apa kata mereka yang sudah mencoba
                                </h2>
                                <p className="mx-auto mt-3 max-w-lg text-[14px] text-[#8a8a8a]">
                                    [REAL DATA] Metrik dan ulasan berikut
                                    disiapkan untuk memuat data pengguna nyata
                                </p>
                            </FadeInWhenVisible>

                            {/* Rating Summary Bar */}
                            <FadeInWhenVisible
                                delay={0.1}
                                className="mx-auto mt-10 max-w-md"
                            >
                                <div className="flex flex-col items-center justify-center gap-6 rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-6 sm:flex-row sm:gap-10">
                                    <div className="text-center">
                                        <p className="text-[44px] leading-none font-semibold tracking-[-0.84px] text-[#ffffff]">
                                            [X.X]
                                        </p>
                                        <div className="mt-2 flex items-center justify-center gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <StarIcon
                                                    key={star}
                                                    filled={star <= 4}
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-1 font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a]">
                                            [REAL DATA] RATING
                                        </p>
                                    </div>
                                    <div className="hidden h-12 w-px bg-[#313131] sm:block" />
                                    <div className="text-center">
                                        <p className="text-[44px] leading-none font-semibold tracking-[-0.84px] text-[#ffffff]">
                                            [N]
                                        </p>
                                        <p className="mt-1 text-[13px] text-[#a7a7a7]">
                                            Pengguna Terdaftar
                                        </p>
                                        <p className="font-mono text-[11px] tracking-[0.85px] text-[#8a8a8a]">
                                            [REAL DATA] JUMLAH
                                        </p>
                                    </div>
                                </div>
                            </FadeInWhenVisible>

                            {/* Rating Categories Cards */}
                            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                                {[
                                    {
                                        category: 'Kemudahan Penggunaan',
                                        rating: 0,
                                        label: 'Desain ringkas dan mudah dipahami',
                                    },
                                    {
                                        category: 'Akurasi Rekomendasi AI',
                                        rating: 0,
                                        label: 'Relevansi roadmap dan persiapan interview',
                                    },
                                    {
                                        category: 'Manajemen Waktu',
                                        rating: 0,
                                        label: 'Pengingat otomatis dan jadwal interview',
                                    },
                                ].map((item, idx) => (
                                    <FadeInWhenVisible
                                        key={item.category}
                                        delay={idx * 0.08}
                                    >
                                        <div className="rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-5">
                                            <p className="mb-2 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                                {item.category}
                                            </p>
                                            <StarRating
                                                rating={item.rating}
                                                label="[REAL DATA]"
                                            />
                                            <p className="mt-3 text-[13px] leading-[1.5] text-[#8a8a8a]">
                                                [REAL DATA] {item.label}
                                            </p>
                                        </div>
                                    </FadeInWhenVisible>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== PRINCIPLES SECTION ===== */}
                    <section
                        id="prinsip"
                        className="border-b border-[#1e1e1e] py-20 sm:py-28"
                    >
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <FadeInWhenVisible>
                                <p className="mb-3 font-mono text-[12px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    PRINSIP KAMI
                                </p>
                                <h2 className="max-w-2xl text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                    Privasi dan akurasi data sebagai fondasi
                                </h2>
                            </FadeInWhenVisible>

                            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {[
                                    {
                                        title: 'AI-assisted, bukan AI-controlled',
                                        description:
                                            'AI memberikan rekomendasi dan draf. Keputusan penting seperti perubahan status lamaran dan penjadwalan tetap di tangan Anda.',
                                    },
                                    {
                                        title: 'Akurasi Data Absolut',
                                        description:
                                            'Tidak ada manipulasi atau halusinasi pada status, tanggal, atau metrik analitik. Angka dihitung dari data riil di database Anda.',
                                    },
                                    {
                                        title: 'Tetap Berjalan Tanpa AI',
                                        description:
                                            'Pencatatan lamaran, kalender, dan pengingat tetap berfungsi normal meskipun layanan AI atau integrasi email sedang offline.',
                                    },
                                    {
                                        title: 'Privasi Sejak Awal',
                                        description:
                                            'Akses email minimal (read-only), token OAuth terenkripsi server-side, dan Anda memiliki kendali penuh untuk memutuskan koneksi kapan saja.',
                                    },
                                ].map((principle, idx) => (
                                    <FadeInWhenVisible
                                        key={principle.title}
                                        delay={idx * 0.06}
                                    >
                                        <div className="rounded-[8px] border border-[#313131] bg-[#1e1e1e] p-6">
                                            <h3 className="mb-2 text-[16px] font-semibold tracking-[-0.19px] text-[#ffffff]">
                                                {principle.title}
                                            </h3>
                                            <p className="text-[14px] leading-[1.5] text-[#a7a7a7]">
                                                {principle.description}
                                            </p>
                                        </div>
                                    </FadeInWhenVisible>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ===== FINAL CALL TO ACTION ===== */}
                    <section className="border-b border-[#1e1e1e] bg-[#141414] py-20 sm:py-28">
                        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                            <FadeInWhenVisible className="mx-auto max-w-2xl text-center">
                                <h2 className="text-[28px] leading-[1.25] font-semibold tracking-[-0.5px] text-[#ffffff] sm:text-[38px] sm:tracking-[-0.84px]">
                                    Mulai kelola pencarian kerja Anda hari ini
                                </h2>
                                <p className="mt-3 text-[15px] leading-[1.6] text-[#a7a7a7]">
                                    Daftar gratis, tidak perlu kartu kredit.
                                    Semua fitur inti dapat langsung digunakan.
                                </p>
                                <div className="mx-auto mt-8 flex w-full max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                        onClick={() =>
                                            handleOpenAuth('register')
                                        }
                                    >
                                        Daftar Gratis
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                        onClick={() => handleOpenAuth('login')}
                                    >
                                        Masuk ke Akun
                                    </Button>
                                </div>
                            </FadeInWhenVisible>
                        </div>
                    </section>
                </main>

                {/* ===== FOOTER ===== */}
                <footer className="py-8">
                    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <div className="flex items-center gap-2.5 text-[13px] text-[#8a8a8a]">
                                <span className="font-medium text-[#a7a7a7]">
                                    CareerPilot AI
                                </span>
                                <span>•</span>
                                <span>Personal Job-Search Management</span>
                            </div>
                            <p className="text-[13px] text-[#8a8a8a]">
                                AI-assisted, user-controlled
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Login & Register Authentication Modal */}
            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                initialMode={authModalMode}
            />
        </>
    );
}
