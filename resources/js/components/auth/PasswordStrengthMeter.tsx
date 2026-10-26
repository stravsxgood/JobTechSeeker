import React from 'react';

export interface PasswordCriteriaState {
    hasMinLength: boolean;
    hasSpecialChar: boolean;
    hasMixedCase: boolean;
    allMet: boolean;
}

export function evaluatePassword(password: string): {
    score: number;
    label: string;
    color: string;
    criteria: PasswordCriteriaState;
} {
    const hasMinLength = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>[\]\\/'`~_+=;-]/.test(
        password,
    );
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasBonusLength = password.length >= 12;

    const allMet = hasMinLength && hasSpecialChar && hasMixedCase;

    if (password.length === 0) {
        return {
            score: 0,
            label: 'Belum diisi',
            color: '#454545',
            criteria: { hasMinLength, hasSpecialChar, hasMixedCase, allMet },
        };
    }

    // Hitung poin kekuatan (0 - 4)
    let rawScore = 0;
    if (hasMinLength) rawScore += 1;
    if (hasSpecialChar) rawScore += 1;
    if (hasMixedCase) rawScore += 1;
    if (hasNumber || hasBonusLength) rawScore += 1;

    let score = rawScore;
    // Jika belum memenuhi 3 kriteria wajib, batasi maksimal skor 2 (Lemah)
    if (!allMet && score > 2) {
        score = 2;
    }

    let label = 'Sangat Lemah';
    let color = '#f87171'; // Red

    if (score === 2) {
        label = 'Lemah';
        color = '#fb923c'; // Orange
    } else if (score === 3) {
        label = 'Sedang';
        color = '#facc15'; // Yellow
    } else if (score >= 4) {
        label = 'Kuat';
        color = '#34d399'; // Emerald
    }

    return {
        score,
        label,
        color,
        criteria: {
            hasMinLength,
            hasSpecialChar,
            hasMixedCase,
            allMet,
        },
    };
}

interface PasswordStrengthMeterProps {
    password: string;
    className?: string;
}

export function PasswordStrengthMeter({
    password,
    className = '',
}: PasswordStrengthMeterProps) {
    const { score, label, color, criteria } = evaluatePassword(password);
    const hasInput = password.length > 0;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Header label & Strength indicator */}
            <div className="flex items-center justify-between text-[12px]">
                <span className="font-sans text-[#a7a7a7]">
                    Kekuatan Password:
                </span>
                <span
                    className="font-mono text-[11px] font-semibold tracking-[0.5px] uppercase transition-colors"
                    style={{ color: hasInput ? color : '#7c7c7c' }}
                >
                    {hasInput ? label : '—'}
                </span>
            </div>

            {/* 4-Segment Strength Bar */}
            <div
                className="grid grid-cols-4 gap-1.5"
                role="progressbar"
                aria-valuenow={score}
                aria-valuemin={0}
                aria-valuemax={4}
            >
                {[1, 2, 3, 4].map((step) => {
                    const isFilled = hasInput && score >= step;
                    return (
                        <div
                            key={step}
                            className="h-1.5 rounded-[2px] transition-all duration-200"
                            style={{
                                backgroundColor: isFilled ? color : '#313131',
                            }}
                        />
                    );
                })}
            </div>

            {/* 3 Mandatory Criteria Checklist */}
            <div className="space-y-1.5 rounded-[6px] border border-[#313131] bg-[#101010] p-2.5">
                <p className="mb-1 font-mono text-[10px] tracking-[0.8px] text-[#7c7c7c] uppercase">
                    3 Kriteria Wajib:
                </p>

                {/* 1. Minimal 8 Karakter */}
                <CriteriaItem
                    isMet={criteria.hasMinLength}
                    text="Minimal 8 karakter"
                />

                {/* 2. Karakter Khusus */}
                <CriteriaItem
                    isMet={criteria.hasSpecialChar}
                    text="Karakter khusus (!@#$%^&* dll)"
                />

                {/* 3. Huruf Besar dan Huruf Kecil */}
                <CriteriaItem
                    isMet={criteria.hasMixedCase}
                    text="Huruf Besar (A-Z) dan Huruf Kecil (a-z)"
                />
            </div>
        </div>
    );
}

function CriteriaItem({ isMet, text }: { isMet: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2 font-sans text-[12px]">
            <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                    isMet
                        ? 'border-[#34d399] bg-[#34d399]/15 text-[#34d399]'
                        : 'border-[#454545] bg-[#1e1e1e] text-transparent'
                }`}
                aria-hidden="true"
            >
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </span>
            <span
                className={`transition-colors ${
                    isMet ? 'text-[#ffffff]' : 'text-[#7c7c7c]'
                }`}
            >
                {text}
            </span>
        </div>
    );
}
