'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NavBar } from '@/components/NavBar';
import { Profile } from '@/lib/supabase/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { User, Search, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';

type ConnectionType = 'followers' | 'following';

interface ConnectionsListProps {
    username: string;
    type: ConnectionType;
}

export function ConnectionsList({ username, type }: ConnectionsListProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [connections, setConnections] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [supabase] = useState(() => createClient());

    // Track local follow state changes
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // 1. Get Current User
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: curr } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
                setCurrentUser(curr);

                // Fetch who current user follows (to show follow/unfollow state correctly)
                const { data: myFollows } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', authUser.id);

                if (myFollows) {
                    setFollowingIds(new Set(myFollows.map(f => f.following_id)));
                }
            }

            // 2. Get Target Profile
            const { data: prof } = await supabase.from('profiles').select('*').eq('username', username).single();
            setProfile(prof);

            if (prof) {
                // 3. Get Connections
                if (type === 'followers') {
                    const { data } = await supabase
                        .from('user_follows')
                        .select('follower:profiles!follower_id(*)')
                        .eq('following_id', prof.id);
                    if (data) setConnections(data.map((d: any) => d.follower));
                } else {
                    const { data } = await supabase
                        .from('user_follows')
                        .select('following:profiles!following_id(*)')
                        .eq('follower_id', prof.id);
                    if (data) setConnections(data.map((d: any) => d.following));
                }
            }
            setLoading(false);
        }
        loadData();
    }, [username, type, supabase]);

    const handleFollowToggle = async (targetId: string) => {
        if (!currentUser) return; // Should redirect to login ideally

        const isFollowing = followingIds.has(targetId);

        // Optimistic update
        setFollowingIds(prev => {
            const next = new Set(prev);
            if (isFollowing) next.delete(targetId);
            else next.add(targetId);
            return next;
        });

        try {
            if (isFollowing) {
                await fetch(`/api/follows?user_id=${targetId}`, { method: 'DELETE' });
            } else {
                await fetch('/api/follows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: targetId })
                });
            }
        } catch (error) {
            // Revert on error
            setFollowingIds(prev => {
                const next = new Set(prev);
                if (isFollowing) next.add(targetId); // Re-add if it was delete
                else next.delete(targetId); // Delete if it was add
                return next;
            });
        }
    };

    const filteredConnections = connections.filter(c =>
        c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={currentUser} />
                <div className="pt-32 text-center text-fade">Carregando...</div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={currentUser} />
            <main className="max-w-2xl mx-auto px-4 py-24">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={`/profile/${username}`}>
                        <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent text-fade hover:text-ink">
                            <ArrowLeft className="mr-2" size={20} />
                            Voltar
                        </Button>
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="font-serif text-3xl font-bold text-ink mb-2">
                        {type === 'followers' ? 'Seguidores' : 'Seguindo'}
                    </h1>
                    <p className="text-fade">
                        {type === 'followers'
                            ? `Pessoas que seguem @${username}`
                            : `Pessoas que @${username} segue`
                        }
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fade" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar pessoa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredConnections.length > 0 ? (
                        filteredConnections.map(conn => {
                            const isMe = currentUser?.id === conn.id;
                            const isFollowing = followingIds.has(conn.id);

                            return (
                                <div key={conn.id} className="flex items-center justify-between p-4 bg-white border border-stone-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <Link href={`/profile/${conn.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden flex-shrink-0">
                                            {conn.avatar_url ? (
                                                <img src={conn.avatar_url} alt={conn.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-ink text-white font-bold">
                                                    {conn.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-ink truncate">{conn.display_name || conn.username}</p>
                                            <p className="text-xs text-fade truncate">@{conn.username}</p>
                                        </div>
                                    </Link>

                                    {!isMe && currentUser && (
                                        <Button
                                            size="sm"
                                            variant={isFollowing ? 'ghost' : 'primary'} // Active variant for follow? Or primary
                                            className={isFollowing ? 'text-fade' : 'bg-ink text-white hover:bg-stone-800'}
                                            onClick={() => handleFollowToggle(conn.id)}
                                        >
                                            {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-fade">
                            <User size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Ninguém por aqui ainda.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
