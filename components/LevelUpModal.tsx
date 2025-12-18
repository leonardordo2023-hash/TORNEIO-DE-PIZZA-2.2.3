
import React, { useEffect, useState } from 'react';
import { ChevronUp, Zap, Crown, ArrowRight, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
    newLevel: number;
    onClose: () => void;
    nickname: string;
    onTestNextLevel?: () => void; // Função opcional para simulação
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ newLevel, onClose, nickname, onTestNextLevel }) => {
    const [progress, setProgress] = useState(0);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Resetar progresso para animação funcionar na troca de nível
        setProgress(0);
        
        // Animação da barra de progresso
        const progressTimer = setTimeout(() => setProgress(100), 100);

        // Timer de 20 segundos para fechar (apenas se não estiver em simulação)
        let closeTimer: any;
        if (!onTestNextLevel) {
            closeTimer = setTimeout(() => {
                handleClose();
            }, 20000);
        }

        // Confetes Contínuos
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                zIndex: 200
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                zIndex: 200
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Explosão inicial
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            zIndex: 200
        });

        return () => {
            clearTimeout(progressTimer);
            if (closeTimer) clearTimeout(closeTimer);
        };
    }, [newLevel]); 

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 500); 
    };

    const isMaxLevel = newLevel >= 5;

    const getLevelTitle = (lvl: number) => {
        if (lvl <= 0) return "VISITANTE";
        if (lvl >= 5) return "LENDA SUPREMA";
        if (lvl >= 4) return "GRÃO-MESTRE";
        if (lvl >= 3) return "CHEF DE ELITE";
        if (lvl >= 2) return "MESTRE PIZZAIOLO";
        return "APRENDIZ";
    };

    const oldTitle = getLevelTitle(newLevel - 1);
    const newTitle = getLevelTitle(newLevel);

    const renderLevelIcons = () => {
        if (isMaxLevel) {
            return <Crown size={48} className="text-yellow-200 drop-shadow-md" />;
        }

        const arrowCount = newLevel || 1;
        const icons = Array.from({ length: arrowCount });
        
        let gridClass = "flex items-center justify-center";
        let iconSize = 48;

        if (arrowCount === 1) {
            iconSize = 48;
        } else if (arrowCount === 2) {
            gridClass = "flex gap-1";
            iconSize = 32;
        } else if (arrowCount === 3) {
            gridClass = "grid grid-cols-2 gap-0.5 justify-items-center items-center"; 
            iconSize = 22;
        } else {
            gridClass = "grid grid-cols-2 gap-1";
            iconSize = 20;
        }

        return (
            <div className={`${gridClass} transition-all`}>
                {icons.map((_, index) => (
                    <ChevronUp 
                        key={index} 
                        size={iconSize} 
                        className={`text-slate-700 dark:text-slate-400 drop-shadow-md animate-pulse ${arrowCount === 3 && index === 2 ? 'col-span-2' : ''}`}
                        style={{ animationDelay: `${index * 150}ms` }}
                        strokeWidth={4}
                    />
                ))}
            </div>
        );
    };

    return (
        <div 
            className={`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isExiting ? 'opacity-0' : 'opacity-100 animate-in fade-in'}`}
            onClick={handleClose}
        >
            <div 
                className={`relative w-full max-w-sm bg-gradient-to-b from-indigo-900 to-slate-900 rounded-3xl p-1 shadow-2xl border border-indigo-500/50 overflow-hidden transform transition-all duration-500 ${isExiting ? 'scale-90 opacity-0' : 'scale-100 animate-in zoom-in-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-spin-slow"></div>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-xl rounded-[22px] p-8 flex flex-col items-center text-center relative z-10">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-40 animate-pulse"></div>
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-700 flex items-center justify-center shadow-lg ring-4 ring-orange-500/30 animate-bounce-slow">
                            {renderLevelIcons()}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-white text-indigo-900 p-1.5 rounded-full shadow-lg animate-ping">
                            <Zap size={16} fill="currentColor" />
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2 leading-tight">
                        {isMaxLevel ? "LENDA SUPREMA!" : (
                            <>PARABÉNS, <span className="text-orange-400 text-2xl block mt-1">{nickname}!</span></>
                        )}
                    </h2>

                    <div className="text-slate-300 font-medium text-lg leading-relaxed mb-6">
                        {isMaxLevel ? (
                            <>Você alcançou o <br/><span className="text-yellow-400 font-black text-xl">NÍVEL MÁXIMO</span></>
                        ) : (
                            <>Você subiu para o <br/><span className="text-indigo-400 font-black text-xl">NÍVEL {newLevel}</span></>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-slate-800/80 px-4 py-4 rounded-2xl border border-slate-700 mb-8 shadow-inner w-full min-h-[80px]">
                        <div className="flex flex-col items-center w-[35%] opacity-60 scale-90">
                            <span className="text-[9px] text-slate-500 uppercase font-bold mb-1">De</span>
                            <span className="text-xs font-bold text-slate-300 uppercase text-center leading-tight">{oldTitle}</span>
                        </div>
                        <div className="flex items-center justify-center w-[10%]">
                            <ArrowRight size={24} className="text-slate-400 animate-pulse" strokeWidth={3} />
                        </div>
                        <div className="flex flex-col items-center w-[55%]">
                            <span className="text-[9px] text-orange-400 uppercase font-bold mb-1">Para</span>
                            <span className="text-sm font-black text-white uppercase tracking-wider text-center leading-tight scale-110">{newTitle}</span>
                        </div>
                    </div>

                    <div className="w-full relative">
                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-widest">
                            <span>Progresso</span>
                            <span>{isMaxLevel ? 'MAX' : '100%'}</span>
                        </div>
                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                            <div className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" style={{ width: `${progress}%`, transition: 'width 3s ease-in-out' }}></div>
                        </div>
                    </div>

                    {onTestNextLevel ? (
                        <button onClick={(e) => { e.stopPropagation(); onTestNextLevel(); }} className="mt-6 w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            <RotateCw size={18} /> Ver Próximo Nível
                        </button>
                    ) : (
                        <p className="mt-6 text-[10px] text-slate-500 animate-pulse">Toque fora para fechar</p>
                    )}
                </div>
            </div>
        </div>
    );
};
