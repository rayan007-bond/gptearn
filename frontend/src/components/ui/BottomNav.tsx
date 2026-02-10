'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, DollarSign, Star, Users, User } from 'lucide-react';

const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/earn', icon: DollarSign, label: 'Earn' },
    { href: '/vip', icon: Star, label: 'VIP' },
    { href: '/referrals', icon: Users, label: 'Referrals' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] border-t border-[var(--card-border)] bottom-nav">
            <div className="max-w-[480px] mx-auto">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${isActive
                                        ? 'text-[var(--primary)]'
                                        : 'text-[var(--muted)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                <div className={`relative p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-[var(--primary)]/10' : ''
                                    }`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    {isActive && (
                                        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[var(--primary)] rounded-full" />
                                    )}
                                </div>
                                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-semibold' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
