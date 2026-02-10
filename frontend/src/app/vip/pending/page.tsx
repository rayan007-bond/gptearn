'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle, XCircle, Crown, ArrowLeft } from 'lucide-react';
import BottomNav from '@/components/ui/BottomNav';

interface PendingRequest {
    id: number;
    plan_name: string;
    amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function VIPPendingPage() {
    const router = useRouter();
    const { token, isLoading: authLoading, isAuthenticated } = useAuth();
    const [requests, setRequests] = useState<PendingRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (token) {
            loadRequests();
        }
    }, [authLoading, isAuthenticated, token, router]);

    const loadRequests = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/vip/my-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const statusConfig = {
        pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', text: 'Pending Review' },
        approved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', text: 'Approved' },
        rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', text: 'Rejected' },
    };

    if (isLoading || authLoading) {
        return (
            <div className="mobile-container flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="mobile-container min-h-screen pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => router.push('/vip')} className="p-2 -ml-2">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">VIP Requests</h1>
                </div>
            </header>

            <main className="p-4 space-y-4">
                {requests.length === 0 ? (
                    <div className="card text-center py-12">
                        <Crown size={48} className="mx-auto mb-4 text-[var(--muted)] opacity-50" />
                        <p className="text-[var(--muted)]">No VIP requests yet</p>
                        <button
                            onClick={() => router.push('/vip')}
                            className="btn btn-primary mt-4"
                        >
                            Upgrade to VIP
                        </button>
                    </div>
                ) : (
                    requests.map((request) => {
                        const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                        const StatusIcon = status.icon;

                        return (
                            <div key={request.id} className="card">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${status.bg}`}>
                                        <StatusIcon size={24} className={status.color} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold">{request.plan_name}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </div>
                                        <p className="text-lg font-bold">${parseFloat(request.amount as any).toFixed(2)}</p>
                                        <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1">
                                            <span>{request.payment_method.replace('_', ' ').toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {request.status === 'pending' && (
                                    <p className="mt-3 pt-3 border-t border-[var(--card-border)] text-sm text-[var(--muted)]">
                                        ⏳ Your request is being reviewed. VIP will be activated within 2 hours of approval.
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </main>

            <BottomNav />
        </div>
    );
}
