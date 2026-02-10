'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
    id: number;
    email: string;
    username: string;
    balance: number;
    pendingBalance: number;
    totalEarned: number;
    todayEarned: number;
    referralCode: string;
    emailVerified: boolean;
    vip: {
        name: string;
        expiresAt: string;
        earningBonus: number;
        badgeColor: string;
    } | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, username: string, password: string, referralCode?: string) => Promise<{ token?: string; user?: any; message: string; requiresVerification?: boolean }>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUser(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async (authToken: string) => {
        try {
            const data = await api.getProfile(authToken);
            setUser({
                id: data.id,
                email: data.email,
                username: data.username,
                balance: data.balance,
                pendingBalance: data.pending_balance,
                totalEarned: data.total_earned,
                todayEarned: data.today_earned,
                referralCode: data.referral_code,
                emailVerified: data.email_verified,
                vip: data.vip,
            });
        } catch (error) {
            localStorage.removeItem('token');
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const data = await api.login(email, password);
        localStorage.setItem('token', data.token);
        setToken(data.token);
        await fetchUser(data.token);
    };

    const register = async (email: string, username: string, password: string, referralCode?: string) => {
        const data = await api.register(email, username, password, referralCode);
        // If registration returns a token, auto-login
        if (data.token) {
            localStorage.setItem('token', data.token);
            setToken(data.token);
            await fetchUser(data.token);
        }
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        if (token) {
            await fetchUser(token);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
