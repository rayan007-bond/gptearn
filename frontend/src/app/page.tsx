'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import BottomNav from '@/components/ui/BottomNav';
import BalanceCard from '@/components/ui/BalanceCard';
import VIPBadge from '@/components/ui/VIPBadge';
import { BalanceCardSkeleton } from '@/components/ui/Skeleton';
import { api } from '@/lib/api';
import {
  Wallet, TrendingUp, Clock, Bell, ChevronRight,
  Target, Users, Gift, Zap, Play, Shield, Star,
  DollarSign, ArrowRight, Sparkles, Check, Crown
} from 'lucide-react';

interface DashboardData {
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  todayEarned: number;
  isVIP: boolean;
  vip: {
    name: string;
    expiresAt: string;
    earningBonus: number;
    badgeColor: string;
  } | null;
  availableTasks: number;
  completedToday: number;
  referralCount: number;
  unreadNotifications: number;
}

// Auto-rotating Testimonial Carousel Component
function TestimonialCarousel({ testimonials }: { testimonials: { name: string; amount: string; text: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const t = testimonials[currentIndex];

  return (
    <section className="px-4 py-8">
      <h3 className="text-2xl font-bold text-center mb-6">
        What Users Say
      </h3>

      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          className="transition-all duration-500 ease-in-out"
          key={currentIndex}
        >
          <div className="card bg-gradient-to-br from-[var(--card-bg)] to-[var(--primary)]/5 border border-[var(--card-border)]">
            {/* Quote Icon */}
            <div className="text-4xl text-[var(--primary)]/20 mb-2">"</div>

            {/* Testimonial Text */}
            <p className="text-lg font-medium mb-4 animate-fadeIn">{t.text}</p>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-[var(--success)] font-medium">Earned {t.amount}</div>
              </div>
              <div className="ml-auto flex text-amber-500 gap-0.5">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentIndex
              ? 'bg-[var(--primary)] w-6'
              : 'bg-[var(--card-border)] hover:bg-[var(--muted)]'
              }`}
          />
        ))}
      </div>
    </section>
  );
}

// Landing Page Component for non-authenticated users
function LandingPage() {
  const router = useRouter();
  const [liveCounter, setLiveCounter] = useState(2547892);

  // Animate the live counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounter(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Play,
      title: 'Watch & Earn',
      description: 'Watch short ads and videos to earn instant rewards',
      color: 'from-blue-500 to-cyan-500',
      amount: '$0.10 - $0.50'
    },
    {
      icon: Target,
      title: 'Complete Tasks',
      description: 'Simple tasks that take minutes but pay well',
      color: 'from-purple-500 to-pink-500',
      amount: '$0.50 - $5.00'
    },
    {
      icon: Users,
      title: 'Refer Friends',
      description: 'Earn 10% of what your friends earn - forever!',
      color: 'from-orange-500 to-red-500',
      amount: 'Lifetime'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Fast withdrawals to PayPal, Crypto & more',
      color: 'from-green-500 to-emerald-500',
      amount: '24h'
    }
  ];

  const stats = [
    { value: '$2.5M+', label: 'Paid to Users', icon: DollarSign },
    { value: '500K+', label: 'Active Users', icon: Users },
    { value: '4.8★', label: 'User Rating', icon: Star },
    { value: '24/7', label: 'Support', icon: Shield }
  ];

  const testimonials = [
    { name: 'Alex M.', amount: '$1,250', text: "Best earning app I've ever used! Withdrew to PayPal in minutes." },
    { name: 'Sarah K.', amount: '$890', text: 'Love the VIP benefits. Earning 50% more every day!' },
    { name: 'Mike R.', amount: '$2,100', text: 'Referred 20 friends and now earning passively. Amazing!' }
  ];

  const paymentMethods = ['💳 PayPal', '₿ Bitcoin', '📱 JazzCash', '💎 USDT'];

  return (
    <div className="min-h-screen bg-[var(--background)] overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--primary)]/30">
              <Zap className="text-white" size={18} />
            </div>
            <span className="font-bold text-xl">
              <span className="bg-gradient-to-r from-[var(--primary)] to-purple-500 bg-clip-text text-transparent">GPT</span>
              <span className="text-white">Earn</span>
            </span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-[var(--primary)] to-purple-600 text-white rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/25"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-[var(--primary)]/40 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-pink-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 px-6 py-16 text-center max-w-4xl mx-auto">
          {/* Live earnings badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-sm mb-6 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-ping" />
            <span className="font-medium">${liveCounter.toLocaleString()} earned by users</span>
          </div>

          {/* Hero Text */}
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.1]">
            <span className="text-white">Turn Your</span>
            <br />
            <span className="bg-gradient-to-r from-[var(--primary)] via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Time Into Money
            </span>
          </h1>

          <p className="text-white/60 text-lg md:text-xl mb-8 max-w-xl mx-auto leading-relaxed">
            Complete simple tasks, watch videos, and earn <span className="text-white font-semibold">real money</span>.
            Withdraw anytime to PayPal, Crypto, or Mobile Money.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => router.push('/register')}
              className="group relative px-8 py-4 rounded-2xl text-lg font-bold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-pink-500 group-hover:opacity-90 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] via-purple-500 to-pink-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2 text-white">
                <Sparkles size={20} />
                Start Earning Free
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 rounded-2xl text-lg font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              I Have an Account
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Check size={16} className="text-[var(--success)]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1">
              <Check size={16} className="text-[var(--success)]" />
              Start earning in 2 min
            </span>
            <span className="flex items-center gap-1">
              <Check size={16} className="text-[var(--success)]" />
              100% Free to join
            </span>
          </div>
        </div>

        {/* Floating payment methods */}
        <div className="relative z-10 px-4 pb-8">
          <div className="flex justify-center gap-3 flex-wrap">
            {paymentMethods.map((method, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 backdrop-blur-sm"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar - Glassmorphism */}
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-purple-500/20 flex items-center justify-center mx-auto mb-3">
                    <stat.icon size={24} className="text-[var(--primary)]" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 text-white">
            How It Works
          </h2>
          <p className="text-center text-white/50 mb-10 max-w-md mx-auto">
            Simple ways to earn money online, no experience required
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 hover:border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <feature.icon className="text-white" size={28} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-white">{feature.title}</h3>
                      <span className="text-xs font-semibold text-[var(--success)] bg-[var(--success)]/10 px-2 py-1 rounded-full">
                        {feature.amount}
                      </span>
                    </div>
                    <p className="text-sm text-white/50">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Section - Premium Design */}
      <section className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500 text-sm mb-4">
                    <Crown size={16} />
                    <span className="font-semibold">VIP MEMBERSHIP</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Earn 50% More</h3>
                  <p className="text-white/60 mb-6">
                    Unlock unlimited tasks, priority support, and exclusive high-paying offers.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {['Unlimited tasks', '+50% earnings', 'Priority support', 'Exclusive offers'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Check size={12} className="text-amber-500" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/register')}
                    className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/25"
                  >
                    Start Free Trial →
                  </button>
                </div>
                <div className="hidden md:block">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Crown size={80} className="text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Auto Rotating Carousel */}
      <TestimonialCarousel testimonials={testimonials} />

      {/* Final CTA */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="text-6xl mb-6">🚀</div>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h3>
          <p className="text-white/50 text-lg mb-8">
            Join 500,000+ users already earning with GPT Earn
          </p>
          <button
            onClick={() => router.push('/register')}
            className="px-12 py-5 rounded-2xl text-xl font-bold bg-gradient-to-r from-[var(--primary)] via-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity shadow-2xl shadow-[var(--primary)]/30 hover:scale-105 transform"
          >
            Create Free Account
          </button>
          <p className="text-sm text-white/40 mt-6">
            No credit card required • Instant setup • 100% free
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center">
              <Zap className="text-white" size={16} />
            </div>
            <span className="font-bold text-lg text-white">
              <span className="text-[var(--primary)]">GPT</span>Earn
            </span>
          </div>
          <p className="text-sm text-white/40">
            © 2024 GPT Earn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Component for authenticated users
function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard(token!);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const quickActions = [
    { icon: Target, label: 'Tasks', count: dashboard?.availableTasks || 0, href: '/earn', color: 'gradient-primary' },
    { icon: Users, label: 'Referrals', count: dashboard?.referralCount || 0, href: '/referrals', color: 'gradient-success' },
    { icon: Crown, label: 'VIP', count: dashboard?.isVIP ? '✓' : '→', href: '/vip', color: 'gradient-gold' },
    { icon: Wallet, label: 'Withdraw', count: null, href: '/withdraw', color: 'gradient-danger' },
  ];

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--card-border)]">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Welcome back,</p>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user?.username || 'User'}</h1>
              {dashboard?.isVIP && <VIPBadge name={dashboard.vip?.name} size="sm" />}
            </div>
          </div>
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]"
          >
            <Bell size={20} />
            {dashboard?.unreadNotifications ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {dashboard.unreadNotifications > 9 ? '9+' : dashboard.unreadNotifications}
              </span>
            ) : null}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Balance Cards */}
        <section>
          {isLoadingData ? (
            <div className="grid grid-cols-2 gap-3">
              <BalanceCardSkeleton />
              <BalanceCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <BalanceCard
                icon={Wallet}
                label="Balance"
                value={`$${(dashboard?.balance ?? 0).toFixed(2)}`}
                trend={dashboard?.todayEarned ? `+$${dashboard.todayEarned.toFixed(2)} today` : undefined}
                color="primary"
              />
              <BalanceCard
                icon={TrendingUp}
                label="Total Earned"
                value={`$${(dashboard?.totalEarned ?? 0).toFixed(2)}`}
                color="success"
              />
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="card p-3 text-center hover:scale-105 transition-transform"
              >
                <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-2`}>
                  <action.icon size={20} className="text-white" />
                </div>
                <div className="text-xs font-medium">{action.label}</div>
                {action.count !== null && (
                  <div className="text-[10px] text-[var(--muted)]">{action.count}</div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Today's Progress */}
        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Today's Progress</h2>
            <span className="text-xs text-[var(--muted)]">{dashboard?.completedToday || 0} tasks</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((dashboard?.completedToday || 0) / 6 * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-[var(--primary)]">
              ${dashboard?.todayEarned?.toFixed(2) || '0.00'}
            </span>
          </div>
        </section>

        {/* Start Earning CTA */}
        <button
          onClick={() => router.push('/earn')}
          className="w-full card gradient-primary text-white p-4 flex items-center justify-between hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Zap size={24} />
            <div className="text-left">
              <div className="font-semibold">Start Earning</div>
              <div className="text-xs text-white/70">{dashboard?.availableTasks || 0} tasks available</div>
            </div>
          </div>
          <ChevronRight size={24} />
        </button>

        {/* VIP Promo (if not VIP) */}
        {!dashboard?.isVIP && (
          <button
            onClick={() => router.push('/vip')}
            className="w-full card bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Crown className="text-amber-500" size={24} />
              <div className="text-left">
                <div className="font-semibold">Upgrade to VIP</div>
                <div className="text-xs text-[var(--muted)]">Earn 50% more on every task</div>
              </div>
            </div>
            <ChevronRight className="text-amber-500" size={24} />
          </button>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return <Dashboard />;
}
