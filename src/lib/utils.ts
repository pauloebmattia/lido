// Utility functions for the app
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Category translation map - English to Portuguese
 */
const CATEGORY_TRANSLATIONS: Record<string, string> = {
    // Main categories
    'Fiction': 'Ficção',
    'Non-Fiction': 'Não-Ficção',
    'Nonfiction': 'Não-Ficção',
    'Science Fiction': 'Ficção Científica',
    'Fantasy': 'Fantasia',
    'Romance': 'Romance',
    'Mystery': 'Mistério',
    'Thriller': 'Suspense',
    'Horror': 'Terror',
    'Biography': 'Biografia',
    'Biography & Autobiography': 'Biografia',
    'History': 'História',
    'Science': 'Ciência',
    'Self-Help': 'Autoajuda',
    'Business': 'Negócios',
    'Business & Economics': 'Negócios',
    'Poetry': 'Poesia',
    'Drama': 'Drama',
    'Humor': 'Humor',
    'Art': 'Arte',
    'Music': 'Música',
    'Philosophy': 'Filosofia',
    'Religion': 'Religião',
    'Psychology': 'Psicologia',
    'Education': 'Educação',
    'Travel': 'Viagem',
    'Cooking': 'Culinária',
    'Health': 'Saúde',
    'Health & Fitness': 'Saúde',
    'Sports': 'Esportes',
    'Sports & Recreation': 'Esportes',
    'Computers': 'Tecnologia',
    'Computers & Technology': 'Tecnologia',
    'Technology': 'Tecnologia',
    'Law': 'Direito',
    'Political Science': 'Ciência Política',
    'Social Science': 'Ciências Sociais',
    'Medical': 'Medicina',
    'Mathematics': 'Matemática',
    'Nature': 'Natureza',
    'Gardening': 'Jardinagem',
    'Crafts': 'Artesanato',
    'Games': 'Jogos',
    'True Crime': 'Crime Real',
    'Juvenile Fiction': 'Infantojuvenil',
    'Juvenile Nonfiction': 'Infantojuvenil',
    'Young Adult Fiction': 'Jovem Adulto',
    'Young Adult Nonfiction': 'Jovem Adulto',
    'Comics & Graphic Novels': 'Quadrinhos',
    'Literary Collections': 'Coletâneas',
    'Literary Criticism': 'Crítica Literária',
    'Performing Arts': 'Artes Cênicas',
    'Family & Relationships': 'Família',
    'Body, Mind & Spirit': 'Espiritualidade',
    'Antiques & Collectibles': 'Antiguidades',
    'Architecture': 'Arquitetura',
    'Design': 'Design',
    'Language Arts & Disciplines': 'Linguagem',
    'Foreign Language Study': 'Idiomas',
    'Study Aids': 'Estudos',
    'Reference': 'Referência',
    'Transportation': 'Transporte',
    'Bibles': 'Bíblias',
    'Literary Fiction': 'Ficção Literária',
    'Adventure': 'Aventura',
    'Action': 'Ação',
    'Crime': 'Crime',
    'Detective': 'Detetive',
    'Dystopian': 'Distopia',
    'Contemporary': 'Contemporâneo',
    'Classics': 'Clássicos',
    'Classic Literature': 'Literatura Clássica',
    'Brazilian Literature': 'Literatura Brasileira',
    'Portuguese Literature': 'Literatura Portuguesa',
    'Latin American Literature': 'Literatura Latino-Americana',
    'World Literature': 'Literatura Mundial',
    'General': 'Geral',
};

/**
 * Translate a category from English to Portuguese
 */
export function translateCategory(category: string): string {
    // Check direct translation
    if (CATEGORY_TRANSLATIONS[category]) {
        return CATEGORY_TRANSLATIONS[category];
    }

    // Check case-insensitive
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_TRANSLATIONS)) {
        if (key.toLowerCase() === lowerCategory) {
            return value;
        }
    }

    // Try partial match (for subcategories like "Fiction / Science Fiction")
    const parts = category.split('/').map(p => p.trim());
    if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (CATEGORY_TRANSLATIONS[lastPart]) {
            return CATEGORY_TRANSLATIONS[lastPart];
        }
    }

    // Return original if no translation found
    return category;
}

/**
 * Translate an array of categories
 */
export function translateCategories(categories: string[]): string[] {
    return categories.map(translateCategory);
}

/**
 * Format relative time in Portuguese
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return 'agora';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}min`;
    } else if (diffHours < 24) {
        return `${diffHours}h`;
    } else if (diffDays < 7) {
        return `${diffDays}d`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks}sem`;
    } else if (diffMonths < 12) {
        return `${diffMonths}m`;
    } else {
        return `${diffYears}a`;
    }
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
    return num.toLocaleString('pt-BR');
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Get the current site URL (for redirects)
 */
export function getURL() {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
        'http://localhost:3000/';

    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`;

    // Make sure to include trailing slash.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;

    // If we are on client side, we can also prefer window.location.origin
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    return url;
}
