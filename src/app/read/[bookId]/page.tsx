'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// We need to dynamically import PDFViewer to avoid SSR issues with canvas
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';

const PDFViewerDynamic = dynamic(() => import('@/components/readers/PDFViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-screen bg-stone-100">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
    ),
});

const EpubViewerDynamic = dynamic(() => import('@/components/readers/EpubViewer'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-screen bg-stone-100">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
    ),
});

interface BookData {
    title: string;
    file_type: 'pdf' | 'epub';
    file_path: string;
    is_approved: boolean;
    author_id: string;
    book_id: string; // Ensure this is part of the interface
}

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter();
    const [book, setBook] = useState<BookData | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [initialState, setInitialState] = useState<{ page: number; location: string | number } | null>(null);
    const [progressTimeout, setProgressTimeout] = useState<NodeJS.Timeout | null>(null);

    // Debounce save function
    const saveProgress = async (page: number, location: string | number, percentage: number) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Use functional state or check if book is available. 
        // Since this is called from callback, 'book' from closure might be stale if not careful, 
        // but 'book' doesn't change after load.
        if (!user || !book?.book_id) return;

        console.log('Saving progress:', { page, location, percentage });

        // Update user_books
        const { error } = await supabase
            .from('user_books')
            .upsert({
                user_id: user.id,
                book_id: book.book_id,
                current_page: page,
                last_location: String(location),
                progress_percent: percentage,
                status: 'reading',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,book_id' });

        if (error) {
            console.error('Error saving progress:', error);
        }
    };

    const handleProgressChange = (location: string | number, percentage: number, page: number = 0) => {
        if (progressTimeout) clearTimeout(progressTimeout);

        const timeout = setTimeout(() => {
            saveProgress(page, location, percentage);
        }, 2000); // Save every 2 seconds of inactivity

        setProgressTimeout(timeout);
    };

    useEffect(() => {
        const fetchBookAndFile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // 1. Fetch Book Metadata
            const { data: bookData, error: bookError } = await supabase
                .from('early_access_books')
                .select(`
                    id,
                    book_id,
                    file_type,
                    file_path,
                    is_approved,
                    author_id,
                    book:book_id (
                        title
                    )
                `)
                .eq('book_id', params.bookId)
                .single();

            if (bookError || !bookData) {
                console.error('Error fetching book:', bookError);
                setError('Livro não encontrado ou erro de acesso.');
                setIsLoading(false);
                return;
            }

            // 2. Check Permissions
            const isAuthor = bookData.author_id === user.id;
            let isAdmin = false;

            if (!bookData.is_approved && !isAuthor) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('level')
                    .eq('id', user.id)
                    .single();
                isAdmin = (profile?.level ?? 0) >= 10;
            }

            if (!bookData.is_approved && !isAuthor && !isAdmin) {
                setError('Este livro ainda não foi aprovado para leitura.');
                setIsLoading(false);
                return;
            }

            // 3. Generate Signed URL
            const { data: fileData, error: fileError } = await supabase
                .storage
                .from('book-files')
                .createSignedUrl(bookData.file_path, 3600);

            if (fileError || !fileData) {
                console.error('Error generating signed URL:', fileError);
                setError('Erro ao carregar o arquivo do livro.');
                setIsLoading(false);
                return;
            }

            // 4. Fetch User Progress
            const { data: progressData } = await supabase
                .from('user_books')
                .select('current_page, last_location, progress_percent')
                .eq('user_id', user.id)
                .eq('book_id', bookData.book_id)
                .single();

            if (progressData) {
                setInitialState({
                    page: progressData.current_page || 1,
                    location: progressData.last_location || 0
                });
            } else {
                setInitialState({ page: 1, location: 0 });
            }

            // @ts-ignore
            setBook({
                // @ts-ignore
                title: (bookData as any)?.book?.title || 'Livro',
                file_type: (bookData as any).file_type as 'pdf' | 'epub',
                book_id: (bookData as any).book_id,
                ...(bookData as any)
            });
            setFileUrl(fileData.signedUrl);
            setIsLoading(false);
        };

        fetchBookAndFile();
    }, [params.bookId, router]);

    if (isLoading || !initialState) {
        return (
            <div className="flex items-center justify-center h-screen bg-paper">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (error || !book || !fileUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-paper p-4 text-center">
                <h2 className="text-xl font-serif text-ink mb-2">Ops!</h2>
                <p className="text-fade mb-6">{error || 'Não foi possível carregar o leitor.'}</p>
                <Link href="/books">
                    <Button variant="outline">Voltar para Biblioteca</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col">
            <header className="h-16 bg-white border-b border-stone-200 flex items-center px-4 justify-between shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <Link href={`/books/${params.bookId}`} className="p-2 hover:bg-stone-50 rounded-full text-fade hover:text-ink transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="font-serif font-bold text-ink truncate max-w-md">
                        {book.title}
                    </h1>
                </div>
                <div className="text-xs font-mono bg-stone-100 text-fade px-2 py-1 rounded">
                    {book.file_type.toUpperCase()}
                </div>
            </header>

            <main className="flex-1 relative">
                {book.file_type === 'pdf' ? (
                    <PDFViewerDynamic
                        url={fileUrl}
                        initialPage={initialState.page}
                        onProgressChange={(page, progress) => handleProgressChange(page, progress, page)}
                    />
                ) : (
                    <EpubViewerDynamic
                        url={fileUrl}
                        title={book.title}
                        initialLocation={initialState.location}
                        onProgressChange={(loc, progress) => handleProgressChange(loc, progress)}
                    />
                )}
            </main>
        </div>
    );
}
