import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BookX } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-stone-100 p-6 rounded-full mb-6">
                <BookX size={64} className="text-fade" />
            </div>
            <h1 className="font-serif text-4xl font-bold text-ink mb-2">Página não encontrada</h1>
            <p className="text-fade max-w-md mb-8">
                Ops! A página que você está procurando não existe ou foi removida.
                Que tal voltar para a biblioteca?
            </p>
            <Link href="/">
                <Button size="lg">
                    Voltar ao Início
                </Button>
            </Link>
        </div>
    );
}
