'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, X, User, Bell, BookPlus, LogOut, Settings } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { SearchModal } from '@/components/SearchModal';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/components/NotificationBell';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import type { CleanBookData } from '@/lib/google-books';

interface NavBarProps {
    user?: Profile | null;
}

export function NavBar({ user }: NavBarProps) {
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push('/');
    };

    const handleSelectBook = (book: CleanBookData) => {
        setSearchOpen(false);
        // Navigate to book detail or add flow
        if (book.google_books_id) {
            router.push(`/books/add?google_id=${book.google_books_id}`);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 glass-nav border-b border-stone-200/50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Logo linkToHome />

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/books" className="text-fade hover:text-ink transition-colors">
                                Explorar
                            </Link>
                            {user && (
                                <Link href="/my-books" className="text-fade hover:text-ink transition-colors">
                                    Meus Livros
                                </Link>
                            )}
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            {/* Search Button */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="p-2 text-fade hover:text-ink transition-colors"
                                aria-label="Buscar livros"
                            >
                                <Search size={20} />
                            </button>

                            {user ? (
                                <>
                                    {/* Add Book Button */}
                                    <button
                                        onClick={() => setSearchOpen(true)}
                                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-full transition-colors"
                                    >
                                        <BookPlus size={18} />
                                        <span>Adicionar</span>
                                    </button>

                                    {/* Notifications */}
                                    <NotificationBell />

                                    {/* User Avatar Dropdown */}
                                    <div className="relative ml-2">
                                        <button
                                            onClick={() => setProfileOpen(!profileOpen)}
                                            className="block outline-none"
                                        >
                                            {user.avatar_url ? (
                                                <img
                                                    src={user.avatar_url}
                                                    alt={user.display_name || user.username}
                                                    className="w-9 h-9 rounded-full object-cover ring-2 ring-stone-200 hover:ring-accent transition-all"
                                                    referrerPolicy="no-referrer"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-medium hover:bg-zinc-800 transition-colors">
                                                    {(user.display_name || user.username).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        {profileOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-30"
                                                    onClick={() => setProfileOpen(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-paper rounded-xl shadow-xl border border-stone-200 py-1 z-40 animate-fade-in-up">
                                                    <div className="px-4 py-3 border-b border-stone-100">
                                                        <p className="text-sm font-medium text-ink truncate">
                                                            {user.display_name || user.username}
                                                        </p>
                                                        <p className="text-xs text-fade truncate">
                                                            @{user.username}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href={`/profile/${user.username}`}
                                                        className="flex items-center gap-2 px-4 py-2text-sm text-ink hover:bg-stone-50 transition-colors"
                                                        onClick={() => setProfileOpen(false)}
                                                    >
                                                        <User size={16} className="text-fade" />
                                                        <span className="text-sm">Meu Perfil</span>
                                                    </Link>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <LogOut size={16} />
                                                        <span>Sair</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">
                                            Entrar
                                        </Button>
                                    </Link>
                                    <Link href="/register" className="hidden sm:block">
                                        <Button size="sm">Criar Conta</Button>
                                    </Link>
                                </>
                            )}

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-fade hover:text-ink transition-colors"
                                aria-label="Menu"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-stone-200/50">
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/books"
                                    className="px-4 py-2 text-fade hover:text-ink transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Explorar
                                </Link>
                                {user && (
                                    <>
                                        <Link
                                            href={`/profile/${user.username}`}
                                            className="px-4 py-2 text-fade hover:text-ink transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Meu Perfil
                                        </Link>
                                        <Link
                                            href="/my-books"
                                            className="px-4 py-2 text-fade hover:text-ink transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Meus Livros
                                        </Link>
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="px-4 py-2 text-red-600 hover:bg-red-50 text-left transition-colors font-medium"
                                        >
                                            Sair da conta
                                        </button>
                                    </>
                                )}
                                {!user && (
                                    <Link
                                        href="/register"
                                        className="px-4 py-2 text-accent font-medium"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Criar Conta
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Search Modal */}
            <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onSelectBook={handleSelectBook}
            />
        </>
    );
}
