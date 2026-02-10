'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight, Sparkles, Gift, Zap } from 'lucide-react';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link. No token provided.');
            return;
        }

        verifyEmail();
    }, [token]);

    const verifyEmail = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/verify-email`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Your email has been verified successfully!');
            } else {
                setStatus('error');
                setMessage(data.error || 'Verification failed. The link may have expired.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="card text-center overflow-hidden">
                    {/* Loading State */}
                    {status === 'loading' && (
                        <>
                            <div className="mb-6">
                                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto">
                                    <Loader2 className="text-[var(--primary)] animate-spin" size={40} />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
                            <p className="text-[var(--muted)]">{message}</p>
                        </>
                    )}

                    {/* Success State */}
                    {status === 'success' && (
                        <>
                            {/* Confetti-like animation */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                            </div>

                            <div className="relative z-10">
                                <div className="mb-6">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
                                        <CheckCircle className="text-white" size={50} />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Sparkles className="text-yellow-500" size={24} />
                                    <h1 className="text-2xl font-bold text-green-500">You're Verified!</h1>
                                    <Sparkles className="text-yellow-500" size={24} />
                                </div>

                                <p className="text-lg font-medium mb-2">Welcome to GPT Earn! 🎉</p>
                                <p className="text-[var(--muted)] mb-6">
                                    Your account is now active. Start completing tasks and earning real money today!
                                </p>

                                {/* Benefits Preview */}
                                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-around text-sm">
                                        <div className="text-center">
                                            <Gift className="text-[var(--primary)] mx-auto mb-1" size={20} />
                                            <span className="text-[var(--muted)]">Free Tasks</span>
                                        </div>
                                        <div className="text-center">
                                            <Zap className="text-yellow-500 mx-auto mb-1" size={20} />
                                            <span className="text-[var(--muted)]">Instant Pay</span>
                                        </div>
                                        <div className="text-center">
                                            <Sparkles className="text-purple-500 mx-auto mb-1" size={20} />
                                            <span className="text-[var(--muted)]">VIP Bonus</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/login')}
                                    className="btn gradient-primary text-white font-semibold px-8 py-4 rounded-xl w-full flex items-center justify-center gap-2 text-lg hover:scale-105 transition-transform"
                                >
                                    Start Earning Now
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                        <>
                            <div className="mb-6">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                                    <XCircle className="text-red-500" size={40} />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                            <p className="text-[var(--muted)] mb-6">{message}</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/register')}
                                    className="btn bg-[var(--card-bg)] border border-[var(--card-border)] font-semibold px-8 py-3 rounded-xl w-full"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="text-sm text-[var(--primary)] hover:underline"
                                >
                                    Already verified? Login here
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
