
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Heart, MessageCircle, Star, Zap, Gift, Sparkles, Crown } from 'lucide-react';

interface GamificationSimulationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GamificationSimulation: React.FC<GamificationSimulationProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (isOpen) setStep(0);
    }, [isOpen]);

    const steps = [
        {
            title: "Passo 1: Interação Social",
            text: "Interagir te faz crescer! ❤️ Cada Like que você dá e 💬 cada Comentário enviado em fotos ou posts aumenta sua barra de nível em 2.5%!",
            icon: <div className="flex gap-2"><Heart className="text-red-500 fill-red-500 animate-pulse" size={24}/><MessageCircle className="text-blue-500 fill-blue-500 animate-bounce" size={24}/></div>,
            color: "bg-indigo-50 dark:bg-indigo-900/20"
        },
        {
            title: "Passo 2: Qualidade Técnica",
            text: "O sabor é o que manda! 🍕 Cada ponto (0-10) que suas pizzas recebem dos jurados aumenta seu XP em 1.0%. A estrela amarela ⭐ (bônus de massa) dá um salto de 8.5%!",
            icon: <div className="relative"><Star className="text-purple-500 fill-purple-500" size={32} /><Zap className="absolute -top-1 -right-1 text-yellow-500 fill-yellow-500 animate-pulse" size={16} /></div>,
            color: "bg-purple-50 dark:bg-purple-900/20"
        },
        {
            title: "Passo 3: A GRANDE RECOMPENSA",
            text: "O prêmio máximo! 🎁 Ao chegar no Nível 5, você ganha um Vale Presente de R$ 120,00 para escolher produtos da Boticário, Natura, Avon ou Mary Kay!",
            icon: <div className="relative"><Gift className="text-pink-600 fill-pink-600 animate-bounce" size={48} /><Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-spin-slow" size={24} /></div>,
            color: "bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/30 dark:to-orange-900/30 border-pink-200 dark:border-pink-800"
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div 
                className={`relative w-full max-w-[300px] rounded-[2.5rem] shadow-2xl border-4 border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden transition-all duration-500 bg-white dark:bg-slate-900`}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-20">
                    <X size={20} />
                </button>

                <div className={`p-8 ${currentStep.color}`}>
                    <div className="flex justify-center mb-6">
                        <div className={`p-5 rounded-3xl bg-white dark:bg-slate-800 shadow-xl transition-all duration-500 scale-110`}>
                            {currentStep.icon}
                        </div>
                    </div>
                    
                    <h3 className={`text-lg font-black text-center uppercase mb-3 tracking-tighter text-slate-800 dark:text-white leading-tight`}>
                        {currentStep.title}
                    </h3>
                    
                    <p className={`text-sm text-center leading-relaxed mb-8 font-medium min-h-[100px] text-slate-600 dark:text-slate-300`}>
                        {currentStep.text}
                    </p>
                    
                    <button 
                        onClick={handleNext}
                        className={`w-full font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-xs uppercase tracking-widest ${step === steps.length - 1 ? 'bg-orange-600 text-white animate-pulse' : 'bg-indigo-600 text-white'}`}
                    >
                        {step === steps.length - 1 ? "VOU CHEGAR LÁ!" : "PRÓXIMO PASSO"} <ArrowRight size={16} />
                    </button>
                </div>
                
                <div className="flex gap-2 justify-center pb-8 bg-transparent">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
