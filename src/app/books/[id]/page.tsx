import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { BookDetailClient } from '@/components/BookDetailClient';
import { cache } from 'react';

// Create a cached version of the fetch function to deduplicate requests
// if we call it in both metadata and component (though here we only use it for metadata)
const getBook = cache(async (id: string) => {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.from('books').select('*').eq('id', id).single();
    return data;
});

type Props = {
    params: Promise<{ id: string }>;
};

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const { id } = await params;
    const book = await getBook(id);

    if (!book) {
        return {
            title: 'Livro não encontrado'
        };
    }

    return {
        title: book.title,
        description: `Leia reviews e veja detalhes de ${book.title} por ${book.authors?.join(', ')} no Lido.`,
        openGraph: {
            title: book.title,
            description: book.description || undefined,
            images: book.cover_url ? [book.cover_url] : [],
        }
    };
}

export default async function BookPage({ params }: Props) {
    const { id } = await params;
    return <BookDetailClient id={id} />;
}
