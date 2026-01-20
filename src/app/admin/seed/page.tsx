'use client';

import { useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Brazilian Portuguese focused categories and search terms
const CATEGORIES = [
    // Literatura Brasileira
    'literatura brasileira', 'romance brasileiro', 'poesia brasileira',
    // Gêneros populares em PT-BR
    'romance', 'suspense', 'terror', 'fantasia', 'ficção científica',
    'autoajuda', 'desenvolvimento pessoal', 'negócios', 'empreendedorismo',
    // Não-ficção
    'história do Brasil', 'biografia', 'psicologia', 'filosofia',
    'política', 'economia', 'ciência', 'saúde', 'nutrição',
    // Outros gêneros
    'infantil', 'juvenil', 'quadrinhos', 'religião', 'espiritualidade',
    'culinária', 'arte', 'música', 'viagem', 'educação'
];

interface LogEntry {
    type: 'success' | 'error' | 'info' | 'skip';
    message: string;
    timestamp: Date;
}

export default function AdminSeedPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentCategory, setCurrentCategory] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalInserted, setTotalInserted] = useState(0);
    const [totalSkipped, setTotalSkipped] = useState(0);
    const [totalErrors, setTotalErrors] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progress, setProgress] = useState(0);

    const addLog = useCallback((type: LogEntry['type'], message: string) => {
        setLogs(prev => [...prev.slice(-100), { type, message, timestamp: new Date() }]);
    }, []);

    const runSeed = useCallback(async () => {
        setIsRunning(true);
        setIsPaused(false);
        setLogs([]);
        setTotalInserted(0);
        setTotalSkipped(0);
        setTotalErrors(0);
        setProgress(0);

        // 3 pages per category (0, 40, 80) = 120 books per category max
        const PAGES_PER_CATEGORY = [0, 40, 80];
        const totalSteps = CATEGORIES.length * PAGES_PER_CATEGORY.length;
        let stepsDone = 0;

        for (const category of CATEGORIES) {
            if (isPaused) {
                addLog('info', '⏸️ Paused by user');
                break;
            }

            setCurrentCategory(category);
            addLog('info', `📚 Buscando: ${category.toUpperCase()}`);

            for (const startIndex of PAGES_PER_CATEGORY) {
                if (isPaused) break;

                setCurrentIndex(startIndex);

                try {
                    const response = await fetch(`/api/admin/seed?category=${encodeURIComponent(category)}&startIndex=${startIndex}`);
                    const data = await response.json();

                    if (data.error) {
                        addLog('error', `❌ ${category} [${startIndex}]: ${data.error}`);
                        setTotalErrors(prev => prev + 1);
                    } else {
                        setTotalInserted(prev => prev + data.success);
                        setTotalSkipped(prev => prev + (data.skippedCount || 0));

                        if (data.success > 0) {
                            addLog('success', `✅ ${category} [${startIndex}]: +${data.success} livros`);
                        }
                        if (data.errors?.length > 0) {
                            data.errors.forEach((err: string) => addLog('error', `⚠️ ${err}`));
                            setTotalErrors(prev => prev + data.errors.length);
                        }
                    }
                } catch (e: any) {
                    addLog('error', `❌ Fetch error (${category}): ${e.message}`);
                    setTotalErrors(prev => prev + 1);
                }

                stepsDone++;
                setProgress(Math.round((stepsDone / totalSteps) * 100));

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }

        setIsRunning(false);
        addLog('info', '🎉 Importação concluída!');
    }, [addLog, isPaused]);

    const handleStop = () => {
        setIsPaused(true);
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setIsPaused(false);
        setCurrentCategory('');
        setCurrentIndex(0);
        setTotalInserted(0);
        setTotalSkipped(0);
        setTotalErrors(0);
        setLogs([]);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-stone-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">🌱 Mass Seed Dashboard</h1>
                <p className="text-stone-400 mb-8">Importar 1000+ livros do Google Books</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-400">{totalInserted}</div>
                        <div className="text-sm text-stone-400">Inseridos</div>
                    </div>
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-yellow-400">{totalSkipped}</div>
                        <div className="text-sm text-stone-400">Pulados</div>
                    </div>
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-red-400">{totalErrors}</div>
                        <div className="text-sm text-stone-400">Erros</div>
                    </div>
                    <div className="bg-stone-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-400">{progress}%</div>
                        <div className="text-sm text-stone-400">Progresso</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-stone-800 rounded-full h-4 mb-8 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Current Status */}
                {isRunning && (
                    <div className="bg-stone-800 rounded-xl p-4 mb-8 flex items-center gap-4">
                        <Loader2 className="animate-spin text-blue-400" size={24} />
                        <div>
                            <div className="font-medium">Processando: {currentCategory.toUpperCase()}</div>
                            <div className="text-sm text-stone-400">Categoria {CATEGORIES.indexOf(currentCategory) + 1} de {CATEGORIES.length}</div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex gap-4 mb-8">
                    {!isRunning ? (
                        <Button onClick={runSeed} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                            <Play size={18} />
                            Iniciar Importação
                        </Button>
                    ) : (
                        <Button onClick={handleStop} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700">
                            <Pause size={18} />
                            Pausar
                        </Button>
                    )}
                    <Button onClick={handleReset} variant="secondary" className="flex items-center gap-2">
                        <RotateCcw size={18} />
                        Resetar
                    </Button>
                </div>

                {/* Logs */}
                <div className="bg-stone-800 rounded-xl p-4 h-80 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-stone-500 text-center py-8">
                            Clique em "Iniciar Importação" para começar
                        </div>
                    ) : (
                        logs.map((log, i) => (
                            <div
                                key={i}
                                className={`py-1 ${log.type === 'success' ? 'text-green-400' :
                                    log.type === 'error' ? 'text-red-400' :
                                        log.type === 'skip' ? 'text-yellow-400' :
                                            'text-stone-400'
                                    }`}
                            >
                                <span className="text-stone-600">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
                            </div>
                        ))
                    )}
                </div>

                {/* Categories Preview */}
                <div className="mt-8">
                    <h2 className="text-lg font-medium mb-4">Categorias ({CATEGORIES.length})</h2>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <span
                                key={cat}
                                className={`px-3 py-1 rounded-full text-sm ${currentCategory === cat
                                    ? 'bg-blue-600 text-white'
                                    : CATEGORIES.indexOf(cat) < CATEGORIES.indexOf(currentCategory)
                                        ? 'bg-green-600/30 text-green-400'
                                        : 'bg-stone-700 text-stone-400'
                                    }`}
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
