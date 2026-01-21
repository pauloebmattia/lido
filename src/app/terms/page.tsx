import { NavBar } from '@/components/NavBar';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-paper">
            <NavBar />
            <main className="pt-32 pb-16 px-4 max-w-3xl mx-auto">
                <h1 className="font-serif text-3xl font-bold text-ink mb-8 text-center">Termos de Uso</h1>

                <div className="prose prose-stone mx-auto">
                    <p>Última atualização: Janeiro de 2026</p>
                    <h3>1. Termos</h3>
                    <p>
                        Ao acessar ao site Lido, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis
                        e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.
                    </p>
                    <h3>2. Uso de Licença</h3>
                    <p>
                        É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software)
                        no site Lido, apenas para visualização transitória pessoal e não comercial.
                    </p>
                    <h3>3. Isenção de responsabilidade</h3>
                    <p>
                        Os materiais no site da Lido são fornecidos 'como estão'. Lido não oferece garantias, expressas ou implícitas,
                        e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou
                        condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual.
                    </p>
                </div>
            </main>
        </div>
    );
}
