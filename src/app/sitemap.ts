import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Init Supabase client (using public key is safely enough for public data listing)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://lido.app'; // Replace with actual domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. Static Routes
    const routes = [
        '',
        '/login',
        '/register',
        '/feed',
        '/books',
    ].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Routes (Books)
    // Fetch last 50 verified books
    const { data: books } = await supabase
        .from('books')
        .select('id, updated_at')
        .limit(50);

    const bookRoutes = (books || []).map((book) => ({
        url: `${BASE_URL}/books/${book.id}`,
        lastModified: new Date(book.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [...routes, ...bookRoutes];
}
