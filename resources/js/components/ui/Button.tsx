import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            disabled = false,
            type = 'button',
            ...props
        },
        ref
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center font-medium font-sans rounded-[8px] transition-colors transition-opacity select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6798ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]';

        const sizeStyles = {
            sm: 'text-[12px] h-[36px] px-3 gap-1.5',
            md: 'text-[14px] min-h-[44px] px-4 py-2.5 gap-2',
            lg: 'text-[16px] min-h-[48px] px-5 py-3 gap-2.5',
        };

        const variantStyles = {
            // White filled button: Primary action CTA, no border, no shadow (DESIGN.md)
            primary:
                'bg-[#ffffff] text-[#0a0a0a] hover:bg-[#ffffff]/90 active:bg-[#ffffff]/80',
            // Dark outlined button: Secondary action, 1px border at #454545 (DESIGN.md)
            secondary:
                'bg-[#0a0a0a] text-[#ffffff] border border-[#454545] hover:bg-[#1e1e1e] hover:border-[#7c7c7c]',
            // Ghost button: Utility actions like top bar login (DESIGN.md)
            ghost:
                'bg-transparent text-[#a7a7a7] hover:text-[#ffffff] hover:bg-[#1e1e1e]',
            // Danger button: Destructive actions
            danger:
                'bg-transparent text-[#f87171] border border-[#7f1d1d] hover:bg-[#7f1d1d]/20',
        };

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled || isLoading}
                className={twMerge(
                    clsx(
                        baseStyles,
                        sizeStyles[size],
                        variantStyles[variant],
                        className
                    )
                )}
                {...props}
            >
                {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                        <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Memproses...</span>
                    </span>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
