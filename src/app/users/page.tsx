'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Users, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

export default function UsersPage() {
    const [user, setUser] = useState<Profile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        async function loadUser() {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setUser(profile);
            }
        }
        loadUser();
    }, [supabase]);

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;

        setLoading(true);
        setSearched(true);

        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
            const data = await res.json();
            // Filter out current user
            setResults((data.users || []).filter((u: Profile) => u.id !== user?.id));
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="py-8 text-center">
                        <Users className="mx-auto text-accent mb-4" size={40} />
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                            Encontrar Amigos
                        </h1>
                        <p className="mt-2 text-fade">
                            Busque por nome de usuário ou nome de exibição
                        </p>
                    </div>

                    {/* Search */}
                    <div className="flex gap-2 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fade" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Digite nome ou @usuario..."
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-stone-200 focus:border-accent focus:outline-none"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={searchQuery.length < 2 || loading}>
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
                        </Button>
                    </div>

                    {/* Results */}
                    {searched && (
                        <div className="space-y-3">
                            {results.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-fade">Nenhum usuário encontrado.</p>
                                </div>
                            ) : (
                                results.map((profile) => (
                                    <Link
                                        key={profile.id}
                                        href={`/profile/${profile.username}`}
                                        className="card p-4 flex items-center gap-4 hover:border-accent/30 transition-colors"
                                    >
                                        <img
                                            src={profile.avatar_url || '/default-avatar.png'}
                                            alt={profile.display_name || profile.username}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-ink">
                                                {profile.display_name || profile.username}
                                            </p>
                                            <p className="text-sm text-fade">@{profile.username}</p>
                                            {profile.bio && (
                                                <p className="text-sm text-fade mt-1 line-clamp-1">{profile.bio}</p>
                                            )}
                                        </div>
                                        <UserPlus className="text-fade" size={20} />
                                    </Link>
                                ))
                            )}
                        </div>
                    )}

                    {!searched && (
                        <div className="text-center py-12 text-fade">
                            <p>Comece a digitar para buscar usuários</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
