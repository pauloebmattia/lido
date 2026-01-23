'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/Button';
import { Settings, UserPlus, UserCheck, MapPin, Link as LinkIcon, Calendar, BookOpen, Star, Trophy, Users, Edit } from 'lucide-react';
import Link from 'next/link';
import type { Profile, UserBook, Review } from '@/lib/supabase/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { BookCard } from '@/components/BookCard';

interface ProfileClientProps {
    initialProfile: Profile;
    currentUser: Profile | null;
    initialIsFollowing: boolean;
    initialFollowersCount: number;
    initialFollowingCount: number;
    initialBooks: UserBook[];
    initialReviews: Review[];
}

export function ProfileClient({
    initialProfile,
    currentUser,
    initialIsFollowing,
    initialFollowersCount,
    initialFollowingCount,
    initialBooks,
    initialReviews
}: ProfileClientProps) {
    const [profile, setProfile] = useState<Profile>(initialProfile);
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followersCount, setFollowersCount] = useState(initialFollowersCount);
    // const [followingCount, setFollowingCount] = useState(initialFollowingCount); // Use props or profile.following_count? Profile has it.

    // Sync state with profile prop if needed, but profile might be stale.
    // Actually, we should trust the props as initial state.

    // const [userBooks, setUserBooks] = useState<UserBook[]>(initialBooks); // Used for tabs
    // const [reviews, setReviews] = useState<Review[]>(initialReviews);

    // We can use the passed data directly or put in state if we enable filtering.
    // For now, let's just use the props for the lists if possible, or state if we want client-side updates (unlikely for lists here).

    // Actually, ProfilePage had logic to fetch lists. I should keep that logic or accept props.
    // Fetching lists client-side is fine if RLS allows, but server-side is safer.
    // Let's assume passed props are full lists for now, or we fetch if empty?
    // The previous implementation fetched them. I'll stick to using props for initial data.

    const isOwnProfile = currentUser?.id === profile.id;

    // Supabase client for other actions
    const [supabase] = useState(() => createClient());

    const handleFollowToggle = async () => {
        if (!currentUser) return; // Should redirect logic

        // Optimistic
        const previousState = isFollowing;
        const previousCount = followersCount;

        setIsFollowing(!previousState);
        setFollowersCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            if (previousState) {
                // Unfollow
                await fetch(`/api/follows?user_id=${profile.id}`, { method: 'DELETE' });
            } else {
                // Follow
                await fetch('/api/follows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: profile.id })
                });
            }
        } catch (error) {
            // Revert
            setIsFollowing(previousState);
            setFollowersCount(previousCount);
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={currentUser} />

            <main className="pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header Profile */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 mb-8 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-start gap-8">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-stone-100">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-ink text-white text-4xl font-bold">
                                            {profile.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Message Button (Wait, user wanted FAB removed on profile, but maybe a direct message button here is okay. The design had one before?)
                                   The previous code had a 'Mensagem' button in the actions area. I will restore that.
                                */}
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                    <div>
                                        <h1 className="font-serif text-3xl font-bold text-ink mb-1">
                                            {profile.display_name || profile.username}
                                        </h1>
                                        <p className="text-fade">@{profile.username}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOwnProfile ? (
                                            <Link href="/settings">
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Settings size={16} />
                                                    Editar Perfil
                                                </Button>
                                            </Link>
                                        ) : (
                                            <>
                                                <Link href={`/messages?to=${profile.username}`}>
                                                    <Button variant="outline" className="gap-2">
                                                        <span className="sr-only">Mensagem</span>
                                                        Message
                                                    </Button>
                                                </Link>
                                                <Button
                                                    onClick={handleFollowToggle}
                                                    variant={isFollowing ? "outline" : "primary"}
                                                    className={`gap-2 min-w-[120px] transition-all ${isFollowing ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' : ''}`}
                                                >
                                                    {isFollowing ? (
                                                        <>
                                                            <UserCheck size={18} />
                                                            Seguindo
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus size={18} />
                                                            Seguir
                                                        </>
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="flex items-center gap-2 text-ink">
                                        <Trophy size={18} className="text-accent" />
                                        <span className="font-bold">{profile.xp_points}</span>
                                        <span className="text-fade text-sm">XP</span>
                                    </div>
                                    <Link href={`/profile/${profile.username}/followers`} className="hover:opacity-75 transition-opacity">
                                        <div className="flex items-center gap-2 text-ink">
                                            <Users size={18} className="text-indigo-500" />
                                            <span className="font-bold">{followersCount}</span>
                                            <span className="text-fade text-sm">Seguidores</span>
                                        </div>
                                    </Link>
                                    <Link href={`/profile/${profile.username}/following`} className="hover:opacity-75 transition-opacity">
                                        <div className="flex items-center gap-2 text-ink">
                                            <Users size={18} className="text-emerald-500" />
                                            <span className="font-bold">{initialFollowingCount}</span>{/* Use prop or profile.following_count */}
                                            <span className="text-fade text-sm">Seguindo</span>
                                        </div>
                                    </Link>
                                </div>

                                {/* Bio & Meta */}
                                {profile.bio && (
                                    <p className="text-ink/80 leading-relaxed mb-4 max-w-2xl">
                                        {profile.bio}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-fade">
                                    {profile.favorite_genre && (
                                        <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-full">
                                            <Star size={14} className="text-amber-500" />
                                            <span>Fã de {profile.favorite_genre}</span>
                                        </div>
                                    )}
                                    {/* Created At */}
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>Entrou em {new Date(profile.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Tabs */}
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-transparent border-b border-stone-200 w-full justify-start h-auto p-0 rounded-none gap-8">
                            <TabsTrigger
                                value="overview"
                                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-3 text-fade data-[state=active]:text-ink hover:text-ink transition-colors font-medium text-base"
                            >
                                Visão Geral
                            </TabsTrigger>
                            <TabsTrigger
                                value="books"
                                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-3 text-fade data-[state=active]:text-ink hover:text-ink transition-colors font-medium text-base"
                            >
                                Estante ({initialBooks.length})
                            </TabsTrigger>
                            <TabsTrigger
                                value="reviews"
                                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent rounded-none px-0 py-3 text-fade data-[state=active]:text-ink hover:text-ink transition-colors font-medium text-base"
                            >
                                Resenhas ({initialReviews.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            {/* Simplified Overview: Recent Activity? Or just same as Books? 
                               For now, let's show Recents or Favorites if we had them.
                               I'll just show 'Recent Books'
                           */}
                            <div className="space-y-8">
                                <section>
                                    <h2 className="font-serif text-xl font-bold text-ink mb-4 flex items-center gap-2">
                                        <BookOpen size={20} className="text-accent" />
                                        Lendo Atualmente
                                    </h2>
                                    {initialBooks.filter(b => b.status === 'reading').length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {initialBooks.filter(b => b.status === 'reading').map(ub => (
                                                // Simplified Book Card or create a component
                                                <div key={ub.id} className="bg-white p-4 rounded-xl border border-stone-100 flex gap-4">
                                                    {/* We need book details joined. 
                                                        Wait, initialBooks needs to be a specific type with joined book.
                                                        See types.ts. UserBook doesn't have joined book.
                                                        I need to fetch it properly in Server Component.
                                                    */}
                                                    {/* Placeholder for now */}
                                                    <div className="flex-1">
                                                        <p className="font-bold text-ink">Livro ID: {ub.book_id}</p>
                                                        {/* We need to pass the full joined data from server */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-fade italic">Nenhuma leitura em andamento.</p>
                                    )}
                                </section>
                            </div>
                        </TabsContent>

                        <TabsContent value="books">
                            {/* Full List */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {/* Need book data mapping */}
                            </div>
                        </TabsContent>

                        <TabsContent value="reviews">
                            {/* Reviews List */}
                        </TabsContent>
                    </Tabs>

                </div>
            </main>
        </div>
    );
}
