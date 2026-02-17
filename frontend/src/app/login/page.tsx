'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setIsLoading(true);

        try {
            await login(email, password);
            showToast('Welcome back!', 'success');

            // ✅ Redirect safely using URL params
            let redirect = '/';
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                redirect = params.get('redirect') || '/';
            }

            router.push(redirect);
        } catch (error: any) {
            showToast(error.message || 'Login failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mobile-container min-h-screen flex flex-col">
            {/* Header */}
            <div className="gradient-primary p-8 pb-16 text-center">
                <div className="text-4xl mb-2">💰</div>
                <h1 className="text-2xl font-bold text-white">GPT Earn</h1>
                <p className="text-white/70 text-sm mt-1">Sign in to continue earning</p>
            </div>

            {/* Form Card */}
            <div className="flex-1 -mt-8 bg-[var(--background)] rounded-t-3xl p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="Enter your password"
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

                    <Link href="/forgot-password" className="block text-right text-sm text-[var(--primary)] font-medium">
                        Forgot password?
                    </Link>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary w-full py-4 text-base"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[var(--muted)]">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-[var(--primary)] font-semibold">
                            Sign Up
                        </Link>
                    </p>
                </div>

                <div className="mt-8 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                    <p className="text-xs text-[var(--muted)] text-center">
                        Demo: Create a new account to get started
                    </p>
                </div>
            </div>
        </div>
    );
}
