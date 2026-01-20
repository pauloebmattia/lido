'use client';

import { AuthorDashboard } from '@/components/AuthorDashboard';
import { NavBar } from '@/components/NavBar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';

export default function PublishPage() {
    const [user, setUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                router.push('/login?next=/publish');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            setUser(profile);
            setLoading(false);
        }
        checkAuth();
    }, [router]);

    if (loading) return null;

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />
            <main className="max-w-4xl mx-auto px-4 py-32">
                <div className="mb-12">
                    <h1 className="text-4xl font-serif font-bold text-ink mb-2">Área do Autor</h1>
                    <p className="text-fade text-lg">
                        Comece a publicar suas histórias de forma independente e ganhe reconhecimento.
                    </p>
                </div>

                <AuthorDashboard />
            </main>
        </div>
    );
}
