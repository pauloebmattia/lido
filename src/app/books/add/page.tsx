'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, BookOpen, Loader2, Upload } from 'lucide-react';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { VibeBadge, VibePickerOption, DEFAULT_VIBES } from '@/components/VibeBadge';
import { Button } from '@/components/ui/Button';
import { useBookActions } from '@/hooks/useBookActions';
import { createClient } from '@/lib/supabase/client';
import type { CleanBookData } from '@/lib/google-books';
import type { Vibe, Profile } from '@/lib/supabase/types';

function AddBookContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const googleId = searchParams.get('google_id');

    const [book, setBook] = useState<CleanBookData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Review state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
    const [reviewContent, setReviewContent] = useState('');
    const [readingStatus, setReadingStatus] = useState<string>('want-to-read');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    // Fetch book data
    useEffect(() => {
        if (!googleId) {
            setError('ID do livro não encontrado');
            setIsLoading(false);
            return;
        }

        const fetchBook = async () => {
            try {
                const response = await fetch(`/api/books/${googleId}`);
                if (!response.ok) {
                    throw new Error('Livro não encontrado');
                }
                const data = await response.json();
                setBook(data.book);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao carregar livro');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBook();
    }, [googleId]);

    // Get user and book actions
    const [user, setUser] = useState<Profile | null>(null);
    const [supabase] = useState(() => createClient());
    const { addBookToDatabase } = useBookActions();

    // Fetch current user on mount
    useEffect(() => {
        async function fetchUser() {
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
        fetchUser();
    }, [supabase]);

    // Handle cover file selection
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setCoverPreview(previewUrl);
        }
    };

    const handleVibeToggle = (vibe: Vibe) => {
        setSelectedVibes((prev) => {
            if (prev.find((v) => v.id === vibe.id)) {
                return prev.filter((v) => v.id !== vibe.id);
            }
            if (prev.length >= 3) return prev;
            return [...prev, vibe];
        });
    };

    const handleSubmit = async () => {
        if (!book) return;

        setIsSubmitting(true);
        setError('');

        try {
            // 1. Add book to database (or get existing)
            const savedBook = await addBookToDatabase(book);

            if (!savedBook) {
                throw new Error('Não foi possível salvar o livro');
            }

            // 1.5 Upload cover if user provided one
            if (coverFile && savedBook.id) {
                const fileExt = coverFile.name.split('.').pop();
                const fileName = `${savedBook.id}.${fileExt}`;
                const filePath = `covers/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('book-covers')
                    .upload(filePath, coverFile, { upsert: true });

                if (!uploadError) {
                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('book-covers')
                        .getPublicUrl(filePath);

                    // Update book with cover URL
                    await supabase
                        .from('books')
                        .update({ cover_url: publicUrl, cover_thumbnail: publicUrl })
                        .eq('id', savedBook.id);
                } else {
                    console.warn('Cover upload failed:', uploadError);
                }
            }

            // 2. Set reading status
            const statusResponse = await fetch('/api/user-books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    book_id: savedBook.id,
                    status: readingStatus
                }),
            });

            if (!statusResponse.ok) {
                const data = await statusResponse.json();
                throw new Error(data.error || 'Erro ao definir status');
            }

            // 3. Optionally submit review if rating is provided
            if (rating > 0) {
                const reviewResponse = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        book_id: savedBook.id,
                        rating,
                        content: reviewContent || null,
                        vibes: selectedVibes.map(v => v.id),
                        contains_spoilers: false,
                    }),
                });

                if (!reviewResponse.ok) {
                    console.warn('Review não foi salva, mas livro foi adicionado');
                }
            }

            router.push('/my-books');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao adicionar livro');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="min-h-screen bg-paper">
                <NavBar />
                <main className="pt-20 pb-16">
                    <div className="max-w-2xl mx-auto px-4 text-center py-16">
                        <p className="text-fade text-lg">{error || 'Livro não encontrado'}</p>
                        <Link href="/books">
                            <Button variant="ghost" className="mt-4">
                                <ArrowLeft size={18} className="mr-2" />
                                Voltar para explorar
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper">
            <NavBar />

            <main className="pt-20 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <Link
                        href="/books"
                        className="inline-flex items-center gap-2 text-fade hover:text-ink transition-colors py-4"
                    >
                        <ArrowLeft size={18} />
                        <span>Voltar</span>
                    </Link>

                    {/* Book Info */}
                    <div className="card p-6 mt-4">
                        <div className="flex gap-6">
                            {coverPreview ? (
                                <img
                                    src={coverPreview}
                                    alt="Capa selecionada"
                                    className="w-32 h-auto rounded-xl shadow-lg flex-shrink-0"
                                />
                            ) : book.cover_url ? (
                                <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="w-32 h-auto rounded-xl shadow-lg flex-shrink-0"
                                />
                            ) : (
                                <label className="w-32 h-48 bg-stone-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-stone-300 flex-shrink-0 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="hidden"
                                    />
                                    <Upload className="text-stone-400 mb-2" size={24} />
                                    <span className="text-xs text-stone-400 text-center px-2">Clique para adicionar capa</span>
                                </label>
                            )}
                            <div>
                                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                                    {book.title}
                                </h1>
                                <p className="text-lg text-fade mt-1">
                                    {book.authors.join(', ')}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-4 text-sm text-fade">
                                    {book.publisher && (
                                        <span>{book.publisher}</span>
                                    )}
                                    {book.published_date && (
                                        <span>{book.published_date.substring(0, 4)}</span>
                                    )}
                                    {book.page_count && (
                                        <span className="flex items-center gap-1">
                                            <BookOpen size={14} />
                                            {book.page_count} páginas
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reading Status */}
                    <div className="card p-6 mt-6">
                        <h2 className="font-serif text-xl font-semibold text-ink mb-4">
                            Status de Leitura
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { value: 'want-to-read', label: 'Quero Ler' },
                                { value: 'reading', label: 'Lendo' },
                                { value: 'read', label: 'Lido' },
                                { value: 'dnf', label: 'Abandonei' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setReadingStatus(option.value)}
                                    className={`p-3 rounded-xl border-2 transition-all text-center ${readingStatus === option.value
                                        ? 'border-accent bg-accent/5 text-accent font-medium'
                                        : 'border-stone-200 text-fade hover:border-stone-300'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating (optional) */}
                    <div className="card p-6 mt-6">
                        <h2 className="font-serif text-xl font-semibold text-ink mb-4">
                            Sua Avaliação <span className="text-fade font-normal text-base">(opcional)</span>
                        </h2>

                        {/* Stars */}
                        <div className="flex items-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={36}
                                        className={
                                            star <= (hoverRating || rating)
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-stone-300'
                                        }
                                    />
                                </button>
                            ))}
                            <span className="ml-4 text-2xl font-serif font-bold text-ink">
                                {rating > 0 ? rating : '-'}
                            </span>
                        </div>

                        {/* Vibes */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-ink">Vibes do livro</label>
                                <span className="text-xs text-fade">{selectedVibes.length}/3</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {DEFAULT_VIBES.map((vibe) => (
                                    <VibePickerOption
                                        key={vibe.id}
                                        vibe={vibe}
                                        selected={selectedVibes.some((v) => v.id === vibe.id)}
                                        onToggle={handleVibeToggle}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Review Text */}
                        <div>
                            <label className="block text-sm font-medium text-ink mb-2">
                                Sua review
                            </label>
                            <textarea
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                placeholder="O que você achou deste livro?"
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-ink placeholder:text-fade focus:outline-none focus:border-accent resize-none"
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-8 flex justify-end gap-4">
                        <Link href="/books">
                            <Button variant="ghost">Cancelar</Button>
                        </Link>
                        <Button onClick={handleSubmit} isLoading={isSubmitting}>
                            Adicionar Livro
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AddBookPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        }>
            <AddBookContent />
        </Suspense>
    );
}
