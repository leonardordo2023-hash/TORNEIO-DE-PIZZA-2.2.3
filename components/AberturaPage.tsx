
import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame } from 'lucide-react';

interface AberturaPageProps {
    onFinish: () => void;
}

export const AberturaPage: React.FC<AberturaPageProps> = ({ onFinish }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleStart = () => {
        setIsExiting(true);
        setTimeout(() => {
            onFinish();
        }, 700); 
    };

    return (
        <div className={`fixed inset-0 z-[500] bg-[#fff1e0] flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Background Decorativo com Pizzas Opacas (como nas fotos) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.08]">
                <div className="absolute top-10 left-10 rotate-12"><img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" width="80" alt="" /></div>
                <div className="absolute top-1/4 right-20 -rotate-12"><img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" width="60" alt="" /></div>
                <div className="absolute bottom-1/4 left-20 rotate-45"><img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" width="70" alt="" /></div>
                <div className="absolute bottom-10 right-10 -rotate-45"><img src="https://cdn-icons-png.flaticon.com/512/3595/3595455.png" width="90" alt="" /></div>
            </div>

            <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                
                {/* Título Principal 3D Style */}
                <h1 className="text-6xl sm:text-8xl font-black mb-4 select-none tracking-tight text-center" style={{
                    backgroundImage: 'linear-gradient(to bottom, #f97316, #c2410c)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0px 4px 0px rgba(0,0,0,0.15))'
                }}>
                    Bem - Vindos
                </h1>

                {/* Linha Divisória com Texto */}
                <div className="flex items-center gap-4 mb-3 w-full justify-center">
                    <div className="h-[2px] w-12 sm:w-20 bg-orange-400 opacity-60"></div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1e293b] uppercase tracking-[0.2em]">
                        Torneio de Pizza
                    </h2>
                    <div className="h-[2px] w-12 sm:w-20 bg-orange-400 opacity-60"></div>
                </div>

                {/* Subtítulo com Chamas */}
                <div className="flex items-center gap-2 mb-12 sm:mb-16">
                    <Flame size={20} className="text-orange-500 fill-orange-500" />
                    <p className="text-orange-600 font-bold text-lg sm:text-xl italic uppercase tracking-widest">
                        Diversão Profissional
                    </p>
                    <Flame size={20} className="text-orange-500 fill-orange-500" />
                </div>

                {/* Botão Centralizado Circular */}
                <button 
                    onClick={handleStart}
                    className="group relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.4)] hover:shadow-[0_15px_40px_rgba(234,88,12,0.6)] hover:scale-110 active:scale-95 transition-all duration-300 ring-[8px] ring-white"
                >
                    <div className="absolute inset-0 rounded-full border-2 border-orange-200 animate-pulse opacity-30"></div>
                    <ArrowRight size={44} className="text-white group-hover:translate-x-1 transition-transform" strokeWidth={4} />
                </button>

                {/* Rodapé da Página */}
                <div className="mt-12 sm:mt-16 flex flex-col items-center gap-2">
                    <p className="text-[#94a3b8] text-[10px] sm:text-xs font-black uppercase tracking-[0.4em]">
                        Toque para entrar
                    </p>
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-200 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-300 animate-pulse delay-150"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse delay-300"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};
