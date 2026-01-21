'use client';

import { useState, useCallback, useEffect } from 'react';
import { Play, Loader2, CheckCircle, Globe2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { NavBar } from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SeedExpansionPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [inserted, setInserted] = useState(0);
    const [skipped, setSkipped] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isVibesRunning, setIsVibesRunning] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function checkAdmin() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAdmin(true);
            }
            setIsLoadingUser(false);
        }
        checkAdmin();
    }, [router]);

    if (isLoadingUser) return <div className="min-h-screen bg-stone-900 flex items-center justify-center text-stone-500">Verificando permissões...</div>;

    if (!isAdmin) return (
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-stone-400 gap-4">
            <Lock size={48} className="text-red-500" />
            <h1 className="text-2xl font-bold text-white">Acesso Restrito</h1>
            <p>Esta área é exclusiva para administradores.</p>
            <Link href="/" className="text-purple-400 hover:underline">Voltar para Home</Link>
        </div>
    );

    const runVibes = async () => {
        setIsVibesRunning(true);
        try {
            const res = await fetch('/api/admin/seed-vibes');
            const data = await res.json();
            setLogs(prev => [...prev, ...[`✨ Vibes Sync: ${data.message || 'Done'}`]]);
            alert('Vibes sincronizadas com sucesso!');
        } catch (e) {
            alert('Erro ao sincronizar vibes');
        } finally {
            setIsVibesRunning(false);
        }
    };

    const runImport = async () => {
        setIsRunning(true);
        setLogs([]);
        setInserted(0);
        setSkipped(0);
        setIsComplete(false);

        try {
            // Streaming-like update isn't easily possible with simple fetch unless using text stream.
            // For now, we await the whole process (might timeout on Vercel if > 10s).
            // Recommend running locally or splitting.
            // But we'll try fetching.
            setLogs(['⏳ Iniciando importação expandida (Ásia + Grandes Autores)...']);

            const res = await fetch('/api/admin/seed-expansion?limit=30');
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setInserted(data.inserted);
            setSkipped(data.skipped);
            setLogs(data.logs || []);
            setIsComplete(true);
        } catch (e: any) {
            setLogs(prev => [...prev, `❌ Erro: ${e.message}`]);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-900 text-stone-100">
            {/* Simple Navbar override or just back button */}
            <div className="p-4">
                <Link href="/" className="text-stone-400 hover:text-white">← Voltar para Home</Link>
            </div>

            <div className="max-w-3xl mx-auto p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Globe2 className="text-purple-500" size={32} />
                    <h1 className="text-3xl font-bold">Expansão de Biblioteca</h1>
                </div>

                <div className="bg-stone-800/50 p-6 rounded-xl border border-purple-500/20 mb-8">
                    <h3 className="font-semibold text-purple-400 mb-2">O que será importado:</h3>
                    <ul className="list-disc list-inside text-stone-300 space-y-1">
                        <li>🌏 Títulos Asiáticos (Três Corpos, Mar Inquieto, Café Esfrie)</li>
                        <li>👑 Coleções Completas: Stephen King, Tolkien, C.S. Lewis</li>
                        <li>📚 Autores: Colleen Hoover, José Luís Peixoto, Jorge Luis Borges</li>
                        <li>🖼️ Filtro Rigoroso: Apenas livros com capa de alta qualidade</li>
                        <li>🎭 Novas Vibes: Adiciona Divertido, Reflexivo, Chocante, etc. (Botão Atualizar Vibes)</li>
                    </ul>
                </div>

                <div className="flex gap-4 mb-8">
                    {!isRunning ? (
                        <Button
                            onClick={runImport}
                            disabled={isComplete}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isComplete ? <CheckCircle className="mr-2" /> : <Play className="mr-2" />}
                            {isComplete ? 'Importação Concluída' : 'Iniciar Expansão'}
                        </Button>
                    ) : (
                        <Button disabled className="bg-stone-700">
                            <Loader2 className="mr-2 animate-spin" />
                            Importando... (Pode levar alguns segundos)
                        </Button>

                    )}

                    <Button
                        onClick={runVibes}
                        disabled={isVibesRunning}
                        variant="secondary"
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200"
                    >
                        {isVibesRunning ? <Loader2 className="mr-2 animate-spin" /> : '🎭'}
                        Atualizar Vibes
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-stone-800 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-green-400">{inserted}</div>
                        <div className="text-sm text-stone-400">Novos Livros</div>
                    </div>
                    <div className="bg-stone-800 p-4 rounded-lg text-center">
                        <div className="text-3xl font-bold text-yellow-500">{skipped}</div>
                        <div className="text-sm text-stone-400">Pulados / Já Existentes</div>
                    </div>
                </div>

                <div className="bg-black/30 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs">
                    {logs.length === 0 ? (
                        <span className="text-stone-600">Logs da importação aparecerão aqui...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className={`py-1 border-b border-stone-800/50 ${log.includes('✅') ? 'text-green-400' :
                                log.includes('⏭️') ? 'text-yellow-500/70' :
                                    log.includes('❌') ? 'text-red-400' : 'text-stone-300'
                                }`}>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
}
