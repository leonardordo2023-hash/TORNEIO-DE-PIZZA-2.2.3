
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Star, Lock, Eye, Send, Pizza, Cake, Sparkles, MessageSquare, Info } from 'lucide-react';

interface VotingSimulationProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToSalgada: () => void;
    currentTab: string;
}

export const VotingSimulation: React.FC<VotingSimulationProps> = ({ isOpen, onClose, onNavigateToSalgada, currentTab }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    const isDoce = currentTab === 'grid_doce';

    const steps = [
        {
            title: "Guia de Votação",
            text: "Bem-vindo! Vamos aprender a avaliar as pizzas como um verdadeiro jurado profissional.",
            icon: <Sparkles className="text-yellow-500 animate-pulse" size={32} />,
            target: "none"
        },
        {
            title: "1. Escolha a Categoria",
            text: "No menu inferior, você alterna entre as Fichas Salgadas (Laranja) e Doces (Rosa). Cada uma tem seu próprio ranking!",
            icon: <div className="flex gap-2"><Pizza className="text-orange-500" /><Cake className="text-pink-500" /></div>,
            target: "bottom-nav"
        },
        {
            title: "2. Notas de 0 a 10",
            text: "Avalie a 'Aparência' e o 'Sabor'. Você pode usar casas decimais (ex: 9.5). Seja criterioso!",
            icon: <div className="flex gap-1 font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">9.5</div>,
            target: "pizza-inputs"
        },
        {
            title: "3. Estrela de Bônus (+1pt)",
            text: "A Estrela Amarela dá +1 ponto extra. Use apenas se o competidor fez a massa manualmente (Trabalho Artesanal)!",
            icon: <Star size={24} className="text-yellow-500 fill-yellow-500 animate-wiggle" />,
            target: "star-btn"
        },
        {
            title: "4. Suas Anotações (Privado)",
            text: "O primeiro campo é só seu. Escreva lembretes ou receitas. Ninguém mais verá isso, é o seu diário de bordo.",
            icon: <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Lock size={20} /></div>,
            target: "notes-private"
        },
        {
            title: "5. Críticas Anônimas (Público)",
            text: "O campo azul é a Crítica Anônima. Todos os jurados e o dono da pizza verão o que você escreveu, mas sem saber quem foi!",
            icon: <div className="p-2 bg-red-100 rounded-lg text-red-600 flex items-center gap-1"><Eye size={18} /> <span className="text-[10px] font-black uppercase">Público</span></div>,
            target: "notes-public"
        },
        {
            title: "6. Enviar Voto",
            text: "Tudo pronto? Clique em VOTAR. Após enviado, você não poderá alterar as notas, apenas as anotações.",
            icon: <div className="p-2 bg-green-500 rounded-lg text-white"><Send size={20} /></div>,
            target: "vote-btn"
        }
    ];

    const handleNext = () => {
        if (step === 1 && currentTab !== 'grid_salgada' && currentTab !== 'grid_doce') {
            onNavigateToSalgada();
        }
        
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in" onClick={onClose}>
            
            <div 
                className="relative w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-indigo-500 animate-in zoom-in-95 duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                    <div 
                        className="h-full bg-indigo-500 transition-all duration-500" 
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors z-20">
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-100 dark:border-indigo-800/50">
                            {currentStep.icon}
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-center text-slate-800 dark:text-white uppercase mb-3 tracking-tighter leading-none">
                        {currentStep.title}
                    </h3>
                    
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed font-bold min-h-[70px]">
                            {currentStep.text}
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleNext}
                        className={`w-full font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest ${step === steps.length - 1 ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                        {step === steps.length - 1 ? "COMEÇAR A VOTAR!" : "ENTENDI, PRÓXIMO"} <ArrowRight size={16} />
                    </button>
                </div>
                
                <div className="flex gap-1.5 justify-center pb-6">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}></div>
                    ))}
                </div>
            </div>

            {/* Marcadores de tutorial dinâmicos baseados no step */}
            {currentStep.target !== "none" && (
                <div className={`fixed z-[610] pointer-events-none transition-all duration-700 ${
                    currentStep.target === 'bottom-nav' ? 'bottom-24 left-1/2 -translate-x-1/2' :
                    currentStep.target === 'pizza-inputs' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-24' :
                    currentStep.target === 'star-btn' ? 'top-1/2 left-1/2 translate-x-20 -translate-y-44' :
                    currentStep.target === 'notes-private' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-12' :
                    currentStep.target === 'notes-public' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-28' :
                    currentStep.target === 'vote-btn' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-4' : ''
                }`}>
                    <div className="flex flex-col items-center">
                        <div className="w-4 h-4 bg-indigo-500 rotate-45 animate-bounce shadow-2xl border-2 border-white dark:border-slate-800"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
