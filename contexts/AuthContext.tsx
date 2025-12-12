'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface SupabaseUser {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
}

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

interface LayoutUser {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    credits: number;
    auth_id: string;
}

interface AuthContextType {
    user: LayoutUser | null;
    authUser: SupabaseUser | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<LayoutUser | null>(null);
    const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserProfile = async (authUserId: string) => {
        try {
            // Fetch from Neon via API
            const response = await fetch(`/api/users/profile/${authUserId}`);
            const result = await response.json();

            if (!result.success || !result.data) {
                console.error('Fetch error:', result.error);
                return null;
            }

            return result.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    const refreshUser = async () => {
        if (!authUser?.id) return;

        const profile = await fetchUserProfile(authUser.id);
        if (profile) {
            setUser(profile);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAuthUser(null);
        router.push('/auth/login');
    };

    useEffect(() => {
        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setIsLoading(false);
                    router.push('/auth/login');
                    return;
                }

                setAuthUser(session.user);

                // Fetch user profile from Neon
                const profile = await fetchUserProfile(session.user.id);

                if (profile) {
                    setUser(profile);
                } else {
                    router.push('/me/set-up');
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                router.push('/auth/login');
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async ({ event, session }: { event: string, session: any }) => {
                console.log('Auth state change:', event);

                if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setAuthUser(null);
                    router.push('/auth/login');
                } else if (event === 'SIGNED_IN' && session) {
                    setAuthUser(session.user);
                    const profile = await fetchUserProfile(session.user.id);
                    if (profile) {
                        setUser(profile);
                    }
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    setAuthUser(session.user);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const value = useMemo(() => ({
        user,
        authUser,
        isLoading,
        logout,
        refreshUser,
    }), [user, authUser, isLoading]);

    return (
        <AuthContext.Provider value={value}>
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