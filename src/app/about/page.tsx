import { NavBar } from '@/components/NavBar';
import { Tagline } from '@/components/Logo';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-paper">
            <NavBar />
            <main className="pt-32 pb-16 px-4 max-w-3xl mx-auto text-center">
                <h1 className="font-serif text-4xl font-bold text-ink mb-6">Sobre o Lido.</h1>
                <Tagline className="text-xl mb-12" />

                <div className="prose prose-stone mx-auto text-left">
                    <p>
                        O Lido é uma plataforma social feita para amantes de livros.
                        Acreditamos que a leitura não precisa ser uma atividade solitária.
                    </p>
                    <p>
                        Aqui você pode organizar sua estante, descobrir novas leituras através de amigos
                        e compartilhar suas opiniões de forma autêntica.
                    </p>
                    <p>
                        Este projeto está em constante evolução. Obrigado por fazer parte da nossa história.
                    </p>
                </div>
            </main>
        </div>
    );
}
