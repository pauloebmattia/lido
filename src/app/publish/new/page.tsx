'use client';

import { BookUploadForm } from '@/components/BookUploadForm';
import { NavBar } from '@/components/NavBar';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPublicationPage() {
    const [user, setUser] = useState<Profile | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                setUser(data);
            } else {
                router.push('/login');
            }
        }
        loadUser();
    }, [router]);

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />
            <main className="max-w-3xl mx-auto px-4 py-32">
                <Link href="/publish" className="inline-flex items-center gap-2 text-fade hover:text-ink mb-8 transition-colors">
                    <ArrowLeft size={20} />
                    Voltar para Dashboard
                </Link>

                <BookUploadForm />
            </main>
        </div>
    );
}
