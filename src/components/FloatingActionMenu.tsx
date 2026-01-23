'use client';

import { useState } from 'react';
import { Plus, BookPlus, ListPlus, X, PenTool } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/lib/supabase/types';

export function FloatingActionMenu({ user, onAddBook }: { user?: Profile | null, onAddBook?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Hide on auth pages or if not logged in
    // Hide on auth pages or if not logged in
    if (!user) return null;
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isMessagesPage = pathname.startsWith('/messages');
    const isProfilePage = pathname.startsWith('/profile');

    if (isAuthPage || isMessagesPage || isProfilePage) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Menu Items */}
            {isOpen && (
                <div className="flex flex-col gap-3 mb-2 animate-fade-in-up relative z-50">
                    <Link
                        href="/publish"
                        className="flex items-center gap-3 bg-white text-ink px-4 py-3 rounded-full shadow-lg border border-stone-100 hover:bg-stone-50 transition-all hover:scale-105 group"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="font-medium text-sm">Publicar Obra Indie</span>
                        <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                            <PenTool size={18} />
                        </div>
                    </Link>

                    <Link
                        href="/lists?action=new"
                        className="flex items-center gap-3 bg-white text-ink px-4 py-3 rounded-full shadow-lg border border-stone-100 hover:bg-stone-50 transition-all hover:scale-105 group"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="font-medium text-sm">Criar Lista</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <ListPlus size={18} />
                        </div>
                    </Link>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            onAddBook?.();
                        }}
                        className="flex items-center gap-3 bg-white text-ink px-4 py-3 rounded-full shadow-lg border border-stone-100 hover:bg-stone-50 transition-all hover:scale-105 group"
                    >
                        <span className="font-medium text-sm">Adicionar Livro</span>
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                            <BookPlus size={18} />
                        </div>
                    </button>
                </div>
            )}

            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative z-50
                    ${isOpen ? 'bg-stone-800 rotate-45' : 'bg-accent hover:scale-110'}
                `}
                aria-label="Adicionar"
            >
                <Plus className="text-white" size={28} />
            </button>

            {/* Backdrop for click outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
