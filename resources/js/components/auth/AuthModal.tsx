import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
    onSuccess?: (user: unknown, token: string) => void;
}

export function AuthModal({
    isOpen,
    onClose,
    initialMode = 'login',
    onSuccess,
}: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);
    const modalRef = useRef<HTMLDivElement>(null);

    // Keep internal mode in sync when initialMode changes or modal reopens
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    // Handle Escape key to close modal (R-32 Keyboard Accessibility)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Prevent background page scrolling
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="auth-modal-title"
                >
                    {/* Backdrop with dark overlay and subtle blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Modal Dialog Card */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 w-full max-w-[480px] rounded-[10px] border border-[#313131] bg-[#141414] p-6 text-[#ffffff] shadow-2xl selection:bg-[#1e1e1e] selection:text-[#6798ff] sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button with accessible >= 44px tap target */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[8px] text-[#7c7c7c] transition-colors hover:bg-[#1e1e1e] hover:text-[#ffffff] focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                            aria-label="Tutup modal autentikasi"
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
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Brand header */}
                        <div className="mb-6">
                            <div className="mb-2 flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[#313131] bg-[#1e1e1e] text-[#6798ff]">
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                        <polyline points="20 17 12 22 2 17" />
                                        <polyline points="2 12 12 17 22 12" />
                                    </svg>
                                </div>
                                <span className="font-mono text-[11px] tracking-[0.85px] text-[#a7a7a7] uppercase">
                                    CareerPilot AI
                                </span>
                            </div>

                            <h2
                                id="auth-modal-title"
                                className="font-sans text-[22px] font-semibold tracking-[-0.4px] text-[#ffffff]"
                            >
                                {mode === 'login'
                                    ? 'Selamat Datang Kembali'
                                    : 'Mulai Kelola Karier Anda'}
                            </h2>
                            <p className="mt-1 font-sans text-[13px] leading-relaxed text-[#a7a7a7]">
                                {mode === 'login'
                                    ? 'Masuk ke akun CareerPilot Anda untuk memantau status lamaran dan persiapan interview.'
                                    : 'Daftar gratis untuk mencatat lamaran, sinkronisasi Gmail rekrutmen, dan copilot AI.'}
                            </p>
                        </div>

                        {/* Mode Tab Switcher */}
                        <div className="mb-6 grid grid-cols-2 rounded-[8px] border border-[#313131] bg-[#0a0a0a] p-1">
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`flex min-h-[40px] items-center justify-center rounded-[6px] text-[13px] font-medium transition-all ${
                                    mode === 'login'
                                        ? 'bg-[#1e1e1e] text-[#ffffff] shadow-sm'
                                        : 'text-[#7c7c7c] hover:text-[#ffffff]'
                                } focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none`}
                                aria-selected={mode === 'login'}
                                role="tab"
                            >
                                Masuk ke Akun
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('register')}
                                className={`flex min-h-[40px] items-center justify-center rounded-[6px] text-[13px] font-medium transition-all ${
                                    mode === 'register'
                                        ? 'bg-[#1e1e1e] text-[#ffffff] shadow-sm'
                                        : 'text-[#7c7c7c] hover:text-[#ffffff]'
                                } focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none`}
                                aria-selected={mode === 'register'}
                                role="tab"
                            >
                                Buat Akun Baru
                            </button>
                        </div>

                        {/* Active Form */}
                        {mode === 'login' ? (
                            <LoginForm
                                onSwitchToRegister={() => setMode('register')}
                                onSuccess={onSuccess}
                            />
                        ) : (
                            <RegisterForm
                                onSwitchToLogin={() => setMode('login')}
                                onSuccess={onSuccess}
                            />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
