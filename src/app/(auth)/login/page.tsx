'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo, Tagline } from '@/components/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { AuthBackground } from '@/components/AuthBackground';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    setError('Email ou senha incorretos.');
                } else {
                    setError(authError.message);
                }
                return;
            }

            // Redirect to home on success
            router.push('/');
            router.refresh();
        } catch (err) {
            setError('Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        setError('');
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (authError) {
                setError(authError.message);
            }
        } catch (err) {
            setError('Ocorreu um erro ao conectar. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-paper flex">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 bg-paper">
                <div className="w-full max-w-sm space-y-4">
                    {/* Header */}
                    <div className="text-center">
                        <Logo size="md" linkToHome />
                        <h1 className="mt-4 font-serif text-2xl font-bold text-ink">
                            Bem-vindo de volta
                        </h1>
                        <p className="mt-1 text-xs text-fade">
                            Entre para continuar sua jornada literária
                        </p>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 h-9 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 text-xs font-medium text-ink"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Google</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOAuthLogin('github')}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 h-9 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 text-xs font-medium text-ink"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <span>GitHub</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-paper text-fade">ou</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            icon={<Mail size={16} />}
                            required
                            autoComplete="email"
                            className="h-9 text-sm"
                        />

                        <div className="relative">
                            <Input
                                label="Senha"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                icon={<Lock size={16} />}
                                required
                                autoComplete="current-password"
                                className="h-9 text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-8 text-fade hover:text-ink transition-colors"
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-stone-300 text-accent focus:ring-accent"
                                />
                                <span className="text-fade">Lembrar de mim</span>
                            </label>
                            <Link href="/forgot-password" className="text-accent hover:underline">
                                Esqueceu a senha?
                            </Link>
                        </div>

                        {error && (
                            <p className="text-red-600 text-sm bg-red-50 p-2 rounded-lg text-center">
                                {error}
                            </p>
                        )}

                        <Button type="submit" className="w-full h-11" isLoading={isLoading}>
                            Entrar
                        </Button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-sm text-fade">
                        Não tem uma conta?{' '}
                        <Link href="/register" className="text-accent hover:underline font-medium">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image (hidden on mobile) */}
            <AuthBackground />
        </div>
    );
}
