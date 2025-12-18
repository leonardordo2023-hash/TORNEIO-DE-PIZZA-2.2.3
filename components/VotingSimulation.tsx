
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Star, Lock, Eye, Send, Pizza, Cake, Sparkles } from 'lucide-react';

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
            title: "Tutorial de Votação",
            text: "Olá! Vou te mostrar passo a passo como avaliar as pizzas do torneio da forma correta. Vamos lá?",
            icon: <Sparkles className="text-indigo-500" />,
            target: "none"
        },
        {
            title: "1. Abrindo as Fichas",
            text: isDoce 
                ? "Primeiro, clique no ícone da Pizza (Fichas doce ) no menu lá embaixo para ver as opções."
                : "Primeiro, clique no ícone da Pizza (Fichas Salgadas) no menu lá embaixo para ver as opções.",
            icon: isDoce ? <Cake className="text-pink-500" /> : <Pizza className="text-orange-500" />,
            target: "bottom-nav"
        },
        {
            title: "2. Avaliando a Pizza #7",
            text: "Na Pizza #7, dê sua nota de 0 a 10 em Aparência e Sabor. Seja justo, seu voto ajuda a definir o campeão!",
            icon: <div className="flex gap-1"><Star size={16} className="text-purple-500 fill-purple-500"/><Star size={16} className="text-orange-500 fill-orange-500"/></div>,
            target: "pizza-inputs"
        },
        {
            title: "3. O Placar ao lado da Estrela",
            text: "Este número que aparece ao lado da estrela é o total de pontos que a pizza já acumulou de todos os jurados.",
            icon: <div className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-black">45.5</div>,
            target: "points-info"
        },
        {
            title: "4. Estrela: Bônus de Massa",
            text: "A Estrela serve para dar +1 ponto extra para aquele que fez a massa da pizza manualmente! Clique se a massa for artesanal.",
            icon: <Star size={20} className="text-yellow-500 fill-yellow-500" />,
            target: "star-btn"
        },
        {
            title: "5. Suas Anotações",
            text: "Este campo serve para VOCÊ gravar a receita ou algo importante da pizza. É privado, apenas você verá o que escreveu aqui.",
            icon: <Lock size={20} className="text-blue-500" />,
            target: "notes-private"
        },
        {
            title: "6. Críticas Anônimas",
            text: "Aqui as críticas todos vêem! É um comentário em tempo real, mas fique tranquilo: será anônimo, ninguém saberá quem escreveu.",
            icon: <Eye size={20} className="text-red-500" />,
            target: "notes-public"
        },
        {
            title: "7. Botão Votar",
            text: "Após preencher tudo, clique em VOTAR. Uma vez confirmado, seu voto será computado pelo sistema imediatamente!",
            icon: <Send size={20} className="text-green-500" />,
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
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            
            <div 
                className="relative w-full max-w-[280px] sm:max-w-xs bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-indigo-500 animate-in zoom-in-95 duration-300 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full animate-bounce-slow">
                            {currentStep.icon}
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-center text-slate-800 dark:text-white uppercase mb-2 tracking-tight">
                        {currentStep.title}
                    </h3>
                    
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed mb-6 font-medium min-h-[80px]">
                        {currentStep.text}
                    </p>
                    
                    <button 
                        onClick={handleNext}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                    >
                        {step === steps.length - 1 ? "ENTENDI TUDO!" : "PRÓXIMO PASSO"} <ArrowRight size={16} />
                    </button>
                </div>
                
                <div className="flex gap-1 justify-center pb-6">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`}></div>
                    ))}
                </div>
            </div>

            {currentStep.target !== "none" && (
                <div className={`fixed z-[610] pointer-events-none transition-all duration-700 ${
                    currentStep.target === 'bottom-nav' ? 'bottom-24 left-1/2 -translate-x-[110px]' :
                    currentStep.target === 'pizza-inputs' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-20' :
                    currentStep.target === 'points-info' ? 'top-1/2 left-1/2 translate-x-10 -translate-y-40' :
                    currentStep.target === 'star-btn' ? 'top-1/2 left-1/2 translate-x-20 -translate-y-40' :
                    currentStep.target === 'notes-private' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-10' :
                    currentStep.target === 'notes-public' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-24' :
                    currentStep.target === 'vote-btn' ? 'top-1/2 left-1/2 -translate-x-1/2 translate-y-0' : ''
                }`}>
                    <div className="flex flex-col items-center animate-bounce">
                        <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase mb-1 shadow-lg border border-white/20 whitespace-nowrap">Tutorial: Veja Aqui</div>
                        <div className="w-2 h-2 bg-indigo-600 rotate-45"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
