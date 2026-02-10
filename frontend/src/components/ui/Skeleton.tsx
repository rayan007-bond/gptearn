'use client';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export default function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
    const baseClasses = 'skeleton animate-pulse';

    const variantClasses = {
        text: 'h-4 w-full rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
        card: 'rounded-2xl',
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
    );
}

export function TaskCardSkeleton() {
    return (
        <div className="card">
            <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" variant="text" />
                    <Skeleton className="h-3 w-full mb-3" variant="text" />
                    <Skeleton className="h-2 w-full" variant="text" />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-16" variant="text" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function BalanceCardSkeleton() {
    return (
        <div className="card">
            <Skeleton className="h-4 w-24 mb-3" variant="text" />
            <Skeleton className="h-8 w-32 mb-1" variant="text" />
            <Skeleton className="h-3 w-20" variant="text" />
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 p-6">
            <Skeleton className="w-24 h-24" variant="circular" />
            <Skeleton className="h-6 w-40" variant="text" />
            <Skeleton className="h-4 w-32" variant="text" />
        </div>
    );
}
