'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('level')
                .eq('id', user.id)
                .single();

            // Check if level >= 10 (Admin)
            if (profile && profile.level >= 10) {
                setIsAuthorized(true);
            } else {
                router.push('/'); // Redirect non-admins to home
            }
            setIsLoading(false);
        };

        checkAdmin();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-paper">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="min-h-screen bg-paper">
            <header className="border-b border-stone-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Logo size="sm" linkToHome />
                        <span className="text-sm font-medium text-stone-400">/</span>
                        <h1 className="font-serif font-bold text-ink">Painel Administrativo</h1>
                    </div>
                    <div className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
                        ADMIN
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
