import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { BookCard } from '@/components/BookCard';
import { Tagline } from '@/components/Logo';
import { DEFAULT_VIBES } from '@/components/VibeBadge';
import type { Book } from '@/lib/supabase/types';

export default async function HomePage() {
  const supabase = await createClient();

  // Buscar usuário e perfil
  const { data: { user: authUser } } = await supabase.auth.getUser();
  let user = null;

  if (authUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    user = profile;
  }

  // Buscar livros em alta (por enquanto, os 4 primeiros recentes)
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .limit(4)
    .order('created_at', { ascending: false });

  const trendingBooks: Book[] = books || [];

  return (
    <div className="min-h-screen bg-paper">
      <NavBar user={user} />

      {/* Main Content */}
      <main className="pt-20 pb-16 page-transition">
        {/* Hero Section */}
        <section className="hero-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto animate-fade-in">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-gradient">Descubra sua próxima</span>
                <br />
                <span className="text-accent">grande leitura</span>
              </h1>
              <Tagline className="mt-4 text-lg" />

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/books" className="btn-ink btn-shimmer py-3 px-8 text-base">
                  Explorar Livros
                </Link>
                {!user && (
                  <Link href="/register" className="btn-ghost py-3 px-8 text-base">
                    Criar Conta Grátis
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trending Books */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-accent" size={24} />
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
                Em Alta Esta Semana
              </h2>
            </div>
            <Link
              href="/books?sort=trending"
              className="text-accent hover:underline text-sm font-medium"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 stagger-children">
            {trendingBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                vibes={index === 0 ? [DEFAULT_VIBES[0], DEFAULT_VIBES[5]] : index === 1 ? [DEFAULT_VIBES[1], DEFAULT_VIBES[4]] : undefined}
                variant={index === 0 ? 'featured' : 'default'}
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {/* Curate */}
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-accent" size={28} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink mb-2">
                Curadoria Visual
              </h3>
              <p className="text-fade">
                Organize sua estante virtual com capas de alta qualidade e listas personalizadas.
              </p>
            </div>

            {/* Vibes */}
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-accent" size={28} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink mb-2">
                Vibe Tags
              </h3>
              <p className="text-fade">
                Descubra livros pela emoção que transmitem: Tensão, Choro, Plot Twist e mais.
              </p>
            </div>

            {/* Community */}
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-accent" size={28} />
              </div>
              <h3 className="font-serif text-xl font-semibold text-ink mb-2">
                Comunidade
              </h3>
              <p className="text-fade">
                Siga leitores, acompanhe reviews e descubra o que seus amigos estão lendo.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section - Only show for non-authenticated users */}
        {!user && (
          <section className="bg-ink text-paper py-16 mt-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
                Pronto para começar?
              </h2>
              <p className="text-stone-300 text-lg mb-8">
                Junte-se a milhares de leitores que já estão compartilhando suas histórias.
              </p>
              <Link
                href="/register"
                className="inline-block bg-paper text-ink rounded-full py-3 px-8 font-medium hover:bg-stone-100 transition-colors"
              >
                Criar Conta Grátis
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold uppercase tracking-widest text-ink">
                LIDO
              </span>
              <span className="text-fade text-sm">
                © 2026
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-fade">
              <Link href="/about" className="hover:text-ink transition-colors">Sobre</Link>
              <Link href="/privacy" className="hover:text-ink transition-colors">Privacidade</Link>
              <Link href="/terms" className="hover:text-ink transition-colors">Termos</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
