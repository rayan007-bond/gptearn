'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
    Users, DollarSign, Clock, Crown,
    TrendingUp, Wallet, ChevronRight, LogOut,
    LayoutDashboard, ListTodo, UserCog, CreditCard, Settings, Send
} from 'lucide-react';

interface DashboardStats {
    users: { total: number; active: number; today: number };
    earnings: { total: number; today: number };
    withdrawals: { total: number; pending: number; totalPaid: number };
    vipActive: number;
    recentUsers: any[];
    pendingWithdrawals: any[];
}

const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/tasks', icon: ListTodo, label: 'Tasks' },
    { href: '/admin/users', icon: UserCog, label: 'Users' },
    { href: '/admin/withdrawals', icon: CreditCard, label: 'Withdrawals' },
    { href: '/admin/vip-requests', icon: Crown, label: 'VIP Requests' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminDashboard() {
    const router = useRouter();
    const { showToast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Broadcast State
    const [broadcastTitle, setBroadcastTitle] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadStats(token);
    }, [router]);

    const loadStats = async (token: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to load dashboard');
            }

            const data = await response.json();
            setStats(data);
        } catch (error) {
            showToast('Failed to load dashboard', 'error');
            router.push('/admin');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBroadcast = async () => {
        if (!broadcastTitle || !broadcastMessage) {
            showToast('Title and message are required', 'error');
            return;
        }

        const confirmSend = window.confirm('Are you sure you want to send this message to ALL users?');
        if (!confirmSend) return;

        const token = localStorage.getItem('adminToken');
        if (!token) return;

        setIsBroadcasting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/notify-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    type: 'info'
                }),
            });

            if (!response.ok) throw new Error('Failed to broadcast');

            showToast('Broadcast sent successfully', 'success');
            setBroadcastTitle('');
            setBroadcastMessage('');
        } catch (error) {
            showToast('Failed to send broadcast', 'error');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        router.push('/admin');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--card-bg)] border-r border-[var(--card-border)] p-4 hidden md:block">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <span className="text-xl">💰</span>
                    </div>
                    <div>
                        <h1 className="font-bold">GPT Earn</h1>
                        <p className="text-xs text-[var(--muted)]">Admin Panel</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === '/admin/dashboard';
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                    : 'text-[var(--muted)] hover:bg-[var(--card-border)]'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <button
                    onClick={handleLogout}
                    className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-4 md:p-8">
                <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <Users size={20} className="text-blue-500" />
                            <span className="text-xs text-[var(--muted)]">+{stats?.users.today} today</span>
                        </div>
                        <div className="text-2xl font-bold">{stats?.users.total}</div>
                        <div className="text-sm text-[var(--muted)]">Total Users</div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign size={20} className="text-green-500" />
                            <span className="text-xs text-[var(--success)]">+${stats?.earnings.today.toFixed(2)}</span>
                        </div>
                        <div className="text-2xl font-bold">${stats?.earnings.total.toFixed(2)}</div>
                        <div className="text-sm text-[var(--muted)]">Total Paid Out</div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <Clock size={20} className="text-amber-500" />
                            <span className="text-xs text-amber-500">{stats?.withdrawals.pending} pending</span>
                        </div>
                        <div className="text-2xl font-bold">{stats?.withdrawals.total}</div>
                        <div className="text-sm text-[var(--muted)]">Withdrawals</div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between mb-2">
                            <Crown size={20} className="text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold">{stats?.vipActive}</div>
                        <div className="text-sm text-[var(--muted)]">Active VIPs</div>
                    </div>
                </div>

                {/* Broadcast Box */}
                <div className="card mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Send size={20} className="text-blue-500" />
                        </div>
                        <h2 className="font-semibold">Broadcast Message</h2>
                    </div>
                    <div className="space-y-4">
                        <input
                            value={broadcastTitle}
                            onChange={(e) => setBroadcastTitle(e.target.value)}
                            className="input w-full"
                            placeholder="Message Title"
                        />
                        <div className="flex gap-4">
                            <textarea
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="input flex-1 min-h-[50px] resize-none py-2"
                                placeholder="Write your message to all users here..."
                            />
                            <button
                                onClick={handleBroadcast}
                                disabled={isBroadcasting}
                                className="btn btn-primary px-6"
                            >
                                {isBroadcasting ? 'Sending...' : 'Send to All'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Recent Users</h2>
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="text-sm text-[var(--primary)]"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {stats?.recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center font-bold text-[var(--primary)]">
                                        {user.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{user.username}</div>
                                        <div className="text-xs text-[var(--muted)]">{user.email}</div>
                                    </div>
                                    <div className="text-xs text-[var(--muted)]">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Withdrawals */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold">Pending Withdrawals</h2>
                            <button
                                onClick={() => router.push('/admin/withdrawals')}
                                className="text-sm text-[var(--primary)]"
                            >
                                View All
                            </button>
                        </div>
                        <div className="space-y-3">
                            {stats?.pendingWithdrawals.length === 0 ? (
                                <p className="text-sm text-[var(--muted)] text-center py-4">No pending withdrawals</p>
                            ) : (
                                stats?.pendingWithdrawals.map((w: any) => (
                                    <div key={w.id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                            <Wallet size={18} className="text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium">{w.username}</div>
                                            <div className="text-xs text-[var(--muted)]">{w.payment_method}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">${parseFloat(w.net_amount).toFixed(2)}</div>
                                            <div className="text-xs text-amber-500">Pending</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
