'use client';

import { NavBar } from '@/components/NavBar';
import { ActivityFeed } from '@/components/ActivityFeed';
import { Button } from '@/components/ui/Button';
import { TrendingUp, Users, Sparkles } from 'lucide-react';

const TRENDING_TAGS = [
    { name: 'Fantasia', count: 234 },
    { name: 'Romance', count: 189 },
    { name: 'Ficção Científica', count: 156 },
    { name: 'Suspense', count: 98 },
];

const SUGGESTED_USERS = [
    { username: 'julialeitora', displayName: 'Julia Costa', mutualFollowers: 5 },
    { username: 'marcosbooks', displayName: 'Marcos Oliveira', mutualFollowers: 3 },
    { username: 'anareads', displayName: 'Ana Souza', mutualFollowers: 8 },
];

export default function FeedPage() {
    const user = null; // Will come from auth

    return (
        <div className="min-h-screen bg-paper">
            <NavBar user={user} />

            <main className="pt-20 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Feed */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="font-serif text-2xl font-bold text-ink">Feed</h1>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <Sparkles size={16} />
                                        Para você
                                    </Button>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <Users size={16} />
                                        Seguindo
                                    </Button>
                                </div>
                            </div>

                            <ActivityFeed />
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Trending Tags */}
                            <div className="card p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={18} className="text-accent" />
                                    <h2 className="font-serif font-semibold text-ink">Em Alta</h2>
                                </div>
                                <div className="space-y-3">
                                    {TRENDING_TAGS.map((tag, index) => (
                                        <div
                                            key={tag.name}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-fade">#{index + 1}</span>
                                            <span className="flex-1 ml-3 font-medium text-ink">
                                                {tag.name}
                                            </span>
                                            <span className="text-fade">{tag.count} livros</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Suggested Users */}
                            <div className="card p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users size={18} className="text-accent" />
                                    <h2 className="font-serif font-semibold text-ink">Sugestões</h2>
                                </div>
                                <div className="space-y-4">
                                    {SUGGESTED_USERS.map((suggested) => (
                                        <div
                                            key={suggested.username}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center font-medium text-sm">
                                                {suggested.displayName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-ink text-sm truncate">
                                                    {suggested.displayName}
                                                </p>
                                                <p className="text-xs text-fade">
                                                    {suggested.mutualFollowers} seguidores em comum
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                Seguir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Footer Links */}
                            <div className="text-xs text-fade space-y-2 px-2">
                                <div className="flex flex-wrap gap-2">
                                    <a href="#" className="hover:text-ink">Sobre</a>
                                    <span>·</span>
                                    <a href="#" className="hover:text-ink">Termos</a>
                                    <span>·</span>
                                    <a href="#" className="hover:text-ink">Privacidade</a>
                                    <span>·</span>
                                    <a href="#" className="hover:text-ink">Ajuda</a>
                                </div>
                                <p>© 2026 Lido. Onde as histórias ficam.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
