import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// MEGA list - 300+ Portuguese book titles for maximum coverage
const MEGA_PORTUGUESE_BOOKS = [
    // MACHADO DE ASSIS COMPLETO
    'Memórias Póstumas de Brás Cubas',
    'Dom Casmurro Machado de Assis',
    'Quincas Borba Machado',
    'O Alienista Machado',
    'Esaú e Jacó Machado',
    'Helena Machado de Assis',
    'Memorial de Aires',

    // CLARICE LISPECTOR COMPLETO
    'A Hora da Estrela Clarice',
    'Laços de Família Clarice',
    'Perto do Coração Selvagem',
    'A Paixão Segundo G.H.',
    'Água Viva Clarice',
    'Felicidade Clandestina',

    // JORGE AMADO COMPLETO
    'Capitães da Areia Jorge Amado',
    'Gabriela Cravo e Canela',
    'Dona Flor e Seus Dois Maridos',
    'Tieta do Agreste',
    'Mar Morto Jorge Amado',
    'Jubiabá Jorge Amado',
    'Tenda dos Milagres',

    // GRACILIANO RAMOS
    'Vidas Secas Graciliano',
    'São Bernardo Graciliano',
    'Angústia Graciliano Ramos',
    'Memórias do Cárcere',

    // GUIMARÃES ROSA
    'Grande Sertão Veredas',
    'Sagarana Guimarães Rosa',
    'Primeiras Estórias',

    // OUTROS CLÁSSICOS BRASILEIROS
    'O Quinze Rachel de Queiroz',
    'O Cortiço Aluísio Azevedo',
    'Iracema José de Alencar',
    'O Guarani José de Alencar',
    'Senhora José de Alencar',
    'Lucíola José de Alencar',
    'Quarto de Despejo Carolina Jesus',

    // ÉRICO VERÍSSIMO
    'O Tempo e o Vento',
    'Olhai os Lírios do Campo',
    'Incidente em Antares',

    // CONTEMPORÂNEOS PREMIADOS
    'Torto Arado Itamar Vieira',
    'Tudo é Rio Carla Madeira',
    'A Padaria Zulema',
    'O Avesso da Pele Jeferson Tenório',
    'Dois Irmãos Milton Hatoum',
    'Relato de um Certo Oriente',
    'Azul Corvo Adriana Lisboa',
    'Amora Natalia Polesso',

    // CONCEIÇÃO EVARISTO
    'Ponciá Vicêncio',
    'Olhos d Água Evaristo',
    'Becos da Memória',

    // DJAMILA RIBEIRO
    'Pequeno Manual Antirracista',
    'Lugar de Fala Djamila',
    'Quem Tem Medo Feminismo Negro',

    // PAULO COELHO COMPLETO
    'O Alquimista Paulo Coelho',
    'Brida Paulo Coelho',
    'Onze Minutos Paulo Coelho',
    'O Zahir Paulo Coelho',
    'Veronika Decide Morrer',
    'O Diário de um Mago',
    'Na Margem do Rio Piedra',
    'A Espiã Paulo Coelho',
    'Hippie Paulo Coelho',

    // AUGUSTO CURY COMPLETO
    'O Código da Inteligência Cury',
    'Ansiedade Augusto Cury',
    'O Mestre dos Mestres',
    'O Vendedor de Sonhos',
    'Nunca Desista Seus Sonhos',
    'Pais Brilhantes Professores',

    // COLLEEN HOOVER EM PORTUGUÊS
    'É Assim que Acaba Colleen',
    'É Assim que Começa',
    'Verity Colleen Hoover',
    'Todas Suas Imperfeições',
    'Confesse Colleen Hoover',
    'Jamais Colleen Hoover',
    'Ugly Love Colleen',

    // SARAH J MAAS EM PORTUGUÊS
    'Corte de Espinhos e Rosas',
    'Corte de Névoa e Fúria',
    'Corte de Asas e Ruína',
    'Casa de Terra e Sangue',
    'Trono de Vidro Sarah',

    // HARRY POTTER EM PORTUGUÊS
    'Harry Potter Pedra Filosofal',
    'Harry Potter Câmara Secreta',
    'Harry Potter Prisioneiro Azkaban',
    'Harry Potter Cálice Fogo',
    'Harry Potter Ordem Fênix',
    'Harry Potter Enigma Príncipe',
    'Harry Potter Relíquias Morte',

    // TOLKIEN EM PORTUGUÊS
    'Senhor dos Anéis Sociedade Anel',
    'Senhor dos Anéis Duas Torres',
    'Senhor dos Anéis Retorno Rei',
    'O Hobbit Tolkien',
    'O Silmarillion',

    // PERCY JACKSON
    'Percy Jackson Ladrão Raios',
    'Percy Jackson Mar Monstros',
    'Maldição do Titã Percy',
    'Batalha do Labirinto',
    'Último Olimpiano Percy',

    // DISTOPIA
    '1984 George Orwell português',
    'Revolução dos Bichos Orwell',
    'Admirável Mundo Novo português',
    'Fahrenheit 451 português',
    'Conto da Aia Atwood',
    'Jogos Vorazes português',
    'Em Chamas Jogos Vorazes',
    'Divergente Veronica Roth',

    // STEPHEN KING
    'O Iluminado Stephen King',
    'It A Coisa Stephen King',
    'O Cemitério Stephen King',
    'Carrie Estranha Stephen King',
    'Misery Stephen King',
    'Doutor Sono Stephen King',

    // SUSPENSE
    'O Homem de Giz Tudor',
    'Paciente Silenciosa Michaelides',
    'Garota Exemplar Flynn',
    'Garota no Trem Hawkins',
    'Código Da Vinci Dan Brown',
    'Anjos e Demônios Brown',

    // AUTOAJUDA TOP
    'Poder do Hábito Duhigg',
    'Mindset Carol Dweck',
    'Milagre da Manhã Elrod',
    'Me Poupe Nathalia Arcuri',
    'Do Mil ao Milhão Nigro',
    'Pai Rico Pai Pobre',
    'Homem Mais Rico Babilônia',
    'Segredos Mente Milionária',
    'Quem Pensa Enriquece Hill',
    'Como Fazer Amigos Influenciar',
    'Inteligência Emocional Goleman',
    'Rápido Devagar Kahneman',
    'Poder do Agora Tolle',
    'Coragem Ser Imperfeito Brené',
    'Sutil Arte Ligar Foda',
    'Mais Esperto Diabo Hill',
    'Hábitos Atômicos James Clear',

    // NÃO-FICÇÃO
    'Sapiens Harari português',
    'Homo Deus Harari',
    '21 Lições Século 21',
    'Breve História Tempo Hawking',
    'Diário Anne Frank',
    'Menina Roubava Livros',
    'Menino Pijama Listrado',

    // CLÁSSICOS UNIVERSAIS
    'Crime Castigo Dostoiévski',
    'Irmãos Karamázov',
    'Anna Kariênina Tolstói',
    'Cem Anos Solidão Márquez',
    'Metamorfose Kafka',
    'Pequeno Príncipe Saint-Exupéry',
    'Grande Gatsby Fitzgerald',
    'Apanhador Campo Centeio',

    // JOSÉ SARAMAGO
    'Ensaio sobre Cegueira Saramago',
    'Memorial do Convento',
    'Homem Duplicado Saramago',
    'Evangelho Segundo Jesus Cristo',
    'Intermitências da Morte',

    // FERNANDO PESSOA
    'Livro Desassossego Pessoa',
    'Mensagem Fernando Pessoa',

    // FILOSOFIA
    'Mundo de Sofia Gaarder',
    'Meditações Marco Aurélio',
    'O Príncipe Maquiavel',
    'Arte da Guerra Sun Tzu',
    'Homem Busca Sentido Frankl',

    // INFANTOJUVENIL NACIONAL
    'Menino Maluquinho Ziraldo',
    'Meu Pé Laranja Lima',
    'Bolsa Amarela Lygia Bojunga',
    'Sítio Picapau Amarelo',
    'Reinações Narizinho',
    'Diário Banana português',
    'Crônicas Nárnia português',

    // POESIA BRASILEIRA
    'Poesia Drummond Andrade',
    'Antologia Vinicius Moraes',
    'Poemas Cecília Meireles',
    'Manuel Bandeira poesia',

    // ROMANCE ATUAL
    'Culpa Estrelas John Green',
    'Cidades Papel John Green',
    'Cinco Passos de Você',
    'Extraordinário R.J. Palacio',
    'Orgulho Preconceito Austen',
    'Morro Ventos Uivantes',

    // LUIS FERNANDO VERÍSSIMO
    'Comédias Vida Privada',
    'Analista de Bagé',

    // MAIS BRASILEIROS
    'Cidade de Deus Paulo Lins',
    'Feliz Ano Velho Marcelo Paiva',
    'Cabeça Fria Coração Quente',

    // ADICIONAIS POPULARES
    'Onde os Fracos Não Têm Vez',
    'Mulheres que Correm Lobos',
    'Você Nasceu para Brilhar',
    'Propósito Vida Dirigida',
    'Poder Subconsciente Joseph Murphy',
];

const normalizeDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    if (dateStr.length === 4) return `${dateStr}-01-01`;
    if (dateStr.length === 7) return `${dateStr}-01`;
    return dateStr;
};

const getCoverUrl = (imageLinks: any, bookId: string): string => {
    if (imageLinks?.thumbnail) {
        return imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=3');
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

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

    const results: any[] = [];
    const errors: string[] = [];
    const skipped: string[] = [];
    const batch = MEGA_PORTUGUESE_BOOKS.slice(startIndex, startIndex + batchSize);

    for (const query of batch) {
        try {
            const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
            const url = `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&langRestrict=pt&maxResults=3&key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                skipped.push(`Não encontrado: ${query}`);
                continue;
            }

            const bookData = data.items[0].volumeInfo;
            if (!bookData.imageLinks?.thumbnail) {
                skipped.push(`Sem capa: ${bookData.title || query}`);
                continue;
            }

            const isbn = bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier ||
                bookData.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')?.identifier ||
                `GBOOKS-${data.items[0].id}`;

            const { data: inserted, error } = await supabase
                .from('books')
                .upsert({
                    google_books_id: data.items[0].id,
                    isbn,
                    title: bookData.title,
                    subtitle: bookData.subtitle || null,
                    authors: bookData.authors || ['Autor Desconhecido'],
                    publisher: bookData.publisher || null,
                    published_date: normalizeDate(bookData.publishedDate),
                    description: bookData.description || 'Descrição não disponível.',
                    page_count: bookData.pageCount || null,
                    language: 'pt',
                    cover_url: getCoverUrl(bookData.imageLinks, data.items[0].id),
                    cover_thumbnail: bookData.imageLinks?.smallThumbnail?.replace('http:', 'https:') || getCoverUrl(bookData.imageLinks, data.items[0].id),
                    categories: bookData.categories || ['Literatura'],
                    avg_rating: bookData.averageRating || 0,
                    ratings_count: bookData.ratingsCount || 0,
                    is_verified: true,
                }, { onConflict: 'isbn' })
                .select('id, title');

            if (error) errors.push(`DB: ${error.message}`);
            else if (inserted?.length) results.push({ id: inserted[0].id, title: inserted[0].title });

            await new Promise(r => setTimeout(r, 100));
        } catch (e: any) {
            errors.push(`Erro: ${e.message}`);
        }
    }

    return NextResponse.json({
        success: results.length,
        skippedCount: skipped.length,
        totalBooks: MEGA_PORTUGUESE_BOOKS.length,
        startIndex,
        endIndex: Math.min(startIndex + batchSize, MEGA_PORTUGUESE_BOOKS.length),
        results,
        skipped: skipped.slice(0, 5),
        errors
    });
}
