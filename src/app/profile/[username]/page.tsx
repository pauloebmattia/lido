'use client';

import { useState, useEffect, use } from 'react';
import { BookOpen, Users, Star, Calendar, Settings, Grid, Loader2, UserPlus, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { BookCard } from '@/components/BookCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import type { Book, Profile } from '@/lib/supabase/types';

const TABS = [
    { id: 'books', label: 'Livros', icon: BookOpen },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'lists', label: 'Listas', icon: Grid },
    { id: 'following', label: 'Seguindo', icon: Users },
];

import { EditProfileModal } from '@/components/EditProfileModal';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [recentBooks, setRecentBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [supabase] = useState(() => createClient());

    const activeTab = 'books';

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Fetch current logged-in user for NavBar
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: currentProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                setCurrentUser(currentProfile);
            }

            // Fetch the profile being viewed
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();

            if (profileData) {
                setProfile(profileData);

                // Fetch user's recent books
                const { data: userBooks } = await supabase
                    .from('user_books')
                    .select(`
                        book:books (*)
                    `)
                    .eq('user_id', profileData.id)
                    .eq('status', 'read')
                    .order('finished_at', { ascending: false })
                    .limit(4);

                if (userBooks) {
                    const books = userBooks
                        .filter((ub: any) => ub.book)
                        .map((ub: any) => ub.book as Book);
                    setRecentBooks(books);
                }

                // Check if current user is following this profile
                if (authUser && authUser.id !== profileData.id) {
                    const followRes = await fetch(`/api/follows?user_id=${profileData.id}`);
                    if (followRes.ok) {
                        const followData = await followRes.json();
                        setIsFollowing(followData.isFollowing);
                    }
                }
            }

            setLoading(false);
        }

        loadData();
    }, [username, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={currentUser} />
                <div className="pt-32 flex justify-center">
                    <Loader2 className="animate-spin text-fade" size={32} />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar user={currentUser} />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-ink">Perfil não encontrado</h1>
                    <p className="text-fade mt-2">O usuário @{username} não existe.</p>
                    <Link href="/" className="text-accent hover:underline mt-4 inline-block">
                        Voltar ao início
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === profile.id;
    const levelProgress = (profile.xp_points % 1000) / 10;

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={currentUser} />

            <main className="pt-20 pb-16">
                {/* Profile Header */}
                <section className="bg-gradient-to-b from-stone-100 to-paper">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.display_name || profile.username}
                                    className="w-28 h-28 rounded-full object-cover border-4 border-paper shadow-lg"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-ink text-paper flex items-center justify-center text-4xl font-bold border-4 border-paper shadow-lg">
                                    {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <h1 className="font-serif text-3xl font-bold text-ink">
                                        {profile.display_name || profile.username}
                                    </h1>
                                    <Badge variant="info">Nível {profile.level}</Badge>
                                </div>
                                <p className="text-fade">@{profile.username}</p>

                                {profile.bio && (
                                    <p className="mt-3 text-ink max-w-xl">{profile.bio}</p>
                                )}

                                {/* Stats */}
                                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-6 text-sm">
                                    <div className="text-center sm:text-left">
                                        <span className="font-bold text-ink text-lg">{profile.books_read}</span>
                                        <span className="text-fade ml-1">livros</span>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <span className="font-bold text-ink text-lg">{profile.reviews_count}</span>
                                        <span className="text-fade ml-1">reviews</span>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <span className="font-bold text-ink text-lg">{profile.followers_count.toLocaleString()}</span>
                                        <span className="text-fade ml-1">seguidores</span>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <span className="font-bold text-ink text-lg">{profile.following_count}</span>
                                        <span className="text-fade ml-1">seguindo</span>
                                    </div>
                                </div>

                                {/* Level Progress */}
                                <div className="mt-4 max-w-xs">
                                    <div className="flex items-center justify-between text-xs text-fade mb-1">
                                        <span>{profile.xp_points} XP</span>
                                        <span>Nível {profile.level + 1}</span>
                                    </div>
                                    <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent rounded-full transition-all"
                                            style={{ width: `${levelProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                {isOwnProfile ? (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                            <Settings size={18} className="mr-2" />
                                            Editar Perfil
                                        </Button>
                                        <Link href="/publish">
                                            <Button variant="secondary" size="sm" className="hidden sm:flex text-accent hover:bg-accent hover:text-white">
                                                <BookOpen size={18} className="mr-2" />
                                                Área do Autor
                                            </Button>
                                        </Link>
                                    </>
                                ) : currentUser ? (
                                    <>
                                        <Button
                                            size="sm"
                                            variant={isFollowing ? 'ghost' : 'primary'}
                                            disabled={followLoading}
                                            onClick={async () => {
                                                setFollowLoading(true);
                                                try {
                                                    if (isFollowing) {
                                                        await fetch(`/api/follows?user_id=${profile.id}`, { method: 'DELETE' });
                                                        setIsFollowing(false);
                                                        setProfile(p => p ? { ...p, followers_count: p.followers_count - 1 } : p);
                                                    } else {
                                                        await fetch('/api/follows', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ user_id: profile.id })
                                                        });
                                                        setIsFollowing(true);
                                                        setProfile(p => p ? { ...p, followers_count: p.followers_count + 1 } : p);
                                                    }
                                                } finally {
                                                    setFollowLoading(false);
                                                }
                                            }}
                                        >
                                            {isFollowing ? (
                                                <><UserCheck size={18} className="mr-2" />Seguindo</>
                                            ) : (
                                                <><UserPlus size={18} className="mr-2" />Seguir</>
                                            )}
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            Mensagem
                                        </Button>
                                    </>
                                ) : (
                                    <Link href="/login">
                                        <Button size="sm">Entre para seguir</Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs */}
                <section className="border-b border-stone-200 sticky top-16 bg-paper z-10">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex gap-8 overflow-x-auto">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`flex items-center gap-2 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-ink text-ink font-medium'
                                        : 'border-transparent text-fade hover:text-ink'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </section>

                {/* Content */}
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Reading Stats */}
                    <div className="card p-6 mb-8">
                        <h2 className="font-serif text-xl font-semibold text-ink mb-4">
                            Estatísticas
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-ink">{profile.books_read}</p>
                                <p className="text-sm text-fade">Livros lidos</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-ink">{profile.reviews_count}</p>
                                <p className="text-sm text-fade">Reviews</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-ink">{profile.xp_points}</p>
                                <p className="text-sm text-fade">XP Total</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-ink">{profile.level}</p>
                                <p className="text-sm text-fade">Nível</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Books */}
                    {recentBooks.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-serif text-xl font-semibold text-ink">
                                    Livros Recentes
                                </h2>
                                <Link href={`/profile/${profile.username}/books`} className="text-accent text-sm hover:underline">
                                    Ver todos →
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {recentBooks.map((book) => (
                                    <BookCard key={book.id} book={book} showActions={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {recentBooks.length === 0 && (
                        <div className="text-center py-12 text-fade">
                            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum livro lido ainda.</p>
                        </div>
                    )}
                </section>
            </main>

            <EditProfileModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                profile={profile}
                onProfileUpdate={(updated) => {
                    setProfile(updated);
                    // Also update currentUser if it's the same person (it is)
                    setCurrentUser(updated);
                }}
            />
        </div>
    );
}
