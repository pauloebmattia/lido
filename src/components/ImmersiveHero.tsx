'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, BookOpen, User } from 'lucide-react';
import type { Book, Profile } from '@/lib/supabase/types';
import { VibeBadge } from './VibeBadge';

interface ImmersiveHeroProps {
    user: Profile | null;
    trendingBooks: Book[];
}

export function ImmersiveHero({ user, trendingBooks }: ImmersiveHeroProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/books?query=${encodeURIComponent(searchQuery)}`);
        }
    };

    // Decorate basic vibe tags for floating effect
    // We hardcode some popular vibes for the hero
    const HERO_VIBES = [
        { id: 'v1', label: 'Plot Twist', color: 'plottwist', icon: 'zap' },
        { id: 'v2', label: 'Choro Livre', color: 'choro', icon: 'cloud-rain' },
        { id: 'v3', label: 'Sombrio', color: 'sombrio', icon: 'moon' },
        { id: 'v4', label: 'Inspirador', color: 'inspirador', icon: 'sun' },
    ];

    return (
        <section className="relative overflow-hidden min-h-[600px] flex items-center justify-center pt-20 pb-16">
            {/* Background Collage Layer */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none select-none overflow-hidden">
                <div className="absolute -left-20 top-0 w-96 h-96 bg-accent rounded-full blur-[100px] opacity-20" />
                <div className="absolute -right-20 bottom-0 w-96 h-96 bg-orange-300 rounded-full blur-[100px] opacity-20" />

                {/* Floating Covers (Decorative) */}
                {trendingBooks.slice(0, 6).map((book, i) => (
                    <div
                        key={book.id}
                        className={`absolute w-32 md:w-48 transition-transform duration-[10s] ease-in-out
                            ${i === 0 ? 'top-10 left-10 -rotate-12 animate-float' : ''}
                            ${i === 1 ? 'top-20 right-10 rotate-12 animate-float-delayed' : ''}
                            ${i === 2 ? 'bottom-20 left-20 rotate-6 animate-float-delayed' : ''}
                            ${i === 3 ? 'bottom-32 right-32 -rotate-6 animate-float' : ''}
                            ${i > 3 ? 'hidden lg:block' : ''} 
                            ${i === 4 ? 'top-1/2 left-10 -rotate-3 opacity-50' : ''}
                            ${i === 5 ? 'top-1/2 right-10 rotate-3 opacity-50' : ''}
                        `}
                    >
                        {book.cover_url ? (
                            <img
                                src={book.cover_url}
                                alt=""
                                className="w-full rounded-lg shadow-xl drop-shadow-2xl opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                            />
                        ) : (
                            <div className="w-full aspect-[2/3] bg-stone-300 rounded-lg" />
                        )}
                    </div>
                ))}
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">

                {/* Floating Vibes (Centralized) */}
                <div className="flex flex-wrap justify-center gap-3 mb-8 opacity-90">
                    {HERO_VIBES.map((vibe, i) => (
                        <div key={vibe.id} className={i % 2 === 0 ? 'animate-float' : 'animate-float-delayed'}>
                            <VibeBadge vibe={vibe as any} size="md" />
                        </div>
                    ))}
                </div>

                <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 text-ink tracking-tight">
                    Descubra sua próxima <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400 italic pr-2">
                        grande leitura
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-fade max-w-2xl mx-auto mb-10 leading-relaxed">
                    Junte-se à comunidade onde leitores compartilham estantes reais, vibrações e histórias inesquecíveis.
                </p>

                {/* Big Search Bar */}
                <form onSubmit={handleSearch} className="max-w-xl mx-auto relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="text-accent h-6 w-6" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="O que você quer ler hoje?"
                        className="w-full py-5 pl-14 pr-6 rounded-full bg-paper border-2 border-stone-200 shadow-lg text-lg text-ink placeholder:text-stone-400 focus:border-accent focus:shadow-xl focus:outline-none transition-all"
                    />
                    <button
                        type="submit"
                        className="absolute right-3 top-2.5 bottom-2.5 bg-ink text-paper px-6 rounded-full font-medium hover:bg-stone-800 transition-colors"
                    >
                        Buscar
                    </button>
                </form>

                {/* Social Proof */}
                <div className="mt-12 flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-paper bg-stone-200 flex items-center justify-center overflow-hidden">
                                <User size={20} className="text-stone-400" />
                            </div>
                        ))}
                    </div>
                    <div className="text-left">
                        <div className="flex items-center gap-1">
                            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-sm font-bold text-ink">+200 leitores</span>
                        </div>
                        <p className="text-xs text-fade">conectados agora</p>
                    </div>
                </div>

            </div>
        </section>
    );
}
