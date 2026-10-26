import React, { useState, useId } from 'react';
import { Button } from '@/components/ui/Button';

interface LoginFormProps {
    onSwitchToRegister: () => void;
    onSuccess?: (user: unknown, token: string) => void;
    initialEmail?: string;
    justRegistered?: boolean;
}

export function LoginForm({
    onSwitchToRegister,
    onSuccess,
    initialEmail = '',
    justRegistered = false,
}: LoginFormProps) {
    const emailId = useId();
    const passwordId = useId();

    // Check URL parameters for registration redirect status
    const urlParams =
        typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search)
            : null;
    const urlRegistered =
        urlParams?.get('registered') === '1' || justRegistered;
    const urlEmail = urlParams?.get('email') || initialEmail;

    const [email, setEmail] = useState(urlEmail);
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [registrationSuccessBanner] = useState(urlRegistered);

    // Track touched fields for reactive validation
    const [touched, setTouched] = useState<{
        email?: boolean;
        password?: boolean;
    }>({});

    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverFieldErrors, setServerFieldErrors] = useState<
        Record<string, string[]>
    >({});
    const [isSuccess, setIsSuccess] = useState(false);

    // Reactive validation logic
    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isPasswordLengthValid = password.length >= 8;

    const emailError =
        touched.email && email.trim().length === 0
            ? 'Email wajib diisi.'
            : touched.email && !isEmailFormatValid
              ? 'Format email tidak valid (contoh: user@domain.com).'
              : serverFieldErrors.email?.[0] || null;

    const passwordError =
        touched.password && password.length === 0
            ? 'Password wajib diisi.'
            : touched.password && !isPasswordLengthValid
              ? 'Password minimal 8 karakter.'
              : serverFieldErrors.password?.[0] || null;

    const isFormValid = isEmailFormatValid && isPasswordLengthValid;

    const handleBlur = (field: 'email' | 'password') => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        setServerError(null);
        setServerFieldErrors({});

        if (!isFormValid) {
            return;
        }

        setIsLoading(true);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';

            const response = await fetch('/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                    device_name: 'browser-web',
                    remember: rememberMe,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    if (data.errors) {
                        setServerFieldErrors(data.errors);
                        // Also show top message if available
                        const firstMsg =
                            data.errors.email?.[0] ||
                            data.errors.password?.[0] ||
                            data.message;
                        setServerError(firstMsg || 'Kredensial tidak valid.');
                    } else {
                        setServerError(
                            data.message ||
                                'Kredensial yang diberikan tidak cocok dengan data kami.',
                        );
                    }
                } else {
                    setServerError(
                        data.message ||
                            'Gagal masuk ke akun. Silakan coba lagi beberapa saat lagi.',
                    );
                }
                setIsLoading(false);
                return;
            }

            // Success
            setIsSuccess(true);
            if (data.token) {
                localStorage.setItem('careerpilot_token', data.token);
            }

            if (onSuccess) {
                onSuccess(data.data, data.token);
            }

            // Redirect smoothly to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 800);
        } catch {
            setServerError(
                'Koneksi gagal. Periksa koneksi internet Anda dan coba lagi.',
            );
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Registration Success Banner */}
            {registrationSuccessBanner && (
                <div
                    className="flex items-start gap-2.5 rounded-[8px] border border-[#34d399]/40 bg-[#34d399]/10 p-3 text-[13px] text-[#34d399]"
                    role="status"
                >
                    <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <div>
                        <span className="font-semibold">
                            Pendaftaran akun berhasil!
                        </span>{' '}
                        Silakan masukkan kata sandi akun Anda untuk masuk ke
                        sistem.
                    </div>
                </div>
            )}

            {/* Server Error Alert Banner */}
            {serverError && (
                <div
                    className="flex items-start gap-2.5 rounded-[8px] border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-[13px] text-[#f87171]"
                    role="alert"
                >
                    <svg
                        className="mt-0.5 h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{serverError}</span>
                </div>
            )}

            {/* Success Notification Banner */}
            {isSuccess && (
                <div
                    className="flex items-center gap-2.5 rounded-[8px] border border-[#34d399]/40 bg-[#34d399]/10 p-3 text-[13px] text-[#34d399]"
                    role="status"
                >
                    <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Login berhasil! Mengalihkan ke dashboard...</span>
                </div>
            )}

            {/* Field: Email */}
            <div className="space-y-1.5">
                <label
                    htmlFor={emailId}
                    className="block font-sans text-[13px] font-medium text-[#a7a7a7]"
                >
                    Email <span className="text-[#f87171]">*</span>
                </label>
                <div className="relative">
                    <input
                        id={emailId}
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (serverFieldErrors.email) {
                                setServerFieldErrors((prev) => ({
                                    ...prev,
                                    email: [],
                                }));
                            }
                            if (serverError) setServerError(null);
                        }}
                        onBlur={() => handleBlur('email')}
                        placeholder="nama@email.com"
                        disabled={isLoading || isSuccess}
                        className={`min-h-[44px] w-full rounded-[8px] border bg-[#141414] px-3.5 py-2.5 font-sans text-[14px] text-[#ffffff] placeholder-[#7c7c7c] transition-colors focus:ring-1 focus:outline-none ${
                            emailError
                                ? 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]'
                                : touched.email && isEmailFormatValid
                                  ? 'border-[#34d399] focus:border-[#34d399] focus:ring-[#34d399]'
                                  : 'border-[#454545] focus:border-[#6798ff] focus:ring-[#6798ff]'
                        }`}
                        aria-invalid={!!emailError}
                        aria-describedby={
                            emailError ? `${emailId}-error` : undefined
                        }
                    />
                    {touched.email &&
                        isEmailFormatValid &&
                        !serverFieldErrors.email?.[0] && (
                            <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[#34d399]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                        )}
                </div>
                {emailError && (
                    <p
                        id={`${emailId}-error`}
                        className="font-sans text-[12px] text-[#f87171]"
                    >
                        {emailError}
                    </p>
                )}
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label
                        htmlFor={passwordId}
                        className="block font-sans text-[13px] font-medium text-[#a7a7a7]"
                    >
                        Password <span className="text-[#f87171]">*</span>
                    </label>
                </div>
                <div className="relative">
                    <input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (serverFieldErrors.password) {
                                setServerFieldErrors((prev) => ({
                                    ...prev,
                                    password: [],
                                }));
                            }
                            if (serverError) setServerError(null);
                        }}
                        onBlur={() => handleBlur('password')}
                        placeholder="Masukkan password Anda..."
                        disabled={isLoading || isSuccess}
                        className={`min-h-[44px] w-full rounded-[8px] border bg-[#141414] py-2.5 pr-11 pl-3.5 font-sans text-[14px] text-[#ffffff] placeholder-[#7c7c7c] transition-colors focus:ring-1 focus:outline-none ${
                            passwordError
                                ? 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]'
                                : touched.password && isPasswordLengthValid
                                  ? 'border-[#34d399] focus:border-[#34d399] focus:ring-[#34d399]'
                                  : 'border-[#454545] focus:border-[#6798ff] focus:ring-[#6798ff]'
                        }`}
                        aria-invalid={!!passwordError}
                        aria-describedby={
                            passwordError ? `${passwordId}-error` : undefined
                        }
                    />
                    {/* Eye toggle button */}
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 right-2.5 flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-[6px] text-[#7c7c7c] transition-colors hover:text-[#ffffff] focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                        aria-label={
                            showPassword
                                ? 'Sembunyikan password'
                                : 'Tampilkan password'
                        }
                    >
                        {showPassword ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        )}
                    </button>
                </div>
                {passwordError && (
                    <p
                        id={`${passwordId}-error`}
                        className="font-sans text-[12px] text-[#f87171]"
                    >
                        {passwordError}
                    </p>
                )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-[13px]">
                <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-[4px] border-[#454545] bg-[#141414] text-[#6798ff] focus:ring-[#6798ff] focus:ring-offset-[#0a0a0a]"
                    />
                    <span className="text-[#a7a7a7] transition-colors hover:text-[#ffffff]">
                        Ingat sesi saya
                    </span>
                </label>
            </div>

            {/* Action Button: Masuk */}
            <div className="pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!isFormValid || isLoading || isSuccess}
                    isLoading={isLoading}
                >
                    {isLoading ? 'Memverifikasi...' : 'Masuk ke Akun'}
                </Button>
            </div>

            {/* Switch to Register footer */}
            <div className="pt-2 text-center">
                <p className="font-sans text-[13px] text-[#a7a7a7]">
                    Belum memiliki akun?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="rounded-[4px] px-1 font-medium text-[#6798ff] hover:underline focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                    >
                        Daftar Gratis
                    </button>
                </p>
            </div>
        </form>
    );
}
