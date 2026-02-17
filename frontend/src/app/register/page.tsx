'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { User, Mail, Lock, Eye, EyeOff, Gift, Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [showVerificationMessage, setShowVerificationMessage] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    // ✅ Get referral code from URL safely
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const ref = params.get('ref');
            if (ref) setReferralCode(ref.toUpperCase());
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !email || !password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const result = await register(email, username, password, referralCode || undefined);

            if (result.requiresVerification) {
                setRegisteredEmail(email);
                setShowVerificationMessage(true);
                showToast('Please check your email to verify your account!', 'success');
            } else {
                showToast('Account created! Welcome!', 'success');
                router.push('/');
            }
        } catch (error: any) {
            showToast(error.message || 'Registration failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (showVerificationMessage) {
        return (
            <div className="mobile-container min-h-screen flex items-center justify-center p-4">
                <div className="card text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-6">
                        <Mail className="text-[var(--primary)]" size={40} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Check Your Email!</h1>
                    <p className="text-[var(--muted)] mb-4">We've sent a verification link to:</p>
                    <p className="font-semibold text-[var(--primary)] mb-6">{registeredEmail}</p>
                    <p className="text-sm text-[var(--muted)] mb-6">
                        Click the link in the email to verify your account and start earning!
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="btn gradient-primary text-white font-semibold px-8 py-3 rounded-xl w-full"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-container min-h-screen flex flex-col">
            {/* Header */}
            <div className="gradient-primary p-8 pb-16 text-center">
                <div className="text-4xl mb-2">🚀</div>
                <h1 className="text-2xl font-bold text-white">Join GPT Earn</h1>
                <p className="text-white/70 text-sm mt-1">Start earning money today</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 -mt-8 bg-[var(--background)] rounded-t-3xl p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                className="input"
                                style={{ paddingLeft: '45px' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="input"
                                style={{ paddingLeft: '45px' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                className="input"
                                style={{ paddingLeft: '45px', paddingRight: '45px' }}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="input"
                                style={{ paddingLeft: '45px' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Referral Code */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Referral Code <span className="text-[var(--muted)]">(Optional)</span>
                        </label>
                        <div className="relative">
                            <Gift size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none z-10" />
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                placeholder="Enter referral code"
                                className="input"
                                style={{ paddingLeft: '45px' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full py-4 text-base"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[var(--muted)]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--primary)] font-semibold">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
