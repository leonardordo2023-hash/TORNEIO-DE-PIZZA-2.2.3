
import React, { useState, useEffect, useRef } from 'react';
import { PizzaData, getConfirmedSum } from '../types';
import { Language, translations } from '../services/translations';
import { Medal, Trophy, User, Activity, Crown, PartyPopper, PlayCircle, Volume2, Pizza, Star, Signal, Timer, Mic2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateNarration, decodeBase64Audio, decodeAudioData } from '../services/geminiService';

interface ChartProps {
  data: PizzaData[];
  language: Language;
  pizzaOwners?: Record<number, string>; 
  triggerReveal?: boolean; 
  onRevealComplete?: (winnerData?: { id: string | number, score: number }) => void; 
}

type RevealPhase = 'idle' | 'revealing' | 'weak_signal' | 'preparing' | 'countdown' | 'finished';

export const RankingTable: React.FC<ChartProps> = ({ data, language, pizzaOwners, triggerReveal, onRevealComplete }) => {
    const t = translations[language].rankingPanel;
    
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const [phase, setPhase] = useState<RevealPhase>('idle');
    const [revealProgress, setRevealProgress] = useState(0); 
    const [countdownValue, setCountdownValue] = useState(3);
    const [isNarrating, setIsNarrating] = useState(false);
    
    const [showFullSalgada, setShowFullSalgada] = useState(false);
    const [showFullDoce, setShowFullDoce] = useState(false);
    const [displayedScores, setDisplayedScores] = useState<Record<string, { salgada: number, doce: number }>>({});
    
    const revealIntervalRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const secondNarrationTimeoutRef = useRef<any>(null);
    
    const suspenseRef = useRef<HTMLAudioElement>(null);
    const staticRef = useRef<HTMLAudioElement>(null); 
    const beepRef = useRef<HTMLAudioElement>(null);   
    const cheerRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (triggerReveal && phase === 'idle' && !showStartOverlay) {
            setShowStartOverlay(true);
        }
    }, [triggerReveal]);

    useEffect(() => {
        return () => {
            if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
            if (secondNarrationTimeoutRef.current) clearTimeout(secondNarrationTimeoutRef.current);
            stopAllAudio();
        };
    }, []);

    const stopAllAudio = () => {
        try {
            if (suspenseRef.current) { suspenseRef.current.pause(); suspenseRef.current.currentTime = 0; }
            if (staticRef.current) { staticRef.current.pause(); staticRef.current.currentTime = 0; }
            if (beepRef.current) { beepRef.current.pause(); beepRef.current.currentTime = 0; }
            if (cheerRef.current) { cheerRef.current.pause(); cheerRef.current.currentTime = 0; }
        } catch (e) {}
    };

    const triggerNarrator = async (narrationText: string) => {
        setIsNarrating(true);
        try {
            const base64Audio = await generateNarration(narrationText);
            
            if (base64Audio) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const ctx = audioContextRef.current;
                const audioBytes = decodeBase64Audio(base64Audio);
                const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => setIsNarrating(false);
                source.start();
            } else {
                setIsNarrating(false);
            }
        } catch (e) {
            console.error(e);
            setIsNarrating(false);
        }
    };

    const handleStartSequence = async () => {
        if (suspenseRef.current) {
            suspenseRef.current.volume = 0.4;
            suspenseRef.current.play().catch(() => {});
        }
        
        setShowStartOverlay(false);
        setShowFullSalgada(true);
        setShowFullDoce(true);

        // Narrador narrando por aproximadamente 1 minuto no começo
        const introText = "Sejam muito bem-vindos à grande final do nosso Torneio de Pizza! O momento que todos esperavam finalmente chegou. Foram semanas de preparação, massas descansando, molhos sendo apurados e ingredientes selecionados a dedo. Hoje, a arena está pulsando com a energia de competidores determinados e jurados famintos por excelência. Cada fatia servida foi uma obra de arte, cada sabor uma descoberta. Vimos técnicas tradicionais se misturarem com inovações ousadas. O nível técnico deste ano superou todas as expectativas, deixando nossos especialistas em uma posição difícil. Mas agora, os dados foram lançados, as notas foram computadas e o painel de apuração começa a revelar a verdade. Preparem seus corações, pois a jornada rumo ao título de Grande Mestre Pizzaiolo começa agora. Olhem para o telão, acompanhem cada décimo de ponto, pois a glória está a apenas alguns instantes de distância. Que vença a melhor pizza!";
        triggerNarrator(introText);

        // Agendamento da segunda narração em 1 minuto e 50 segundos (110 segundos)
        secondNarrationTimeoutRef.current = setTimeout(() => {
            triggerNarrator("Quem será que vai vencer ahhh !!!!");
        }, 110000);

        startElectionMode();
    };

    const startElectionMode = () => {
        setPhase('revealing');
        setRevealProgress(0);
        
        const initialScores: Record<string, { salgada: number, doce: number }> = {};
        data.forEach(p => initialScores[p.id] = { salgada: 0, doce: 0 });
        setDisplayedScores(initialScores);

        const TOTAL_DURATION = 120000; // 2 minutos (120 segundos)
        const UPDATE_INTERVAL = 100; 
        const TOTAL_STEPS = TOTAL_DURATION / UPDATE_INTERVAL;
        let currentStep = 0;

        if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);

        revealIntervalRef.current = setInterval(() => {
            currentStep++;
            const progress = (currentStep / TOTAL_STEPS) * 90;
            setRevealProgress(progress);

            setDisplayedScores(prevScores => {
                const newScores = { ...prevScores };
                data.forEach(pizza => {
                    const realTotalSalgada = getConfirmedSum(pizza, 'salgada');
                    const realTotalDoce = getConfirmedSum(pizza, 'doce');
                    const ratio = progress / 90;
                    newScores[pizza.id] = { 
                        salgada: realTotalSalgada * ratio * (0.9 + Math.random() * 0.1), 
                        doce: realTotalDoce * ratio * (0.9 + Math.random() * 0.1) 
                    };
                });
                return newScores;
            });

            if (currentStep >= TOTAL_STEPS) {
                if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
                startWeakSignalPhase();
            }
        }, UPDATE_INTERVAL);
    };

    const startWeakSignalPhase = () => {
        setPhase('weak_signal');
        if (suspenseRef.current) suspenseRef.current.pause();
        if (staticRef.current) {
            staticRef.current.volume = 0.8;
            staticRef.current.play().catch(() => {});
        }
        setTimeout(() => { startPreparingPhase(); }, 5000);
    };

    const startPreparingPhase = () => {
        setPhase('preparing');
        if (staticRef.current) staticRef.current.pause();
        setTimeout(() => { startCountdownPhase(); }, 2000);
    };

    const startCountdownPhase = () => {
        setPhase('countdown');
        setCountdownValue(3);
        playBeep();
        let count = 3;
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdownValue(count);
                playBeep();
            } else {
                clearInterval(interval);
                finishElection();
            }
        }, 1000);
    };

    const playBeep = () => {
        if (beepRef.current) {
            beepRef.current.currentTime = 0;
            beepRef.current.play().catch(() => {});
        }
    };

    const finishElection = () => {
        setPhase('finished');
        setShowFullSalgada(false);
        setShowFullDoce(false);
        const finalScores: Record<string, { salgada: number, doce: number }> = {};
        let winnerSalgada = { id: '', score: -1 };
        data.forEach(p => {
            const sScore = getConfirmedSum(p, 'salgada');
            const dScore = getConfirmedSum(p, 'doce');
            finalScores[p.id] = { salgada: sScore, doce: dScore };
            if (sScore > winnerSalgada.score) winnerSalgada = { id: String(p.id), score: sScore };
        });
        setDisplayedScores(finalScores);
        setRevealProgress(100);
        if (cheerRef.current) {
            cheerRef.current.volume = 1.0;
            cheerRef.current.play().catch(() => {});
        }
        if (onRevealComplete) onRevealComplete(winnerSalgada);
        setTimeout(() => fireWinnerConfetti(0.2, '#f97316'), 500); 
        setTimeout(() => fireWinnerConfetti(0.8, '#ec4899'), 1500); 
    };

    const fireWinnerConfetti = (xOrigin: number, colorHex: string) => {
        const count = 200;
        const defaults = { origin: { y: 0.6, x: xOrigin }, colors: [colorHex, '#ffffff', '#fbbf24'], zIndex: 1500 };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
    };

    const salgadaList = [...data].map(p => ({ ...p, score: phase === 'finished' ? getConfirmedSum(p, 'salgada') : (displayedScores[p.id]?.salgada || 0) }))
        .filter(p => phase !== 'idle' ? true : p.score > 0)
        .sort((a, b) => b.score - a.score);

    const doceListFull = [...data].map(p => ({ ...p, score: phase === 'finished' ? getConfirmedSum(p, 'doce') : (displayedScores[p.id]?.doce || 0) }))
        .filter(p => phase !== 'idle' ? true : p.score > 0)
        .sort((a, b) => b.score - a.score); 

    const renderOverlayContent = () => {
        if (phase === 'weak_signal') {
            return (
                <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500 overflow-hidden">
                    <Signal size={120} className="text-red-600 mb-8 animate-pulse opacity-40" />
                    <h3 className="text-4xl font-black text-red-500 uppercase tracking-[0.3em] mb-6">{t.weakSignal}</h3>
                    <p className="text-white/40 font-mono text-xl uppercase tracking-widest animate-pulse">{t.reconnecting}</p>
                </div>
            );
        }
        if (phase === 'preparing') {
            return (
                <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-300">
                    <h3 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter animate-in zoom-in duration-500 select-none">
                        {t.readyQuestion.split('?')[0]}<br/><span className="text-yellow-500">?</span>
                    </h3>
                </div>
            );
        }
        if (phase === 'countdown') {
            return (
                <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-300">
                    <span className="text-[180px] md:text-[250px] font-black text-white leading-none animate-ping select-none">{countdownValue}</span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-full mx-auto flex flex-col gap-3 h-[calc(100vh-140px)] min-h-[500px]">
            <audio ref={suspenseRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2022/03/09/audio_8e07283c7b.mp3" />
            <audio ref={staticRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2022/10/16/audio_1067d2b404.mp3" /> 
            <audio ref={beepRef} preload="auto" src="https://cdn.pixabay.com/audio/2024/09/23/audio_3345579f9e.mp3" />
            <audio ref={cheerRef} preload="auto" src="https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3" />

            {showStartOverlay && (
                <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <div className="text-center space-y-8 max-w-md w-full">
                        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                            <div className="bg-indigo-600 p-6 rounded-full text-white shadow-2xl relative z-10">
                                <Volume2 size={48} className="animate-pulse" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">{t.grandFinal}</h1>
                        <p className="text-slate-300">{t.simultaneous}</p>
                        <button onClick={handleStartSequence} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xl py-5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-indigo-400/30">
                            <PlayCircle size={32} fill="currentColor" /> {t.startBroadcast}
                        </button>
                    </div>
                </div>
            )}

            {(phase !== 'idle' && !showStartOverlay) && (
                <div className={`shrink-0 p-3 rounded-xl shadow-lg border flex flex-row items-center justify-between gap-4 transition-colors duration-500 ${phase === 'revealing' ? 'bg-indigo-900 border-indigo-700 text-white' : phase === 'finished' ? 'bg-slate-900 border-yellow-500 text-white' : 'bg-black border-slate-800 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`relative ${isNarrating ? 'animate-bounce' : ''}`}>
                           {isNarrating ? <Mic2 size={20} className="text-red-500" /> : <Activity size={20} className={phase === 'revealing' ? "animate-pulse text-indigo-400" : "text-slate-400"} />}
                        </div>
                        <h2 className="text-lg font-black uppercase tracking-tight">{t.panelTitle}</h2>
                    </div>
                    {phase === 'revealing' && (
                        <div className="flex items-center gap-3 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                            <span className="text-[10px] font-bold text-indigo-300 uppercase">{isNarrating ? 'Narrador Ativo' : t.processing}</span>
                            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${revealProgress}%` }}></div>
                            </div>
                            <span className="text-xs font-mono">{revealProgress.toFixed(0)}%</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 relative">
                {renderOverlayContent()}
                
                <div className={`rounded-2xl overflow-hidden border-2 shadow-xl transition-all duration-500 flex flex-col h-full relative ${phase === 'revealing' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="bg-orange-600 px-4 py-3 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2"><Pizza size={20} /><h3 className="font-black text-base uppercase">{t.salgadaTitle}</h3></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 flex-1 flex flex-col overflow-hidden">
                        {salgadaList.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-20"><Pizza size={48}/><p>{t.waitingData}</p></div> : (
                            <div className="overflow-y-auto custom-scrollbar h-full">
                                {salgadaList.map((pizza, index) => (
                                    <div key={pizza.id} className="flex items-center px-4 py-3 border-b border-slate-50 dark:border-slate-700/50">
                                        <div className="w-8 font-black text-slate-400 text-xs">{index + 1}º</div>
                                        <div className="flex-1 px-3 min-w-0"><span className="font-black text-sm text-slate-800 dark:text-slate-100">Pizza #{pizza.id}</span></div>
                                        <div className="text-right font-black text-lg text-orange-600">{pizza.score.toFixed(1)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`rounded-2xl overflow-hidden border-2 shadow-xl transition-all duration-500 flex flex-col h-full relative ${phase === 'revealing' ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="bg-pink-600 px-4 py-3 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2"><Star size={20} /><h3 className="font-black text-base uppercase">{t.doceTitle}</h3></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 flex-1 flex flex-col overflow-hidden">
                         {doceListFull.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-20"><Star size={48}/><p>{t.waitingData}</p></div> : (
                            <div className="overflow-y-auto custom-scrollbar h-full">
                                {doceListFull.map((pizza, index) => (
                                    <div key={pizza.id} className="flex items-center px-4 py-3 border-b border-slate-50 dark:border-slate-700/50">
                                        <div className="w-8 font-black text-slate-400 text-xs">{index + 1}º</div>
                                        <div className="flex-1 px-3 min-w-0"><span className="font-black text-sm text-slate-800 dark:text-slate-100">Pizza #{pizza.id}</span></div>
                                        <div className="text-right font-black text-lg text-pink-600">{pizza.score.toFixed(1)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
