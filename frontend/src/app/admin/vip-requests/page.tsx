'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
    ArrowLeft, Crown, CheckCircle, XCircle,
    Clock, Eye, Loader2, Image as ImageIcon
} from 'lucide-react';

interface VIPRequest {
    id: number;
    user_id: number;
    username: string;
    email: string;
    plan_name: string;
    amount: number;
    payment_method: string;
    transaction_id: string | null;
    screenshot_path: string;
    status: string;
    earning_bonus: number;
    duration_days: number;
    created_at: string;
}

export default function AdminVIPRequestsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [requests, setRequests] = useState<VIPRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processing, setProcessing] = useState<number | null>(null);
    const [filter, setFilter] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState<VIPRequest | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadRequests(token);
    }, [router, filter]);

    const loadRequests = async (token: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/vip-requests?status=${filter}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast('Failed to load VIP requests', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const processRequest = async (id: number, action: 'approve' | 'reject') => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        let notes = '';
        if (action === 'reject') {
            notes = prompt('Rejection reason:') || '';
            if (!notes) return;
        }

        setProcessing(id);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/vip-requests/${id}/process`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ action, notes }),
                }
            );

            if (!response.ok) throw new Error('Failed to process request');

            showToast(`VIP request ${action === 'approve' ? 'approved' : 'rejected'}!`, 'success');
            setSelectedRequest(null);
            loadRequests(token);
        } catch (error) {
            showToast('Failed to process request', 'error');
        } finally {
            setProcessing(null);
        }
    };

    const statusColors: Record<string, string> = {
        pending: 'text-amber-500 bg-amber-500/10',
        approved: 'text-green-500 bg-green-500/10',
        rejected: 'text-red-500 bg-red-500/10',
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
                    <h1 className="text-2xl font-bold">VIP Requests</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {['pending', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-[var(--card-bg)] border border-[var(--card-border)]'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Requests List */}
                <div className="space-y-3">
                    {requests.length === 0 ? (
                        <div className="card text-center py-12 text-[var(--muted)]">
                            <Crown size={48} className="mx-auto mb-3 opacity-50" />
                            <p>No {filter} VIP requests</p>
                        </div>
                    ) : (
                        requests.map((req) => (
                            <div key={req.id} className="card">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl gradient-gold">
                                        <Crown size={24} className="text-white" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold">{req.username}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--muted)]">{req.email}</p>

                                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                            <span className="px-2 py-1 bg-[var(--card-border)] rounded">
                                                {req.plan_name}
                                            </span>
                                            <span className="px-2 py-1 bg-[var(--card-border)] rounded">
                                                ${parseFloat(req.amount as any).toFixed(2)}
                                            </span>
                                            <span className="px-2 py-1 bg-[var(--card-border)] rounded">
                                                {req.payment_method.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>

                                        {req.transaction_id && (
                                            <p className="text-xs text-[var(--muted)] mt-2">
                                                TxID: {req.transaction_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xs text-[var(--muted)] mb-2">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="p-2 hover:bg-[var(--card-border)] rounded-lg"
                                            title="View Screenshot"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                    </div>
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
                                        <button
                                            onClick={() => processRequest(req.id, 'approve')}
                                            disabled={processing === req.id}
                                            className="btn btn-success flex-1"
                                        >
                                            {processing === req.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle size={16} className="mr-2" />
                                                    Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => processRequest(req.id, 'reject')}
                                            disabled={processing === req.id}
                                            className="btn flex-1 bg-red-500 text-white"
                                        >
                                            <XCircle size={16} className="mr-2" />
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Screenshot Modal */}
            {selectedRequest && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedRequest(null)}
                >
                    <div
                        className="bg-[var(--card-bg)] rounded-2xl p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold">Payment Screenshot</h3>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-2 hover:bg-[var(--card-border)] rounded-lg"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-[var(--muted)]">
                                {selectedRequest.username} • {selectedRequest.plan_name} • ${parseFloat(selectedRequest.amount as any).toFixed(2)}
                            </p>
                        </div>

                        {selectedRequest.screenshot_path ? (
                            <img
                                src={`http://localhost:5000/uploads/vip-screenshots/${selectedRequest.screenshot_path}`}
                                alt="Payment screenshot"
                                className="w-full rounded-lg max-h-[400px] object-contain"
                                onError={(e) => {
                                    console.error('Failed to load image:', selectedRequest.screenshot_path);
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23333" width="100%" height="100%"/><text y="50%" x="50%" text-anchor="middle" fill="gray" font-size="16">Image Load Error</text></svg>';
                                }}
                            />
                        ) : (
                            <div className="w-full h-48 bg-[var(--card-border)] rounded-lg flex items-center justify-center text-[var(--muted)]">
                                No Screenshot Uploaded
                            </div>
                        )}

                        {selectedRequest.status === 'pending' && (
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => processRequest(selectedRequest.id, 'approve')}
                                    disabled={processing === selectedRequest.id}
                                    className="btn btn-success flex-1"
                                >
                                    <CheckCircle size={16} className="mr-2" />
                                    Approve
                                </button>
                                <button
                                    onClick={() => processRequest(selectedRequest.id, 'reject')}
                                    disabled={processing === selectedRequest.id}
                                    className="btn flex-1 bg-red-500 text-white"
                                >
                                    <XCircle size={16} className="mr-2" />
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
