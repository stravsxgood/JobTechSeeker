import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'carbon' | 'coal' | 'flat';
}

export function Card({
    children,
    className,
    variant = 'carbon',
    ...props
}: CardProps) {
    const variantStyles = {
        // Surface 2: Card Carbon #1e1e1e with 1px border at #313131, zero shadows (DESIGN.md)
        carbon: 'bg-[#1e1e1e] border border-[#313131] rounded-[8px]',
        // Surface 1: Deep Coal #141414 for nested cards/insets
        coal: 'bg-[#141414] border border-[#313131] rounded-[8px]',
        // Surface 0: Border only
        flat: 'bg-transparent border border-[#313131] rounded-[8px]',
    };

    return (
        <div
            className={twMerge(clsx(variantStyles[variant], 'text-[#ffffff]', className))}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={twMerge(
                clsx('flex flex-col space-y-1.5 p-6 border-b border-[#313131]', className)
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={twMerge(
                clsx(
                    'text-[18px] font-semibold tracking-[-0.3px] text-[#ffffff] font-sans',
                    className
                )
            )}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={twMerge(clsx('text-[14px] text-[#a7a7a7] font-sans', className))}
            {...props}
        >
            {children}
        </p>
    );
}

export function CardContent({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={twMerge(clsx('p-6', className))} {...props}>
            {children}
        </div>
    );
}

export function CardFooter({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={twMerge(
                clsx('flex items-center p-6 pt-0 border-t border-[#313131]', className)
            )}
            {...props}
        >
            {children}
        </div>
    );
}
