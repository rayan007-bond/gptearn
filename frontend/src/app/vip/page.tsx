'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import BottomNav from '@/components/ui/BottomNav';
import VIPBadge from '@/components/ui/VIPBadge';
import { api } from '@/lib/api';
import {
    Crown, Check, Zap, Percent, Wallet,
    Clock, Shield, Ban, ArrowLeft
} from 'lucide-react';

interface VIPPlan {
    id: number;
    name: string;
    description: string;
    price: number;
    duration_days: number;
    earningBonus: number;
    feeDiscount: number;
    minWithdrawal: number;
    priority_payout: boolean;
    ad_free: boolean;
    badge_color: string;
}

interface VIPStatus {
    isVIP: boolean;
    name?: string;
    expiresAt?: string;
    earningBonus?: number;
}

export default function VIPPage() {
    const router = useRouter();
    const { token, isLoading, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    const [plans, setPlans] = useState<VIPPlan[]>([]);
    const [status, setStatus] = useState<VIPStatus | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
    const [isSubscribing, setIsSubscribing] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login?redirect=/vip');
            return;
        }

        if (token) {
            loadData();
        }
    }, [isLoading, isAuthenticated, token, router]);

    const loadData = async () => {
        try {
            const [plansData, statusData] = await Promise.all([
                api.getVIPPlans(),
                api.getVIPStatus(token!)
            ]);
            setPlans(plansData);
            setStatus(statusData);
        } catch (error) {
            console.error('Failed to load VIP data:', error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSubscribe = async (planId: number) => {
        setIsSubscribing(true);
        try {
            // In production, this would integrate with actual payment gateway
            const result = await api.subscribeVIP(token!, planId, 'crypto', 'demo-payment');
            showToast('🎉 VIP activated! Enjoy your premium benefits.', 'success');
            await loadData();
        } catch (error: any) {
            showToast(error.message || 'Failed to subscribe', 'error');
        } finally {
            setIsSubscribing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (isLoading || isLoadingData) {
        return (
            <div className="mobile-container flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    const benefits = [
        { icon: Zap, text: 'Earn 20-25% more on all tasks', color: 'text-amber-500' },
        { icon: Percent, text: 'Only 2% withdrawal fee (vs 5%)', color: 'text-green-500' },
        { icon: Wallet, text: 'Lower minimum withdrawal ($5 vs $10)', color: 'text-blue-500' },
        { icon: Clock, text: 'Priority withdrawal processing', color: 'text-purple-500' },
        { icon: Ban, text: 'Ad-free experience', color: 'text-red-500' },
        { icon: Shield, text: 'Exclusive VIP badge', color: 'text-amber-500' },
    ];

    return (
        <div className="mobile-container">
            {/* Header */}
            <header className="relative overflow-hidden">
                <div className="gradient-gold p-6 pb-16">
                    <button
                        onClick={() => router.back()}
                        className="absolute top-4 left-4 p-2 bg-white/20 rounded-xl"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>

                    <div className="text-center pt-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                            <Crown size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">VIP Membership</h1>
                        <p className="text-white/80 mt-1">Unlock premium earning benefits</p>
                    </div>
                </div>

                {/* Wave decoration */}
                <div className="h-8 bg-[var(--background)] rounded-t-3xl -mt-6 relative z-10" />
            </header>

            <main className="px-4 pb-4 -mt-2 space-y-6">
                {/* Current Status */}
                {status?.isVIP && (
                    <div className="card border-amber-500/30 bg-amber-500/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <VIPBadge name={status.name} size="sm" />
                                    <span className="text-sm text-[var(--success)]">Active</span>
                                </div>
                                <p className="text-sm text-[var(--muted)]">
                                    Expires: {formatDate(status.expiresAt!)}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-amber-500">+{status.earningBonus}%</div>
                                <div className="text-xs text-[var(--muted)]">Earning Bonus</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Benefits */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">VIP Benefits</h2>
                    <div className="space-y-2">
                        {benefits.map((benefit, i) => {
                            const Icon = benefit.icon;
                            return (
                                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                                    <div className={`p-2 rounded-lg bg-[var(--card-border)]`}>
                                        <Icon size={18} className={benefit.color} />
                                    </div>
                                    <span className="text-sm">{benefit.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Plans */}
                <section>
                    <h2 className="text-lg font-semibold mb-3">Choose Your Plan</h2>
                    <div className="space-y-3">
                        {plans.map((plan) => {
                            const isPopular = plan.duration_days === 365;
                            const pricePerMonth = plan.price / (plan.duration_days / 30);

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative card cursor-pointer transition-all ${selectedPlan === plan.id
                                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                                        : ''
                                        } ${isPopular ? 'border-amber-500/50' : ''}`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-2 left-4 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded">
                                            BEST VALUE
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{plan.name}</h3>
                                            <p className="text-sm text-[var(--muted)] mt-0.5">
                                                +{plan.earningBonus}% earnings • {plan.duration_days} days
                                            </p>
                                            {isPopular && (
                                                <p className="text-xs text-amber-500 mt-1">
                                                    Save ${((plan.price / 12) * 12 - plan.price).toFixed(2)}/year
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">${plan.price.toFixed(2)}</div>
                                            <div className="text-xs text-[var(--muted)]">
                                                ${pricePerMonth.toFixed(2)}/mo
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`mt-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id
                                        ? 'border-[var(--primary)] bg-[var(--primary)]'
                                        : 'border-[var(--card-border)]'
                                        }`}>
                                        {selectedPlan === plan.id && (
                                            <Check size={12} className="text-white" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Subscribe Button */}
                {!status?.isVIP && selectedPlan && (
                    <button
                        onClick={() => router.push(`/vip/payment?plan=${selectedPlan}`)}
                        className="btn btn-gold w-full py-4 text-base"
                    >
                        <Crown size={20} className="mr-2" />
                        Continue to Payment
                    </button>
                )}

                {/* Check Pending Requests */}
                <button
                    onClick={() => router.push('/vip/pending')}
                    className="w-full text-center text-sm text-[var(--primary)] py-2"
                >
                    View My VIP Requests →
                </button>

                {/* Payment info */}
                <p className="text-xs text-center text-[var(--muted)]">
                    Payment via USDT, Binance Pay, JazzCash, or Easypaisa
                </p>
            </main>

            <BottomNav />
        </div>
    );
}
