import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
    size?: 'sm' | 'md';
}

export function Badge({
    children,
    className,
    variant = 'default',
    size = 'md',
    ...props
}: BadgeProps) {
    const baseStyles =
        'inline-flex items-center font-mono font-normal uppercase rounded-[4px] select-none border transition-colors';

    const sizeStyles = {
        sm: 'text-[11px] leading-[1] px-1.5 py-0.5 tracking-[0.85px]',
        md: 'text-[12px] leading-[1.2] px-2 py-1 tracking-[0.85px]',
    };

    const variantStyles = {
        default: 'bg-[#1e1e1e] text-[#a7a7a7] border-[#313131]',
        accent: 'bg-[#141414] text-[#6798ff] border-[#313131]',
        success: 'bg-[#141414] text-[#34d399] border-[#1e3a2f]',
        warning: 'bg-[#141414] text-[#fbbf24] border-[#3d2f14]',
        danger: 'bg-[#141414] text-[#f87171] border-[#3b1c1c]',
    };

    return (
        <span
            className={twMerge(
                clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
            )}
            {...props}
        >
            {children}
        </span>
    );
}
