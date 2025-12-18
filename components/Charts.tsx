
import React, { useState, useEffect, useRef } from 'react';
import { PizzaData, getSum } from '../types';
import { Language, translations } from '../services/translations';
import { Medal, Trophy, User, Activity, Crown, PartyPopper, WifiOff, PlayCircle, Volume2, Pizza, Star, Signal, Timer, List, ChevronUp, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChartProps {
  data: PizzaData[];
  language: Language;
  pizzaOwners?: Record<number, string>; 
  triggerReveal?: boolean; 
  onRevealComplete?: (winnerData?: { id: string | number, score: number }) => void; 
}

const getConfirmedSum = (pizza: PizzaData, category: 'salgada' | 'doce'): number => {
    let beautyScores, tasteScores, bonusScores;
    
    if (category === 'salgada') {
        beautyScores = pizza.beautyScores;
        tasteScores = pizza.tasteScores;
        bonusScores = pizza.bonusScores || {};
    } else {
        beautyScores = pizza.beautyScoresDoce || {};
        tasteScores = pizza.tasteScoresDoce || {};
        bonusScores = pizza.bonusScoresDoce || {};
    }
    
    const confirmedVotes = pizza.confirmedVotes || {};
    
    let sum = 0;
    Object.keys(beautyScores).forEach(userId => {
        if (confirmedVotes[userId]) {
            sum += (beautyScores[userId] || 0);
            sum += (tasteScores[userId] || 0);
            sum += (bonusScores[userId] || 0);
        }
    });
    return sum;
};

type RevealPhase = 'idle' | 'revealing' | 'weak_signal' | 'preparing' | 'countdown' | 'finished';

export const RankingTable: React.FC<ChartProps> = ({ data, language, pizzaOwners, triggerReveal, onRevealComplete }) => {
    const t = translations[language].rankingPanel;
    
    const [showStartOverlay, setShowStartOverlay] = useState(false);
    const [phase, setPhase] = useState<RevealPhase>('idle');
    const [revealProgress, setRevealProgress] = useState(0); 
    const [countdownValue, setCountdownValue] = useState(3);
    
    const [showFullSalgada, setShowFullSalgada] = useState(false);
    const [showFullDoce, setShowFullDoce] = useState(false);
    
    const [displayedScores, setDisplayedScores] = useState<Record<string, { salgada: number, doce: number }>>({});
    
    const revealIntervalRef = useRef<any>(null);
    
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

    const handleStartSequence = () => {
        if (suspenseRef.current) {
            suspenseRef.current.volume = 0.5;
            suspenseRef.current.play().catch(() => {});
        }
        setShowStartOverlay(false);
        setShowFullSalgada(true);
        setShowFullDoce(true);
        startElectionMode();
    };

    const startElectionMode = () => {
        setPhase('revealing');
        setRevealProgress(0);
        
        const initialScores: Record<string, { salgada: number, doce: number }> = {};
        data.forEach(p => initialScores[p.id] = { salgada: 0, doce: 0 });
        setDisplayedScores(initialScores);

        const TOTAL_DURATION = 90000; 
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
                        salgada: realTotalSalgada * ratio * 0.95, 
                        doce: realTotalDoce * ratio * 0.95 
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

        setTimeout(() => {
            startPreparingPhase();
        }, 5000);
    };

    const startPreparingPhase = () => {
        setPhase('preparing');
        if (staticRef.current) staticRef.current.pause();
        
        setTimeout(() => {
            startCountdownPhase();
        }, 2000);
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
            
            if (sScore > winnerSalgada.score) {
                winnerSalgada = { id: String(p.id), score: sScore };
            }
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
        setTimeout(() => fireWinnerConfetti(0.5, '#FFD700'), 2500); 
    };

    const fireWinnerConfetti = (xOrigin: number, colorHex: string) => {
        const count = 300;
        const defaults = { origin: { y: 0.6, x: xOrigin }, colors: [colorHex, '#ffffff', '#fbbf24'], zIndex: 1500 };
        function fire(particleRatio: number, opts: any) {
            confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
        }
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    };

    const salgadaList = [...data].map(p => {
        if (phase !== 'finished') {
            return { ...p, score: displayedScores[p.id]?.salgada || 0 };
        }
        return { ...p, score: getConfirmedSum(p, 'salgada') };
    })
    .filter(p => phase !== 'idle' ? true : p.score > 0)
    .sort((a, b) => b.score - a.score);

    const doceListFull = [...data].map(p => {
        if (phase !== 'finished') {
            return { ...p, score: displayedScores[p.id]?.doce || 0 };
        }
        return { ...p, score: getConfirmedSum(p, 'doce') };
    })
    .filter(p => phase !== 'idle' ? true : p.score > 0)
    .sort((a, b) => b.score - a.score); 

    const doceWinner = doceListFull.length > 0 ? doceListFull[0] : null;

    const getMedal = (index: number) => {
        if (index === 0) return <Medal size={28} className="text-yellow-400 fill-yellow-400 drop-shadow-md animate-pulse" />;
        if (index === 1) return <Medal size={24} className="text-slate-300 fill-slate-300 drop-shadow-sm" />;
        if (index === 2) return <Medal size={24} className="text-amber-700 fill-amber-700 drop-shadow-sm" />;
        return <span className="text-slate-400 font-bold w-6 text-center text-sm">{index + 1}{t.position}</span>;
    };

    const renderOverlayContent = () => {
        if (phase === 'weak_signal') {
            return (
                <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-500 overflow-hidden">
                    <Signal size={120} className="text-red-600 mb-8 animate-pulse opacity-40" />
                    <h3 className="text-4xl font-black text-red-500 uppercase tracking-[0.3em] mb-6">{t.weakSignal}</h3>
                    <p className="text-white/40 font-mono text-xl uppercase tracking-widest animate-pulse">{t.reconnecting}</p>
                    <div className="mt-12 flex gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-bounce" style={{ animationDelay: '400ms' }}></div>
                    </div>
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
                    <span className="text-[180px] md:text-[250px] font-black text-white leading-none animate-ping-short select-none">
                        {countdownValue}
                    </span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full max-w-full mx-auto flex flex-col gap-3 h-[calc(100vh-140px)] min-h-[500px]">
            <audio ref={suspenseRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2022/03/09/audio_8e07283c7b.mp3" onError={(e) => { e.preventDefault(); }} />
            <audio ref={staticRef} loop preload="auto" src="https://cdn.pixabay.com/audio/2022/10/16/audio_1067d2b404.mp3" onError={(e) => { e.preventDefault(); }} /> 
            <audio ref={beepRef} preload="auto" src="https://cdn.pixabay.com/audio/2024/09/23/audio_3345579f9e.mp3" onError={(e) => { e.preventDefault(); }} />
            <audio ref={cheerRef} preload="auto" src="https://cdn.pixabay.com/audio/2021/08/04/audio_bb630cc098.mp3" onError={(e) => { e.preventDefault(); }} />

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
                        <button 
                            onClick={handleStartSequence}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xl py-5 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-indigo-400/30 cursor-pointer"
                        >
                            <PlayCircle size={32} fill="currentColor" className="text-white" />
                            {t.startBroadcast}
                        </button>
                    </div>
                </div>
            )}

            {(phase !== 'idle' && !showStartOverlay) && (
                <div className={`shrink-0 p-3 rounded-xl shadow-lg border flex flex-row items-center justify-between gap-4 transition-colors duration-500 ${phase === 'revealing' ? 'bg-indigo-900 border-indigo-700 text-white' : phase === 'finished' ? 'bg-slate-900 border-yellow-500 text-white' : 'bg-black border-slate-800 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <Activity size={20} className={phase === 'revealing' ? "animate-pulse text-indigo-400" : "text-slate-400"} />
                        <h2 className="text-lg font-black uppercase tracking-tight">{t.panelTitle}</h2>
                    </div>
                    {phase === 'revealing' && (
                        <div className="flex items-center gap-3 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                            <span className="text-[10px] font-bold text-indigo-300 uppercase">{t.processing}</span>
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
                    <div className="bg-orange-600 px-4 py-3 text-white flex items-center justify-between shrink-0 relative z-20">
                        <div className="flex items-center gap-2">
                            <Pizza size={20} className="animate-spin-slow" />
                            <h3 className="font-black text-base uppercase">{t.salgadaTitle}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 flex-1 flex flex-col relative overflow-hidden">
                        {salgadaList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                <Pizza size={48} className="mb-2 opacity-20" />
                                <p className="text-sm">{t.waitingData}</p>
                            </div>
                        ) : (
                            <>
                                {!showFullSalgada ? (
                                    <div className="relative z-10 w-full h-full p-2">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-50 via-transparent to-transparent dark:from-orange-900/10 opacity-50 pointer-events-none"></div>
                                        <div className="grid grid-cols-2 grid-rows-[1.6fr_1fr] gap-2 h-full">
                                            {salgadaList.slice(0, 3).map((pizza, index) => {
                                                const ownerName = pizzaOwners ? pizzaOwners[Number(pizza.id)] : null;
                                                const isFirst = index === 0;
                                                return (
                                                    <div 
                                                        key={pizza.id} 
                                                        className={`relative z-10 text-center flex flex-col items-center justify-center p-2 rounded-2xl border transition-all animate-in zoom-in duration-500 fill-mode-backwards
                                                        ${isFirst 
                                                            ? 'col-span-2 bg-orange-50/80 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 shadow-xl' 
                                                            : 'col-span-1 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-md opacity-90'
                                                        }`}
                                                        style={{ animationDelay: `${index * 150}ms` }}
                                                    >
                                                        <div className={`mb-1 inline-block rounded-full shadow-lg ${isFirst ? 'p-3 bg-gradient-to-br from-yellow-300 to-amber-500 shadow-yellow-500/30 animate-bounce-slow' : index === 1 ? 'p-1.5 bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-400/30' : 'p-1.5 bg-gradient-to-br from-orange-400 to-amber-800 shadow-orange-800/30'}`}>
                                                            {isFirst ? <Trophy size={32} className="text-white" /> : <Medal size={16} className="text-white" />}
                                                        </div>
                                                        <h4 className={`font-bold uppercase tracking-widest leading-none mb-1 ${isFirst ? 'text-[10px] text-orange-600 dark:text-orange-400 mt-2' : 'text-[8px] text-slate-500 dark:text-slate-400'}`}>
                                                            {index + 1}{t.position}
                                                        </h4>
                                                        <div className={`${isFirst ? 'text-5xl mb-2' : 'text-2xl mb-1'} font-black text-slate-900 dark:text-white tracking-tighter`}>
                                                            #{pizza.id}
                                                        </div>
                                                        {ownerName && (
                                                            <div className="flex items-center justify-center gap-2 mb-1">
                                                                <span className={`${isFirst ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm px-4 py-1 mb-2' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] px-2 py-0.5'} rounded-full font-bold shadow-sm truncate max-w-full`}>
                                                                    Chef {ownerName}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className={`${isFirst ? 'bg-slate-100 dark:bg-slate-900/50 p-2 min-w-[120px]' : 'bg-slate-50 dark:bg-slate-900/30 p-1 min-w-[60px]'} rounded-xl border border-slate-200 dark:border-slate-700 inline-block`}>
                                                            <span className={`block text-[7px] text-slate-500 uppercase font-bold mb-0.5`}>Pontuação</span>
                                                            <span className={`block ${isFirst ? 'text-2xl' : 'text-lg'} font-black ${phase !== 'finished' ? 'text-orange-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                                                                {pizza.score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto custom-scrollbar h-full">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {salgadaList.map((pizza, index) => {
                                                const ownerName = pizzaOwners ? pizzaOwners[Number(pizza.id)] : null;
                                                return (
                                                    <div key={pizza.id} className="flex items-center px-4 py-3 transition-all">
                                                        <div className="w-8 flex justify-center">{getMedal(index)}</div>
                                                        <div className="flex-1 px-3 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">Pizza #{pizza.id}</span>
                                                            </div>
                                                            {ownerName && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 truncate"><User size={9} /> Chef {ownerName}</div>}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`font-black text-xl ${phase !== 'finished' ? 'text-orange-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {pizza.score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className={`rounded-2xl overflow-hidden border-2 shadow-xl transition-all duration-500 flex flex-col h-full relative ${phase === 'revealing' ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="bg-pink-600 px-4 py-3 text-white flex items-center justify-between shrink-0 relative z-20">
                        <div className="flex items-center gap-2">
                            <Star size={20} className="animate-pulse" />
                            <h3 className="font-black text-base uppercase">{t.doceTitle}</h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 flex-1 flex flex-col relative overflow-hidden">
                        {!doceWinner ? (
                            <div className="flex flex-col items-center justify-center text-slate-400 p-8 h-full">
                                <Crown size={48} className="mb-2 opacity-20" />
                                <p className="text-sm">{t.waitingData}</p>
                            </div>
                        ) : (
                            <>
                                {!showFullDoce ? (
                                    <div className="relative z-10 text-center w-full animate-in zoom-in duration-500 flex flex-col items-center justify-center h-full p-4">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-50 via-transparent to-transparent dark:from-pink-900/10 opacity-50 pointer-events-none"></div>
                                        <div className="mb-6 inline-block p-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-yellow-500/30 animate-bounce-slow">
                                            <Trophy size={56} className="text-white" />
                                        </div>
                                        <h4 className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest mb-3">{t.championDoce}</h4>
                                        <div className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">
                                            #{doceWinner.id}
                                        </div>
                                        {pizzaOwners && pizzaOwners[Number(doceWinner.id)] && (
                                            <div className="flex items-center justify-center gap-2 mb-8">
                                                <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-5 py-2 rounded-full font-bold text-xl shadow-sm border border-pink-200 dark:border-pink-800">
                                                    Chef {pizzaOwners[Number(doceWinner.id)]}
                                                </span>
                                            </div>
                                        )}
                                        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 inline-block min-w-[200px]">
                                            <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">{t.finalScore}</span>
                                            <span className={`block text-4xl font-black ${phase !== 'finished' ? 'text-pink-600 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                                                {doceWinner.score.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto custom-scrollbar h-full">
                                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {doceListFull.map((pizza, index) => {
                                                const ownerName = pizzaOwners ? pizzaOwners[Number(pizza.id)] : null;
                                                return (
                                                    <div key={pizza.id} className="flex items-center px-4 py-3 transition-all">
                                                        <div className="w-8 flex justify-center">{getMedal(index)}</div>
                                                        <div className="flex-1 px-3 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">Pizza #{pizza.id}</span>
                                                            </div>
                                                            {ownerName && <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 truncate"><User size={9} /> Chef {ownerName}</div>}
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className={`font-black text-xl ${phase !== 'finished' ? 'text-pink-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {pizza.score.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export const ScoresBarChart: React.FC<ChartProps> = () => null;
export const TasteVsBeautyChart: React.FC<ChartProps> = () => null;
