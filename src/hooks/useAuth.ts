'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import type { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

export function useAuth() {
    const router = useRouter();
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        isLoading: true,
        isAuthenticated: false,
    });

    const supabase = createClient();

    // Fetch user profile from database
    const fetchProfile = useCallback(async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return data as Profile;
    }, [supabase]);

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const profile = await fetchProfile(user.id);
                setState({
                    user,
                    profile,
                    isLoading: false,
                    isAuthenticated: true,
                });
            } else {
                setState({
                    user: null,
                    profile: null,
                    isLoading: false,
                    isAuthenticated: false,
                });
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    const profile = await fetchProfile(session.user.id);
                    setState({
                        user: session.user,
                        profile,
                        isLoading: false,
                        isAuthenticated: true,
                    });
                } else if (event === 'SIGNED_OUT') {
                    setState({
                        user: null,
                        profile: null,
                        isLoading: false,
                        isAuthenticated: false,
                    });
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    // Sign out function
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    }, [supabase, router]);

    // Update profile function
    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (!state.user) return { error: 'Not authenticated' };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', state.user.id)
            .select()
            .single();

        if (error) {
            return { error: error.message };
        }

        setState((prev) => ({
            ...prev,
            profile: data as Profile,
        }));

        return { data };
    }, [state.user, supabase]);

    return {
        ...state,
        signOut,
        updateProfile,
    };
}
