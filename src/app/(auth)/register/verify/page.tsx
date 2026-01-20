import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-paper flex items-center justify-center px-4">
            <div className="w-full max-w-md text-center space-y-6">
                {/* Logo */}
                <Logo size="lg" linkToHome />

                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="text-accent" size={40} />
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <h1 className="font-serif text-3xl font-bold text-ink">
                        Verifique seu email
                    </h1>
                    <p className="text-fade">
                        Enviamos um link de confirmação para o seu email.
                        <br />
                        Clique no link para ativar sua conta.
                    </p>
                </div>

                {/* Tips */}
                <div className="bg-stone-50 rounded-2xl p-5 text-left space-y-3">
                    <p className="font-medium text-ink">Não recebeu o email?</p>
                    <ul className="text-sm text-fade space-y-2">
                        <li>• Verifique sua pasta de spam</li>
                        <li>• Confirme se o email está correto</li>
                        <li>• Aguarde alguns minutos e tente novamente</li>
                    </ul>
                </div>

                {/* Back Link */}
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-accent hover:underline"
                >
                    <ArrowLeft size={18} />
                    <span>Voltar para login</span>
                </Link>
            </div>
        </div>
    );
}
