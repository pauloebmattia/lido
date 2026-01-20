import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Expanded curated list - 160+ Brazilian bestsellers using title queries for better API coverage
const BRAZILIAN_BESTSELLERS = [
    // ====== LITERATURA BRASILEIRA CLÁSSICA ======
    { q: 'Memórias Póstumas de Brás Cubas Machado' },
    { q: 'Dom Casmurro Machado de Assis' },
    { q: 'Quincas Borba Machado Assis' },
    { q: 'O Alienista Machado Assis' },
    { q: 'A Hora da Estrela Clarice Lispector' },
    { q: 'Laços de Família Clarice Lispector' },
    { q: 'Perto do Coração Selvagem Clarice' },
    { q: 'Grande Sertão Veredas Guimarães Rosa' },
    { q: 'Capitães da Areia Jorge Amado' },
    { q: 'Gabriela Cravo Canela Jorge Amado' },
    { q: 'Dona Flor Dois Maridos Jorge Amado' },
    { q: 'O Cortiço Aluísio Azevedo' },
    { q: 'Iracema José de Alencar' },
    { q: 'O Guarani José Alencar' },
    { q: 'Vidas Secas Graciliano Ramos' },
    { q: 'São Bernardo Graciliano Ramos' },
    { q: 'O Quinze Rachel de Queiroz' },
    { q: 'Quarto de Despejo Carolina Maria de Jesus' },

    // ====== LITERATURA BRASILEIRA CONTEMPORÂNEA ======
    { q: 'Torto Arado Itamar Vieira Junior' },
    { q: 'Tudo é Rio Carla Madeira' },
    { q: 'A Padaria Zulema Carla Madeira' },
    { q: 'Ponciá Vicêncio Conceição Evaristo' },
    { q: 'Olhos d Água Conceição Evaristo' },
    { q: 'Becos da Memória Conceição Evaristo' },
    { q: 'O Avesso da Pele Jeferson Tenório' },
    { q: 'Relato Certo Oriente Milton Hatoum' },
    { q: 'Dois Irmãos Milton Hatoum' },
    { q: 'Azul Corvo Adriana Lisboa' },
    { q: 'Amora Natalia Borges Polesso' },
    { q: 'Pequeno Manual Antirracista Djamila' },
    { q: 'Lugar de Fala Djamila Ribeiro' },

    // ====== ROMANCE INTERNACIONAL EM PT-BR ======
    { q: 'É Assim que Acaba Colleen Hoover' },
    { q: 'É Assim que Começa Colleen Hoover' },
    { q: 'Verity Colleen Hoover' },
    { q: 'Todas as Suas Imperfeições Colleen' },
    { q: 'Confesse Colleen Hoover' },
    { q: 'A Culpa é das Estrelas John Green' },
    { q: 'Cidades de Papel John Green' },
    { q: 'Tartarugas até lá Embaixo John Green' },
    { q: 'A Cinco Passos de Você' },
    { q: 'Extraordinário R.J. Palacio' },
    { q: 'O Sol Todos Harper Lee' },
    { q: 'Orgulho Preconceito Jane Austen' },
    { q: 'Razão Sensibilidade Jane Austen' },
    { q: 'Emma Jane Austen' },
    { q: 'O Morro dos Ventos Uivantes Emily Bronte' },

    // ====== FANTASIA ======
    { q: 'Corte de Espinhos e Rosas Sarah Maas' },
    { q: 'Corte de Névoa e Fúria Sarah Maas' },
    { q: 'Corte de Asas e Ruína Sarah Maas' },
    { q: 'Trono de Vidro Sarah Maas' },
    { q: 'Harry Potter e a Pedra Filosofal' },
    { q: 'Harry Potter e a Câmara Secreta' },
    { q: 'Harry Potter Prisioneiro Azkaban' },
    { q: 'Harry Potter Cálice de Fogo' },
    { q: 'Harry Potter Ordem da Fênix' },
    { q: 'Harry Potter Enigma do Príncipe' },
    { q: 'Harry Potter Relíquias da Morte' },
    { q: 'O Senhor dos Anéis Sociedade do Anel' },
    { q: 'O Senhor dos Anéis As Duas Torres' },
    { q: 'O Senhor dos Anéis Retorno do Rei' },
    { q: 'O Hobbit Tolkien' },
    { q: 'O Silmarillion Tolkien' },
    { q: 'Percy Jackson Ladrão de Raios' },
    { q: 'Percy Jackson Mar de Monstros' },
    { q: 'As Crônicas de Nárnia CS Lewis' },

    // ====== FICÇÃO CIENTÍFICA E DISTOPIA ======
    { q: '1984 George Orwell' },
    { q: 'A Revolução dos Bichos George Orwell' },
    { q: 'O Conto da Aia Margaret Atwood' },
    { q: 'Fahrenheit 451 Ray Bradbury' },
    { q: 'Admirável Mundo Novo Aldous Huxley' },
    { q: 'Jogos Vorazes Suzanne Collins' },
    { q: 'Em Chamas Suzanne Collins' },
    { q: 'A Esperança Suzanne Collins' },
    { q: 'Divergente Veronica Roth' },
    { q: 'Insurgente Veronica Roth' },

    // ====== TERROR E SUSPENSE ======
    { q: 'O Iluminado Stephen King' },
    { q: 'It A Coisa Stephen King' },
    { q: 'O Cemitério Stephen King' },
    { q: 'Carrie A Estranha Stephen King' },
    { q: 'Misery Stephen King' },
    { q: 'Doutor Sono Stephen King' },
    { q: 'O Homem de Giz C.J. Tudor' },
    { q: 'A Paciente Silenciosa Alex Michaelides' },
    { q: 'Garota Exemplar Gillian Flynn' },
    { q: 'O Silêncio dos Inocentes Thomas Harris' },
    { q: 'Drácula Bram Stoker' },
    { q: 'Frankenstein Mary Shelley' },
    { q: 'A Menina que Roubava Livros Markus Zusak' },

    // ====== AUTOAJUDA E NEGÓCIOS ======
    { q: 'O Poder do Hábito Charles Duhigg' },
    { q: 'Mindset Carol Dweck' },
    { q: 'O Milagre da Manhã Hal Elrod' },
    { q: 'Me Poupe Nathalia Arcuri' },
    { q: 'Pai Rico Pai Pobre Robert Kiyosaki' },
    { q: 'O Homem Mais Rico da Babilônia' },
    { q: 'Os Segredos da Mente Milionária' },
    { q: 'Quem Pensa Enriquece Napoleon Hill' },
    { q: 'Como Fazer Amigos Influenciar Pessoas' },
    { q: 'Inteligência Emocional Daniel Goleman' },
    { q: 'Rápido e Devagar Daniel Kahneman' },
    { q: 'Essencialismo Greg McKeown' },
    { q: 'O Poder do Agora Eckhart Tolle' },
    { q: 'A Coragem de Ser Imperfeito Brené Brown' },
    { q: 'A Sútil Arte de Ligar o Foda-se' },
    { q: 'Mais Esperto que o Diabo Napoleon Hill' },
    { q: 'O Código da Inteligência Augusto Cury' },

    // ====== NÃO-FICÇÃO E CIÊNCIA ======
    { q: 'Sapiens Yuval Noah Harari' },
    { q: 'Homo Deus Yuval Noah Harari' },
    { q: '21 Lições Século 21 Harari' },
    { q: 'Uma Breve História do Tempo Hawking' },
    { q: 'O Gene Siddhartha Mukherjee' },
    { q: 'O Diário de Anne Frank' },

    // ====== CLÁSSICOS UNIVERSAIS ======
    { q: 'Crime e Castigo Dostoiévski' },
    { q: 'Os Irmãos Karamázov Dostoiévski' },
    { q: 'Anna Kariênina Tolstói' },
    { q: 'Guerra e Paz Tolstói' },
    { q: 'Cem Anos de Solidão García Márquez' },
    { q: 'O Amor nos Tempos do Cólera' },
    { q: 'A Metamorfose Franz Kafka' },
    { q: 'O Processo Franz Kafka' },
    { q: 'O Grande Gatsby F. Scott Fitzgerald' },
    { q: 'O Apanhador no Campo de Centeio' },
    { q: 'O Pequeno Príncipe Saint-Exupéry' },

    // ====== PAULO COELHO ======
    { q: 'O Alquimista Paulo Coelho' },
    { q: 'Brida Paulo Coelho' },
    { q: 'Onze Minutos Paulo Coelho' },
    { q: 'O Zahir Paulo Coelho' },
    { q: 'Veronika Decide Morrer Paulo Coelho' },
    { q: 'O Diário de um Mago Paulo Coelho' },

    // ====== FILOSOFIA E PSICOLOGIA ======
    { q: 'O Mundo de Sofia Jostein Gaarder' },
    { q: 'Meditações Marco Aurélio' },
    { q: 'O Príncipe Maquiavel' },
    { q: 'A Arte da Guerra Sun Tzu' },
    { q: 'Assim Falou Zaratustra Nietzsche' },
    { q: 'O Homem em Busca de Sentido Viktor Frankl' },

    // ====== INFANTOJUVENIL ======
    { q: 'O Diário de um Banana Jeff Kinney' },
    { q: 'Éramos Mentirosos E. Lockhart' },
    { q: 'Fangirl Rainbow Rowell' },
    { q: 'Eleanor Park Rainbow Rowell' },
    { q: 'O Ladrão de Raios Rick Riordan' },
    { q: 'A Maldição do Titã Rick Riordan' },

    // ====== POESIA ======
    { q: 'Poemas de Fernando Pessoa' },
    { q: 'Poesias Completas Drummond de Andrade' },
    { q: 'Antologia Poética Vinicius de Moraes' },
    { q: 'Poemas Escolhidos Cecília Meireles' },
    { q: 'Flor Poesia Manuel Bandeira' },
];

const normalizeDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    if (dateStr.length === 4) return `${dateStr}-01-01`;
    if (dateStr.length === 7) return `${dateStr}-01`;
    return dateStr;
};

const getCoverUrl = (imageLinks: any, bookId: string): string => {
    if (imageLinks?.thumbnail) {
        return imageLinks.thumbnail
            .replace('http:', 'https:')
            .replace('&zoom=1', '&zoom=3')
            .replace('&edge=curl', '');
    }
    return `https://books.google.com/books/content?id=${bookId}&printsec=frontcover&img=1&zoom=3`;
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startIndex = parseInt(searchParams.get('startIndex') || '0', 10);
    const batchSize = parseInt(searchParams.get('batchSize') || '10', 10);

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Service Role Key não configurada' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
    );

    const results: any[] = [];
    const errors: string[] = [];
    const skipped: string[] = [];

    const batch = BRAZILIAN_BESTSELLERS.slice(startIndex, startIndex + batchSize);

    for (const item of batch) {
        try {
            const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
            const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(item.q)}&langRestrict=pt&maxResults=5&key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                skipped.push(`Não encontrado: ${item.q}`);
                continue;
            }

            // Get the best match (first result for ISBN, filter for author searches)
            const bookData = data.items[0].volumeInfo;

            if (!bookData.imageLinks?.thumbnail) {
                skipped.push(`Sem capa: ${bookData.title || item.q}`);
                continue;
            }

            const isbn = bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ||
                `GBOOKS-${data.items[0].id}`;

            const coverUrl = getCoverUrl(bookData.imageLinks, data.items[0].id);

            const { data: inserted, error } = await supabase
                .from('books')
                .upsert({
                    google_books_id: data.items[0].id,
                    isbn: isbn,
                    title: bookData.title,
                    subtitle: bookData.subtitle || null,
                    authors: bookData.authors || ['Autor Desconhecido'],
                    publisher: bookData.publisher || null,
                    published_date: normalizeDate(bookData.publishedDate),
                    description: bookData.description || 'Descrição não disponível.',
                    page_count: bookData.pageCount || null,
                    language: bookData.language || 'pt',
                    cover_url: coverUrl,
                    cover_thumbnail: bookData.imageLinks?.smallThumbnail?.replace('http:', 'https:') || coverUrl,
                    categories: bookData.categories || ['Literatura'],
                    avg_rating: bookData.averageRating || 0,
                    ratings_count: bookData.ratingsCount || 0,
                    is_verified: true,
                }, { onConflict: 'isbn' })
                .select('id, title');

            if (error) {
                errors.push(`DB Error: ${error.message}`);
            } else if (inserted && inserted.length > 0) {
                results.push({ id: inserted[0].id, title: inserted[0].title });
            }

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (e: any) {
            errors.push(`Exception: ${e.message}`);
        }
    }

    return NextResponse.json({
        success: results.length,
        skippedCount: skipped.length,
        totalBooks: BRAZILIAN_BESTSELLERS.length,
        startIndex,
        endIndex: startIndex + batchSize,
        results,
        skipped,
        errors
    });
}
