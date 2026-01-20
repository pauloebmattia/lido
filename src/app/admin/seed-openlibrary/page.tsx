'use client';

import { useState, useCallback } from 'react';
import { Play, Loader2, CheckCircle, Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function OpenLibrarySeedPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [totalInserted, setTotalInserted] = useState(0);
    const [totalSkipped, setTotalSkipped] = useState(0);
    const [totalQueries, setTotalQueries] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [...prev.slice(-50), message]);
    }, []);

    const runImport = useCallback(async () => {
        setIsRunning(true);
        setLogs([]);
        setTotalInserted(0);
        setTotalSkipped(0);
        setIsComplete(false);

        addLog('📚 Conectando à Open Library...');

        let startIndex = 0;
        const batchSize = 5;
        let hasMore = true;

        while (hasMore) {
            setCurrentBatch(startIndex);
            addLog(`⏳ Buscando autores ${startIndex + 1} - ${startIndex + batchSize}...`);

            try {
                const response = await fetch(`/api/admin/seed-openlibrary?startIndex=${startIndex}&batchSize=${batchSize}`);
                const data = await response.json();

                if (data.error) {
                    addLog(`❌ Erro: ${data.error}`);
                    break;
                }

                setTotalQueries(data.totalQueries);
                setTotalInserted(prev => prev + data.success);
                setTotalSkipped(prev => prev + data.skippedCount);

                if (data.results?.length > 0) {
                    data.results.forEach((book: any) => {
                        addLog(`✅ ${book.title}`);
                    });
                }

                if (data.skipped?.length > 0) {
                    addLog(`⏭️ ${data.skippedCount} livros pulados (sem capa)`);
                }

                startIndex += batchSize;
                hasMore = startIndex < data.totalQueries;

                // Respectful delay
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (e: any) {
                addLog(`❌ Erro de rede: ${e.message}`);
                break;
            }
        }

        setIsRunning(false);
        setIsComplete(true);
        addLog('🎉 Importação da Open Library concluída!');
    }, [addLog]);

    return (
        <div className="min-h-screen bg-stone-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-2">
                    <Library className="text-orange-500" size={32} />
                    <h1 className="text-3xl font-bold">Open Library</h1>
                </div>
                <p className="text-stone-400 mb-8">
                    Importar livros de autores brasileiros e portugueses via Open Library
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-400">{totalInserted}</div>
                        <div className="text-sm text-stone-400">Inseridos</div>
                    </div>
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-400">{totalSkipped}</div>
                        <div className="text-sm text-stone-400">Pulados</div>
                    </div>
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-orange-400">
                            {totalQueries > 0 ? Math.round((currentBatch / totalQueries) * 100) : 0}%
                        </div>
                        <div className="text-sm text-stone-400">Progresso</div>
                    </div>
                </div>

                {/* Progress Bar */}
                {totalQueries > 0 && (
                    <div className="w-full bg-stone-800 rounded-full h-3 mb-8 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentBatch / totalQueries) * 100)}%` }}
                        />
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-4 mb-8">
                    {!isRunning ? (
                        <Button
                            onClick={runImport}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                            disabled={isComplete}
                        >
                            {isComplete ? <CheckCircle size={18} /> : <Play size={18} />}
                            {isComplete ? 'Concluído!' : 'Importar da Open Library'}
                        </Button>
                    ) : (
                        <Button disabled className="flex items-center gap-2">
                            <Loader2 className="animate-spin" size={18} />
                            Buscando...
                        </Button>
                    )}
                    <Link href="/admin/seed-brazil">
                        <Button variant="secondary">← Voltar</Button>
                    </Link>
                </div>

                {/* Info */}
                <div className="bg-stone-800/50 rounded-xl p-4 mb-8 border border-orange-500/30">
                    <h3 className="font-medium mb-2 text-orange-400">Autores que serão buscados:</h3>
                    <ul className="text-sm text-stone-400 space-y-1">
                        <li>📖 Clássicos: Machado de Assis, Clarice Lispector, Jorge Amado, Érico Veríssimo</li>
                        <li>🇵🇹 Portugueses: José Saramago, Fernando Pessoa</li>
                        <li>🆕 Contemporâneos: Conceição Evaristo, Djamila Ribeiro, Milton Hatoum</li>
                        <li>✨ Poetas: Drummond, Cecília Meireles, Vinicius de Moraes</li>
                        <li>📚 Total: ~35 buscas de autores brasileiros e portugueses</li>
                    </ul>
                </div>

                {/* Logs */}
                <div className="bg-stone-800 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-stone-500 text-center py-8">
                            Clique em "Importar da Open Library" para começar
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div
                                key={i}
                                className={`py-0.5 ${log.startsWith('✅') ? 'text-green-400' :
                                        log.startsWith('❌') ? 'text-red-400' :
                                            log.startsWith('⏭️') ? 'text-yellow-400' :
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
