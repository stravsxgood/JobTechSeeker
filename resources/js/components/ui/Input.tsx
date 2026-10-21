import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, label, id, disabled, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-[13px] font-medium text-[#a7a7a7] font-sans"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    className={twMerge(
                        clsx(
                            // Dovetail Input styling: 8px radius, Deep Coal #141414 background, Graphite #454545 border
                            'w-full min-h-[44px] rounded-[8px] bg-[#141414] border border-[#454545] px-3.5 py-2.5 text-[14px] text-[#ffffff] placeholder-[#7c7c7c] font-sans transition-colors',
                            'focus:border-[#6798ff] focus:outline-none focus:ring-1 focus:ring-[#6798ff]',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            error && 'border-[#f87171] focus:border-[#f87171] focus:ring-[#f87171]',
                            className
                        )
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-[12px] text-[#f87171] font-sans">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
