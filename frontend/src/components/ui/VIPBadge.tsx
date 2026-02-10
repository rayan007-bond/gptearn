'use client';

import { Crown } from 'lucide-react';

interface VIPBadgeProps {
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export default function VIPBadge({ name = 'VIP', size = 'md', showLabel = true }: VIPBadgeProps) {
    const sizeClasses = {
        sm: 'text-xs py-0.5 px-2',
        md: 'text-sm py-1 px-3',
        lg: 'text-base py-1.5 px-4',
    };

    const iconSizes = {
        sm: 12,
        md: 14,
        lg: 18,
    };

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-full gradient-gold ${sizeClasses[size]}`}>
            <Crown size={iconSizes[size]} className="text-white" />
            {showLabel && (
                <span className="font-bold text-white">{name}</span>
            )}
        </div>
    );
}
