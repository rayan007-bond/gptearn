'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, ArrowRight, Sparkles, Gift, Zap } from 'lucide-react';

export default function VerifyEmailPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your email...');

    // Only access URL params on client side
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const t = params.get('token');
            setToken(t);

            if (!t) {
                setStatus('error');
                setMessage('Invalid verification link. No token provided.');
            }
        }
    }, []);

    useEffect(() => {
        if (token) {
            verifyEmail();
        }
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

                    {status === 'success' && (
                        <div className="relative z-10">
                            <div className="mb-6">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-green-500/25">
                                    <CheckCircle className="text-white" size={50} />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-green-500 mb-2">You're Verified!</h1>
                            <p className="text-[var(--muted)] mb-6">{message}</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="btn gradient-primary text-white font-semibold px-8 py-4 rounded-xl w-full flex items-center justify-center gap-2 text-lg hover:scale-105 transition-transform"
                            >
                                Start Earning Now
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

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
