
import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface IntroPageProps {
    onFinish: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({ onFinish }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [showButton, setShowButton] = useState(false);
    
    // Texto solicitado com espaços preservados para o split
    const text = "Bem Vindos ( a )";
    const letters = text.split("");

    useEffect(() => {
        // Calcula o tempo total da animação de texto para mostrar o botão
        // 100ms por letra + um pequeno delay extra (800ms)
        const totalDuration = letters.length * 100 + 800;
        
        const timer = setTimeout(() => {
            setShowButton(true);
        }, totalDuration);
        
        return () => clearTimeout(timer);
    }, [letters.length]);

    const handleStart = () => {
        setIsExiting(true);
        // Aguarda a animação de saída (zoom out/fade out) antes de chamar o onFinish
        setTimeout(() => {
            onFinish();
        }, 700); 
    };

    return (
        <div className={`fixed inset-0 z-[300] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Background Dinâmico (Idêntico ao AuthPage e App para consistência) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-orange-400/20 rounded-full blur-[80px] animate-float mix-blend-multiply dark:mix-blend-normal dark:bg-orange-900/20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-red-500/20 rounded-full blur-[90px] animate-float-delayed mix-blend-multiply dark:mix-blend-normal dark:bg-red-900/20"></div>
                <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-yellow-400/10 rounded-full blur-[60px] animate-pulse-slow mix-blend-multiply dark:mix-blend-normal dark:bg-yellow-900/10"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 w-full max-w-md px-6">
                
                {/* Logo com animação de entrada suave */}
                <div className="relative animate-in zoom-in duration-1000 ease-out">
                    <div className="absolute inset-0 bg-white/50 dark:bg-white/10 blur-2xl rounded-full animate-pulse-slow"></div>
                    <img 
                        src="./logo.png" 
                        alt="Logo" 
                        className="w-48 h-48 object-contain drop-shadow-2xl animate-float"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                </div>

                {/* Texto Animado Letra por Letra (Efeito Datilografia) */}
                <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight flex flex-wrap justify-center gap-1 min-h-[60px]">
                    {letters.map((char, index) => (
                        <span 
                            key={index} 
                            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both inline-block"
                            style={{ 
                                animationDelay: `${index * 100}ms`, // Atraso progressivo
                                animationDuration: '0.5s',
                                textShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                whiteSpace: char === ' ' ? 'pre' : 'normal' // Preserva espaços
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </h1>

                {/* Botão de Ação (Flecha) - Aparece depois do texto */}
                <div className={`transition-all duration-1000 transform ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <button 
                        onClick={handleStart}
                        className="group relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-2xl shadow-orange-500/40 hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/20 dark:ring-black/20"
                    >
                        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-20"></div>
                        <ArrowRight size={40} className="text-white group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                        
                        {/* Decoração Sparkles */}
                        <div className="absolute -top-2 -right-2 text-yellow-300 animate-bounce-slow">
                            <Sparkles size={24} fill="currentColor" />
                        </div>
                    </button>
                    
                    <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-8 text-center animate-pulse">
                        Iniciar
                    </p>
                </div>

            </div>
        </div>
    );
};
