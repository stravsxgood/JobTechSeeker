import React, { useState, useId } from 'react';
import { Button } from '@/components/ui/Button';
import {
    PasswordStrengthMeter,
    evaluatePassword,
} from './PasswordStrengthMeter';

interface RegisterFormProps {
    onSwitchToLogin: () => void;
    onSuccess?: (user: unknown, token: string) => void;
}

export function RegisterForm({
    onSwitchToLogin,
    onSuccess,
}: RegisterFormProps) {
    const nameId = useId();
    const emailId = useId();
    const passwordId = useId();
    const confirmPasswordId = useId();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Track touched fields for reactive error display
    const [touched, setTouched] = useState<{
        name?: boolean;
        email?: boolean;
        password?: boolean;
        passwordConfirmation?: boolean;
    }>({});

    const [isLoading, setIsLoading] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string[]>>(
        {},
    );
    const [serverGeneralError, setServerGeneralError] = useState<string | null>(
        null,
    );
    const [isSuccess, setIsSuccess] = useState(false);

    // Reactive validation logic
    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isNameValid = name.trim().length >= 2;
    const { criteria: passwordCriteria } = evaluatePassword(password);
    const isPasswordAllCriteriaMet = passwordCriteria.allMet;
    const isPasswordMatching =
        password.length > 0 &&
        passwordConfirmation.length > 0 &&
        password === passwordConfirmation;

    // Field reactive error messages
    const nameError =
        touched.name && name.trim().length === 0
            ? 'Nama lengkap wajib diisi.'
            : touched.name && name.trim().length < 2
              ? 'Nama minimal 2 karakter.'
              : serverErrors.name?.[0] || null;

    const emailError =
        touched.email && email.trim().length === 0
            ? 'Email wajib diisi.'
            : touched.email && !isEmailFormatValid
              ? 'Format email tidak valid (contoh: user@domain.com).'
              : serverErrors.email?.[0] || null;

    const passwordError =
        touched.password && password.length === 0
            ? 'Password wajib diisi.'
            : touched.password && !isPasswordAllCriteriaMet
              ? 'Password harus memenuhi 3 kriteria wajib di bawah.'
              : serverErrors.password?.[0] || null;

    const confirmationError =
        touched.passwordConfirmation && passwordConfirmation.length === 0
            ? 'Konfirmasi password wajib diisi.'
            : touched.passwordConfirmation && !isPasswordMatching
              ? 'Konfirmasi password tidak cocok dengan password di atas.'
              : serverErrors.password_confirmation?.[0] || null;

    const isFormValid =
        isNameValid &&
        isEmailFormatValid &&
        isPasswordAllCriteriaMet &&
        isPasswordMatching;

    const handleBlur = (
        field: 'name' | 'email' | 'password' | 'passwordConfirmation',
    ) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({
            name: true,
            email: true,
            password: true,
            passwordConfirmation: true,
        });
        setServerErrors({});
        setServerGeneralError(null);

        if (!isFormValid) {
            return;
        }

        setIsLoading(true);

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') || '';
            const timezone =
                Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone ||
                'Asia/Jakarta';
            const locale = navigator?.language || 'id-ID';

            const response = await fetch('/api/v1/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    password_confirmation: passwordConfirmation,
                    timezone,
                    locale,
                    device_name: 'browser-web',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.errors) {
                    setServerErrors(data.errors);
                } else {
                    setServerGeneralError(
                        data.message ||
                            'Terjadi kesalahan saat pendaftaran. Silakan coba lagi.',
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

            // Redirect smoothly to dashboard after a short notification delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch {
            setServerGeneralError(
                'Koneksi gagal. Periksa koneksi internet Anda dan coba lagi.',
            );
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Server Error Alert Banner */}
            {serverGeneralError && (
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
                    <span>{serverGeneralError}</span>
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
                    <span>
                        Registrasi berhasil! Mengalihkan ke dashboard Anda...
                    </span>
                </div>
            )}

            {/* Field: Nama Lengkap */}
            <div className="space-y-1.5">
                <label
                    htmlFor={nameId}
                    className="block font-sans text-[13px] font-medium text-[#a7a7a7]"
                >
                    Nama Lengkap <span className="text-[#f87171]">*</span>
                </label>
                <div className="relative">
                    <input
                        id={nameId}
                        type="text"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (serverErrors.name) {
                                setServerErrors((prev) => ({
                                    ...prev,
                                    name: [],
                                }));
                            }
                        }}
                        onBlur={() => handleBlur('name')}
                        placeholder="Contoh: Budi Santoso"
                        disabled={isLoading || isSuccess}
                        className={`min-h-[44px] w-full rounded-[8px] border bg-[#141414] px-3.5 py-2.5 font-sans text-[14px] text-[#ffffff] placeholder-[#7c7c7c] transition-colors focus:ring-1 focus:outline-none ${
                            nameError
                                ? 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]'
                                : touched.name && isNameValid
                                  ? 'border-[#34d399] focus:border-[#34d399] focus:ring-[#34d399]'
                                  : 'border-[#454545] focus:border-[#6798ff] focus:ring-[#6798ff]'
                        }`}
                        aria-invalid={!!nameError}
                        aria-describedby={
                            nameError ? `${nameId}-error` : undefined
                        }
                    />
                    {touched.name && isNameValid && (
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
                {nameError && (
                    <p
                        id={`${nameId}-error`}
                        className="font-sans text-[12px] text-[#f87171]"
                    >
                        {nameError}
                    </p>
                )}
            </div>

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
                            if (serverErrors.email) {
                                setServerErrors((prev) => ({
                                    ...prev,
                                    email: [],
                                }));
                            }
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
                        !serverErrors.email?.[0] && (
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
                <label
                    htmlFor={passwordId}
                    className="block font-sans text-[13px] font-medium text-[#a7a7a7]"
                >
                    Password <span className="text-[#f87171]">*</span>
                </label>
                <div className="relative">
                    <input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (serverErrors.password) {
                                setServerErrors((prev) => ({
                                    ...prev,
                                    password: [],
                                }));
                            }
                        }}
                        onBlur={() => handleBlur('password')}
                        placeholder="Minimal 8 karakter unik..."
                        disabled={isLoading || isSuccess}
                        className={`min-h-[44px] w-full rounded-[8px] border bg-[#141414] py-2.5 pr-11 pl-3.5 font-sans text-[14px] text-[#ffffff] placeholder-[#7c7c7c] transition-colors focus:ring-1 focus:outline-none ${
                            passwordError
                                ? 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]'
                                : touched.password && isPasswordAllCriteriaMet
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

                {/* Reactive Password Strength Meter & Criteria checklist */}
                <PasswordStrengthMeter password={password} className="pt-1.5" />
            </div>

            {/* Field: Konfirmasi Password */}
            <div className="space-y-1.5">
                <label
                    htmlFor={confirmPasswordId}
                    className="block font-sans text-[13px] font-medium text-[#a7a7a7]"
                >
                    Konfirmasi Password{' '}
                    <span className="text-[#f87171]">*</span>
                </label>
                <div className="relative">
                    <input
                        id={confirmPasswordId}
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={(e) => {
                            setPasswordConfirmation(e.target.value);
                            if (serverErrors.password_confirmation) {
                                setServerErrors((prev) => ({
                                    ...prev,
                                    password_confirmation: [],
                                }));
                            }
                        }}
                        onBlur={() => handleBlur('passwordConfirmation')}
                        placeholder="Ketik ulang password..."
                        disabled={isLoading || isSuccess}
                        className={`min-h-[44px] w-full rounded-[8px] border bg-[#141414] py-2.5 pr-11 pl-3.5 font-sans text-[14px] text-[#ffffff] placeholder-[#7c7c7c] transition-colors focus:ring-1 focus:outline-none ${
                            confirmationError
                                ? 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]'
                                : touched.passwordConfirmation &&
                                    isPasswordMatching
                                  ? 'border-[#34d399] focus:border-[#34d399] focus:ring-[#34d399]'
                                  : 'border-[#454545] focus:border-[#6798ff] focus:ring-[#6798ff]'
                        }`}
                        aria-invalid={!!confirmationError}
                        aria-describedby={
                            confirmationError
                                ? `${confirmPasswordId}-error`
                                : undefined
                        }
                    />
                    {/* Eye toggle button */}
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute top-1/2 right-2.5 flex min-h-[36px] min-w-[36px] -translate-y-1/2 items-center justify-center rounded-[6px] text-[#7c7c7c] transition-colors hover:text-[#ffffff] focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                        aria-label={
                            showConfirmPassword
                                ? 'Sembunyikan konfirmasi password'
                                : 'Tampilkan konfirmasi password'
                        }
                    >
                        {showConfirmPassword ? (
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

                {/* Match indicator or error */}
                {confirmationError && (
                    <p
                        id={`${confirmPasswordId}-error`}
                        className="font-sans text-[12px] text-[#f87171]"
                    >
                        {confirmationError}
                    </p>
                )}
                {touched.passwordConfirmation && isPasswordMatching && (
                    <p className="flex items-center gap-1.5 font-sans text-[12px] text-[#34d399]">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Password cocok</span>
                    </p>
                )}
            </div>

            {/* Action Button: Daftar */}
            <div className="pt-2">
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={!isFormValid || isLoading || isSuccess}
                    isLoading={isLoading}
                >
                    {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
                </Button>
            </div>

            {/* Switch to Login footer */}
            <div className="pt-2 text-center">
                <p className="font-sans text-[13px] text-[#a7a7a7]">
                    Sudah memiliki akun?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="rounded-[4px] px-1 font-medium text-[#6798ff] hover:underline focus-visible:ring-1 focus-visible:ring-[#6798ff] focus-visible:outline-none"
                    >
                        Masuk di sini
                    </button>
                </p>
            </div>
        </form>
    );
}
