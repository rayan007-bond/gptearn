'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import {
    ArrowLeft, Save, Loader2, Settings,
    DollarSign, Clock, Users, Crown
} from 'lucide-react';

interface SiteSettings {
    dailyTaskLimit: number;
    dailyOfferLimit: number;
    cooldownHours: number;
    minWithdrawal: number;
    referralCommission: number;
    vipUnlimited: boolean;
}

export default function AdminSettingsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState<SiteSettings>({
        dailyTaskLimit: 6,
        dailyOfferLimit: 1,
        cooldownHours: 1,
        minWithdrawal: 5,
        referralCommission: 10,
        vipUnlimited: true,
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadSettings(token);
    }, [router]);

    const loadSettings = async (token: string) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/settings`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.log('Using default settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('adminToken');
        if (!token) return;

        setIsSaving(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/settings`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(settings),
                }
            );

            if (!response.ok) throw new Error('Failed to save');
            showToast('Settings saved!', 'success');
        } catch (error) {
            showToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
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
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => router.push('/admin/dashboard')} className="p-2">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>

                <div className="space-y-6">
                    {/* Daily Limits */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[var(--primary)]/10">
                                <Users size={20} className="text-[var(--primary)]" />
                            </div>
                            <h2 className="font-semibold">Daily Limits (Free Users)</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Tasks Per Day</label>
                                <input
                                    type="number"
                                    value={settings.dailyTaskLimit}
                                    onChange={(e) => setSettings({ ...settings, dailyTaskLimit: parseInt(e.target.value) })}
                                    className="input"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Offers Per Day</label>
                                <input
                                    type="number"
                                    value={settings.dailyOfferLimit}
                                    onChange={(e) => setSettings({ ...settings, dailyOfferLimit: parseInt(e.target.value) })}
                                    className="input"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cooldown */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                                <Clock size={20} className="text-amber-500" />
                            </div>
                            <h2 className="font-semibold">Cooldown Settings</h2>
                        </div>

                        <div>
                            <label className="text-sm text-[var(--muted)] mb-1 block">Cooldown After Limit (Hours)</label>
                            <input
                                type="number"
                                value={settings.cooldownHours}
                                onChange={(e) => setSettings({ ...settings, cooldownHours: parseInt(e.target.value) })}
                                className="input"
                                min="1"
                            />
                            <p className="text-xs text-[var(--muted)] mt-1">
                                Time users must wait after reaching daily limit
                            </p>
                        </div>
                    </div>

                    {/* Financial */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <DollarSign size={20} className="text-green-500" />
                            </div>
                            <h2 className="font-semibold">Financial Settings</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Min Withdrawal ($)</label>
                                <input
                                    type="number"
                                    value={settings.minWithdrawal}
                                    onChange={(e) => setSettings({ ...settings, minWithdrawal: parseFloat(e.target.value) })}
                                    className="input"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-[var(--muted)] mb-1 block">Referral Commission (%)</label>
                                <input
                                    type="number"
                                    value={settings.referralCommission}
                                    onChange={(e) => setSettings({ ...settings, referralCommission: parseFloat(e.target.value) })}
                                    className="input"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* VIP Settings */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg gradient-gold">
                                <Crown size={20} className="text-white" />
                            </div>
                            <h2 className="font-semibold">VIP Settings</h2>
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.vipUnlimited}
                                onChange={(e) => setSettings({ ...settings, vipUnlimited: e.target.checked })}
                                className="w-5 h-5 rounded"
                            />
                            <span>VIP users have unlimited daily tasks</span>
                        </label>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary w-full"
                    >
                        {isSaving ? (
                            <Loader2 size={18} className="animate-spin mr-2" />
                        ) : (
                            <Save size={18} className="mr-2" />
                        )}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
