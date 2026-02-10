'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
    ArrowLeft, Search, Crown, Ban,
    CheckCircle, XCircle, DollarSign, Bell, X
} from 'lucide-react';

interface User {
    id: number;
    username: string;
    email: string;
    balance: number;
    total_earned: number;
    status: string;
    is_vip: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Notification Modal State
    const [notifyModal, setNotifyModal] = useState({
        isOpen: false,
        userId: 0,
        username: '',
        title: '',
        message: ''
    });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadUsers(token);
    }, [router, page, search]);

    const loadUsers = async (token: string) => {
        try {
            const params = new URLSearchParams({ page: page.toString() });
            if (search) params.append('search', search);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            // Handle both array response and object response
            const usersList = Array.isArray(data) ? data : (data.users || []);
            setUsers(usersList);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            showToast('Failed to load users', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserStatus = async (userId: number, status: string) => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            showToast('User status updated', 'success');
            loadUsers(token);
        } catch (error) {
            showToast('Failed to update user', 'error');
        }
    };

    const adjustBalance = async (userId: number) => {
        const amount = prompt('Enter adjustment amount (negative to deduct):');
        if (!amount) return;

        const token = localStorage.getItem('adminToken');
        if (!token) return;

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/balance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adjustment: parseFloat(amount), reason: 'Admin adjustment' }),
            });
            showToast('Balance adjusted', 'success');
            loadUsers(token);
        } catch (error) {
            showToast('Failed to adjust balance', 'error');
        }
    };

    const sendNotification = async () => {
        if (!notifyModal.title || !notifyModal.message) {
            showToast('Title and message are required', 'error');
            return;
        }

        const token = localStorage.getItem('adminToken');
        if (!token) return;

        setIsSending(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/users/${notifyModal.userId}/notify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: notifyModal.title,
                    message: notifyModal.message,
                    type: 'info'
                }),
            });

            if (!response.ok) throw new Error('Failed to send');

            showToast('Notification sent successfully', 'success');
            setNotifyModal({ ...notifyModal, isOpen: false, title: '', message: '' });
        } catch (error) {
            showToast('Failed to send notification', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const statusColors: Record<string, string> = {
        active: 'text-green-500 bg-green-500/10',
        suspended: 'text-amber-500 bg-amber-500/10',
        banned: 'text-red-500 bg-red-500/10',
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.push('/admin/dashboard')} className="p-2">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Manage Users</h1>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by username or email..."
                        className="input pl-11"
                    />
                </div>

                {/* Users Table */}
                <div className="card overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--card-border)]">
                                <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">User</th>
                                <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">Balance</th>
                                <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">Earned</th>
                                <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">Status</th>
                                <th className="text-left py-3 px-2 text-sm font-medium text-[var(--muted)]">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-[var(--card-border)] last:border-b-0">
                                    <td className="py-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center font-bold text-[var(--primary)]">
                                                {user.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{user.username}</span>
                                                    {user.is_vip && <Crown size={14} className="text-amber-500" />}
                                                </div>
                                                <div className="text-xs text-[var(--muted)]">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 font-medium">${parseFloat(user.balance as any).toFixed(2)}</td>
                                    <td className="py-3 px-2">${parseFloat(user.total_earned as any).toFixed(2)}</td>
                                    <td className="py-3 px-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[user.status]}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setNotifyModal({
                                                    isOpen: true,
                                                    userId: user.id,
                                                    username: user.username,
                                                    title: '',
                                                    message: ''
                                                })}
                                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg"
                                                title="Send Notification"
                                            >
                                                <Bell size={16} />
                                            </button>
                                            <button
                                                onClick={() => adjustBalance(user.id)}
                                                className="p-2 hover:bg-[var(--card-border)] rounded-lg"
                                                title="Adjust Balance"
                                            >
                                                <DollarSign size={16} />
                                            </button>
                                            {user.status === 'active' ? (
                                                <button
                                                    onClick={() => updateUserStatus(user.id, 'banned')}
                                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                                                    title="Ban User"
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateUserStatus(user.id, 'active')}
                                                    className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg"
                                                    title="Activate User"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2 mt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn btn-secondary"
                    >
                        Previous
                    </button>
                    <span className="flex items-center px-4">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn btn-secondary"
                    >
                        Next
                    </button>
                </div>

                {/* Notification Modal */}
                {notifyModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] w-full max-w-md p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Send Notification</h2>
                                <button
                                    onClick={() => setNotifyModal({ ...notifyModal, isOpen: false })}
                                    className="p-2 hover:bg-[var(--card-border)] rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-[var(--muted)] mb-4">
                                Sending to: <span className="font-semibold text-[var(--foreground)]">{notifyModal.username}</span>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-[var(--muted)] mb-1 block">Title</label>
                                    <input
                                        value={notifyModal.title}
                                        onChange={(e) => setNotifyModal({ ...notifyModal, title: e.target.value })}
                                        className="input w-full"
                                        placeholder="Notification Title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--muted)] mb-1 block">Message</label>
                                    <textarea
                                        value={notifyModal.message}
                                        onChange={(e) => setNotifyModal({ ...notifyModal, message: e.target.value })}
                                        className="input w-full min-h-[100px]"
                                        placeholder="Write your message here..."
                                    />
                                </div>

                                <button
                                    onClick={sendNotification}
                                    disabled={isSending}
                                    className="btn btn-primary w-full"
                                >
                                    {isSending ? 'Sending...' : 'Send Notification'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
