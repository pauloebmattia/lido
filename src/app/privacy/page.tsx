import { NavBar } from '@/components/NavBar';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-paper">
            <NavBar />
            <main className="pt-32 pb-16 px-4 max-w-3xl mx-auto">
                <h1 className="font-serif text-3xl font-bold text-ink mb-8 text-center">Política de Privacidade</h1>

                <div className="prose prose-stone mx-auto">
                    <p>Última atualização: Janeiro de 2026</p>
                    <p>
                        A sua privacidade é importante para nós. É política do Lido respeitar a sua privacidade
                        em relação a qualquer informação que possamos coletar no site Lido.
                    </p>
                    <h3>Coleta de Dados</h3>
                    <p>
                        Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço.
                        Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.
                    </p>
                    <h3>Uso de Dados</h3>
                    <p>
                        Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado.
                        Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis para evitar perdas e roubos.
                    </p>
                </div>
            </main>
        </div>
    );
}
