import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { TrendingUp, Sparkles, BookOpen, Users } from 'lucide-react';
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

  // Buscar livros em alta (algoritmo dinâmico baseado em atividade recente)
  // Score: reviews = 3pts, bookmarks = 1pt, lendo = 2pts (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // Get recent reviews (last 7 days)
  const { data: recentReviews } = await supabase
    .from('reviews')
    .select('book_id')
    .gte('created_at', sevenDaysAgoISO);

  // Get recent user_books activity (bookmarks and reading status)
  const { data: recentUserBooks } = await supabase
    .from('user_books')
    .select('book_id, status')
    .gte('updated_at', sevenDaysAgoISO);

  // Calculate scores
  const bookScores: Record<string, number> = {};

  // Reviews = 3 points each
  recentReviews?.forEach(r => {
    bookScores[r.book_id] = (bookScores[r.book_id] || 0) + 3;
  });

  // User books: bookmark (quero_ler) = 1pt, reading (lendo) = 2pts
  recentUserBooks?.forEach(ub => {
    const points = ub.status === 'lendo' ? 2 : (ub.status === 'quero_ler' ? 1 : 0);
    if (points > 0) {
      bookScores[ub.book_id] = (bookScores[ub.book_id] || 0) + points;
    }
  });

  // Sort by score and get top 4 book IDs
  const sortedBookIds = Object.entries(bookScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([id]) => id);

  let trendingBooks: Book[] = [];

  if (sortedBookIds.length > 0) {
    const { data: scoredBooks } = await supabase
      .from('books')
      .select('*')
      .in('id', sortedBookIds);

    if (scoredBooks) {
      // Maintain score order
      trendingBooks = sortedBookIds
        .map(id => scoredBooks.find(b => b.id === id))
        .filter((b): b is Book => b !== undefined);
    }
  }

  // Fallback: if not enough trending, fill with recent books
  if (trendingBooks.length < 4) {
    const excludeIds = trendingBooks.map(b => b.id);
    const { data: recentBooks } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4 - trendingBooks.length);

    if (recentBooks) {
      const filtered = recentBooks.filter(b => !excludeIds.includes(b.id));
      trendingBooks = [...trendingBooks, ...filtered].slice(0, 4);
    }
  }



  // Buscar atividade dos amigos (Se logado)
  let friendsBooks: any[] = [];
  if (user) {
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (following && following.length > 0) {
      const followingIds = following.map(f => f.following_id);

      const { data: activity } = await supabase
        .from('user_books')
        .select(`
                status,
                updated_at,
                book:books!book_id(*),
                user:profiles!user_id(username, display_name, avatar_url)
            `)
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (activity) {
        const bookMap = new Map();
        activity.forEach((item: any) => {
          if (!item.book) return;
          if (!bookMap.has(item.book.id)) {
            bookMap.set(item.book.id, {
              ...item.book,
              friends_interaction: []
            });
          }
          const entry = bookMap.get(item.book.id);
          // Avoid duplicate users
          if (!entry.friends_interaction.some((f: any) => f.username === item.user.username)) {
            entry.friends_interaction.push(item.user);
          }
        });
        friendsBooks = Array.from(bookMap.values()).slice(0, 4);
      }
    }
  }

  // Buscar livros indie (Recent Early Access)
  const { data: indieBooks } = await supabase
    .from('early_access_books')
    .select(`
      book:books!inner(*)
    `)
    .limit(4)
    .order('created_at', { ascending: false });

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

        {/* Friends Activity Section */}
        {friendsBooks.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-stone-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users className="text-accent" size={24} />
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
                  O que seus amigos estão lendo
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {friendsBooks.map((book) => (
                <div key={book.id} className="card p-4 flex gap-4 hover:border-accent/30 transition-colors group">
                  <Link href={`/books/${book.id}`} className="shrink-0">
                    {book.cover_thumbnail ? (
                      <img
                        src={book.cover_thumbnail}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded shadow-sm group-hover:shadow-md transition-all"
                      />
                    ) : (
                      <div className="w-20 h-28 bg-stone-100 rounded flex items-center justify-center">
                        <BookOpen className="text-stone-300" size={24} />
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-col justify-between min-w-0">
                    <div>
                      <Link href={`/books/${book.id}`}>
                        <h3 className="font-medium text-ink line-clamp-2 leading-tight Group-hover:text-accent transition-colors">
                          {book.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-fade mt-1 line-clamp-1">{book.authors?.join(', ')}</p>
                    </div>

                    <div className="mt-3">
                      <div className="flex -space-x-2 overflow-hidden mb-1">
                        {book.friends_interaction.slice(0, 3).map((friend: any, i: number) => (
                          <img
                            key={i}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                            src={friend.avatar_url || '/default-avatar.png'}
                            alt={friend.display_name}
                            title={friend.display_name || friend.username}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-fade">
                        {book.friends_interaction.length} amigo{book.friends_interaction.length > 1 ? 's' : ''} interagiu
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

        {/* Indie Spotlight Section */}
        {indieBooks && indieBooks.length > 0 && (
          <section className="bg-stone-50 border-y border-stone-100 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-pink-500" size={24} />
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
                      Destaques Indie
                    </h2>
                    <p className="text-fade text-sm mt-1">Autoras e autores independentes para você descobrir</p>
                  </div>
                </div>
                <Link
                  href="/books/indie"
                  className="text-pink-600 hover:underline text-sm font-medium"
                >
                  Ver todos →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {indieBooks.map((item: any) => (
                  <BookCard
                    key={item.book.id}
                    book={item.book}
                    variant="default"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

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
    </div >
  );
}
