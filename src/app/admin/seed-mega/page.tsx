'use client';

import { useState, useCallback } from 'react';
import { Play, Loader2, CheckCircle, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function MegaSeedPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [totalInserted, setTotalInserted] = useState(0);
    const [totalSkipped, setTotalSkipped] = useState(0);
    const [totalBooks, setTotalBooks] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-100), message]);
    }, []);

    const runImport = useCallback(async () => {
        setIsRunning(true);
        setLogs([]);
        setTotalInserted(0);
        setTotalSkipped(0);
        setIsComplete(false);

        addLog('🚀 MEGA IMPORTAÇÃO INICIADA!');
        addLog('📚 220+ títulos em português...');

        let startIndex = 0;
        const batchSize = 15;
        let hasMore = true;

        while (hasMore) {
            setCurrentBatch(startIndex);
            addLog(`⏳ Lote ${Math.floor(startIndex / batchSize) + 1}: livros ${startIndex + 1}-${startIndex + batchSize}...`);

            try {
                const response = await fetch(`/api/admin/seed-mega?startIndex=${startIndex}&batchSize=${batchSize}`);
                const data = await response.json();

                if (data.error) {
                    addLog(`❌ Erro: ${data.error}`);
                    break;
                }

                setTotalBooks(data.totalBooks);
                setTotalInserted(prev => prev + data.success);
                setTotalSkipped(prev => prev + data.skippedCount);

                if (data.results?.length > 0) {
                    addLog(`✅ +${data.results.length} livros inseridos`);
                }

                startIndex += batchSize;
                hasMore = startIndex < data.totalBooks;

                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (e: any) {
                addLog(`❌ Erro de rede: ${e.message}`);
                break;
            }
        }

        setIsRunning(false);
        setIsComplete(true);
        addLog('🎉 MEGA IMPORTAÇÃO CONCLUÍDA!');
    }, [addLog]);

    const progress = totalBooks > 0 ? Math.min(100, Math.round((currentBatch / totalBooks) * 100)) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-purple-950 to-stone-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-2">
                    <Rocket className="text-purple-400" size={32} />
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        MEGA Import Português
                    </h1>
                </div>
                <p className="text-stone-400 mb-8">
                    Importação massiva: 220+ títulos populares em português brasileiro
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-stone-800/80 backdrop-blur rounded-xl p-6 text-center border border-purple-500/20">
                        <div className="text-4xl font-bold text-green-400">{totalInserted}</div>
                        <div className="text-sm text-stone-400">Inseridos</div>
                    </div>
                    <div className="bg-stone-800/80 backdrop-blur rounded-xl p-6 text-center border border-purple-500/20">
                        <div className="text-4xl font-bold text-yellow-400">{totalSkipped}</div>
                        <div className="text-sm text-stone-400">Pulados</div>
                    </div>
                    <div className="bg-stone-800/80 backdrop-blur rounded-xl p-6 text-center border border-purple-500/20">
                        <div className="text-4xl font-bold text-purple-400">{progress}%</div>
                        <div className="text-sm text-stone-400">Progresso</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-800 rounded-full h-4 mb-8 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-full transition-all duration-500 animate-pulse"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Controls */}
                <div className="flex gap-4 mb-8">
                    {!isRunning ? (
                        <Button
                            onClick={runImport}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
                            disabled={isComplete}
                        >
                            {isComplete ? <CheckCircle size={20} /> : <Rocket size={20} />}
                            {isComplete ? 'Concluído!' : '🚀 INICIAR MEGA IMPORT'}
                        </Button>
                    ) : (
                        <Button disabled className="flex items-center gap-2 text-lg px-8 py-6">
                            <Loader2 className="animate-spin" size={20} />
                            Importando...
                        </Button>
                    )}
                    <Link href="/admin/seed-brazil">
                        <Button variant="secondary">← Voltar</Button>
                    </Link>
                </div>

                {/* Content Categories */}
                <div className="bg-stone-800/50 rounded-xl p-4 mb-8 border border-purple-500/20">
                    <h3 className="font-medium mb-3 text-purple-400">Conteúdo incluído:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-stone-400">
                        <div>📖 Machado de Assis (completo)</div>
                        <div>📖 Clarice Lispector (completo)</div>
                        <div>📖 Jorge Amado (completo)</div>
                        <div>📖 Paulo Coelho (10+ livros)</div>
                        <div>📖 Augusto Cury (8+ livros)</div>
                        <div>🔥 Colleen Hoover em PT-BR</div>
                        <div>⚡ Harry Potter completo</div>
                        <div>🧙 Tolkien completo</div>
                        <div>⚔️ Percy Jackson completo</div>
                        <div>👻 Stephen King (10+ livros)</div>
                        <div>💡 Autoajuda (20+ livros)</div>
                        <div>🧒 Infantojuvenil nacional</div>
                    </div>
                </div>

                {/* Logs */}
                <div className="bg-stone-800/80 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm border border-purple-500/20">
                    {logs.length === 0 ? (
                        <div className="text-stone-500 text-center py-8">
                            Clique em "INICIAR MEGA IMPORT" para começar
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div
                                key={i}
                                className={`py-0.5 ${log.startsWith('✅') ? 'text-green-400' :
                                        log.startsWith('❌') ? 'text-red-400' :
                                            log.startsWith('🚀') || log.startsWith('🎉') ? 'text-purple-400 font-bold' :
                                                'text-stone-400'
                                    }`}
                            >
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
