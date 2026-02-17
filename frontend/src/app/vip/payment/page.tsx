'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
    ArrowLeft, Copy, Check, Upload,
    Loader2, Crown, Clock, AlertCircle
} from 'lucide-react';

interface VIPPlan {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    earning_bonus: number;
}

const WALLET_ADDRESSES = {
    usdt_trc20: 'TYourTRC20WalletAddressHere1234567890',
    binance_pay: '123456789',
    jazzcash: '03001234567',
    easypaisa: '03001234567',
};

export default function VIPPaymentPage() {
    const router = useRouter();
    const { token, isLoading: authLoading, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    const [planId, setPlanId] = useState<string | null>(null);
    const [plan, setPlan] = useState<VIPPlan | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('usdt_trc20');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [transactionId, setTransactionId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Only read query params on client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            setPlanId(params.get('plan'));
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login?redirect=/vip');
            return;
        }

        if (!planId) return; // wait until planId is set

        loadPlan();
    }, [authLoading, isAuthenticated, planId, router]);

    const loadPlan = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/vip/plans`);
            const plans = await response.json();
            const selectedPlan = plans.find((p: VIPPlan) => p.id === parseInt(planId!));

            if (!selectedPlan) {
                router.push('/vip');
                return;
            }

            setPlan(selectedPlan);
        } catch (error) {
            showToast('Failed to load plan', 'error');
            router.push('/vip');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async () => {
        const address = WALLET_ADDRESSES[paymentMethod as keyof typeof WALLET_ADDRESSES];
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('Address copied!', 'success');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('File size must be less than 5MB', 'error');
                return;
            }
            setScreenshot(file);

            const reader = new FileReader();
            reader.onload = (e) => setScreenshotPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!screenshot) {
            showToast('Please upload payment screenshot', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('planId', planId!);
            formData.append('paymentMethod', paymentMethod);
            formData.append('transactionId', transactionId);
            formData.append('screenshot', screenshot);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/vip/subscribe`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Subscription request failed');

            showToast('Payment submitted! Awaiting approval.', 'success');
            router.push('/vip/pending');
        } catch (error: any) {
            showToast(error.message || 'Submission failed', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || authLoading || !planId) {
        return (
            <div className="mobile-container flex items-center justify-center min-h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="mobile-container min-h-screen pb-8">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">Complete Payment</h1>
                </div>
            </header>

            <main className="p-4 space-y-6">
                {/* Plan Summary */}
                <div className="card gradient-gold text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <Crown size={24} />
                        <div>
                            <h2 className="font-bold text-lg">{plan?.name}</h2>
                            <p className="text-white/70 text-sm">{plan?.duration_days} days • +{plan?.earning_bonus}% bonus</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold">${plan?.price.toFixed(2)}</div>
                </div>

                {/* Payment Method Selection */}
                <section>
                    <h3 className="font-semibold mb-3">Select Payment Method</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {['usdt_trc20', 'binance_pay', 'jazzcash', 'easypaisa'].map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`card flex items-center gap-2 transition-all ${paymentMethod === method ? 'border-[var(--primary)] bg-[var(--primary)]/5' : ''}`}
                            >
                                {method.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Wallet Address */}
                <section className="card bg-[var(--primary)]/5 border-[var(--primary)]/20">
                    <h3 className="font-semibold mb-2">Send Payment To:</h3>
                    <div className="flex items-center gap-2 bg-[var(--background)] rounded-xl p-3">
                        <code className="flex-1 text-sm break-all font-mono">
                            {WALLET_ADDRESSES[paymentMethod as keyof typeof WALLET_ADDRESSES]}
                        </code>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg bg-[var(--primary)] text-white flex-shrink-0"
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-2">
                        Send exactly <strong>${plan?.price.toFixed(2)}</strong> to this address
                    </p>
                </section>

                {/* Payment Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Transaction ID <span className="text-[var(--muted)]">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter transaction ID or reference"
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Payment Screenshot <span className="text-red-500">*</span>
                        </label>
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${screenshot ? 'border-[var(--success)] bg-[var(--success)]/5' : 'border-[var(--card-border)]'}`}>
                            {screenshotPreview ? (
                                <div className="space-y-3">
                                    <img
                                        src={screenshotPreview}
                                        alt="Payment screenshot"
                                        className="max-h-48 mx-auto rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                                        className="text-sm text-red-500"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <Upload size={32} className="mx-auto mb-2 text-[var(--muted)]" />
                                    <p className="font-medium">Click to upload screenshot</p>
                                    <p className="text-xs text-[var(--muted)]">PNG, JPG up to 5MB</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !screenshot}
                        className="btn btn-primary w-full py-4 gradient-gold"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Clock size={18} className="mr-2" />
                                Submit Payment for Review
                            </>
                        )}
                    </button>
                </form>
            </main>
        </div>
    );
}

