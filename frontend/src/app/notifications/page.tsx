'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import BottomNav from '@/components/ui/BottomNav';
import { api } from '@/lib/api';
import {
    ArrowLeft, Bell, Check, Trash2,
    DollarSign, Crown, Gift, AlertCircle
} from 'lucide-react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

const typeIcons: Record<string, any> = {
    earning: DollarSign,
    vip: Crown,
    referral: Gift,
    system: AlertCircle,
    withdrawal: DollarSign,
};

const typeColors: Record<string, string> = {
    earning: 'bg-green-500/10 text-green-500',
    vip: 'bg-amber-500/10 text-amber-500',
    referral: 'bg-purple-500/10 text-purple-500',
    system: 'bg-blue-500/10 text-blue-500',
    withdrawal: 'bg-green-500/10 text-green-500',
};

export default function NotificationsPage() {
    const router = useRouter();
    const { token, isLoading, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/notifications');
            return;
        }

        if (token) {
            loadNotifications();
        }
    }, [isLoading, isAuthenticated, token, router]);

    const loadNotifications = async () => {
        try {
            const data = await api.getNotifications(token!);
            setNotifications(data.notifications);
            // Count unread from notifications
            const unread = data.notifications.filter((n: Notification) => !n.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await api.markNotificationRead(token!, id.toString());
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            showToast('Failed to mark as read', 'error');
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead(token!);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading || isLoadingData) {
        return (
            <div className="mobile-container flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="mobile-container">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-xl font-bold">Notifications</h1>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-[var(--primary)] font-medium"
                        >
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            <main className="p-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-[var(--muted)]">
                        <Bell size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No notifications yet</p>
                        <p className="text-sm">We'll let you know when something happens</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => {
                            const Icon = typeIcons[notification.type] || Bell;
                            const colorClass = typeColors[notification.type] || 'bg-gray-500/10 text-gray-500';

                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    className={`w-full card text-left transition-all ${!notification.is_read ? 'border-[var(--primary)]/30 bg-[var(--primary)]/5' : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`p-2 rounded-xl ${colorClass}`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`font-medium truncate ${!notification.is_read ? 'font-semibold' : ''}`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--muted)] line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-[var(--muted)] mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
}
