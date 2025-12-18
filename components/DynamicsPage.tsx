
import React from 'react';
import { Gamepad2, Star, Heart, Zap, Gift, Trophy, Bell, MessageCircle, Sparkles } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface DynamicsPageProps {
    language: Language;
    isAdmin?: boolean;
    onAlertAdmin?: () => void;
}

export const DynamicsPage: React.FC<DynamicsPageProps> = ({ language, isAdmin, onAlertAdmin }) => {
    const t = translations[language].gamification;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500 px-4">
            
            <div className="text-center mt-6">
                <div className="inline-block p-4 rounded-full bg-indigo-600 shadow-lg shadow-indigo-300 dark:shadow-indigo-900/50 mb-4 animate-bounce-slow">
                    <Gamepad2 size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{t.subtitle}</p>
                
                {isAdmin && (
                    <div className="mt-4 flex justify-center">
                        <button 
                            onClick={onAlertAdmin}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm"
                        >
                            <Bell size={12} /> {t.notifyPlayers}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid gap-6">
                {/* 1. Pontos Técnicos */}
                <div className="rounded-3xl p-6 border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-transform">
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700 animate-pulse">
                            <Star size={32} className="text-yellow-500 fill-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.pizzaPointsTitle}</h3>
                            <div className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: t.pizzaPointsDesc }} />
                        </div>
                    </div>
                </div>

                {/* 2. Bônus de Massa */}
                <div className="rounded-3xl p-6 border-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 shadow-sm relative overflow-hidden group hover:scale-[1.01] transition-transform">
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm shrink-0 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                             <div className="relative"><Star size={32} className="text-yellow-400 fill-yellow-400 animate-wiggle" /></div>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{t.extraBonusTitle}</h3>
                            <div className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: t.extraBonusDesc }} />
                        </div>
                    </div>
                </div>

                {/* 3. REGRAS SOCIAIS */}
                <div className="rounded-3xl p-6 border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-800 shadow-xl relative overflow-hidden group hover:scale-[1.01] transition-transform">
                    <div className="absolute top-0 right-0 p-8 opacity-10 animate-float">
                        <Sparkles size={60} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg">
                                <Heart size={24} className="fill-white animate-pulse" />
                            </div>
                            <h3 className="text-2xl font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-tighter">{t.socialPointsTitle}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-white/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                                <div className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: t.socialPointsDesc }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mystery Prize Section */}
            <div className="relative mt-8 rounded-[2.5rem] p-10 bg-gradient-to-br from-indigo-700 to-purple-800 text-white shadow-2xl overflow-hidden text-center border-4 border-white/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse"></div>
                        <Gift size={80} className="text-yellow-300 drop-shadow-lg animate-bounce-slow" />
                        <div className="absolute -top-3 -right-3 text-yellow-300 animate-ping">
                            <Trophy size={32} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black uppercase tracking-[0.1em] text-yellow-300 mb-3 drop-shadow-md">{t.prizeTitle}</h3>
                        <p className="text-lg font-medium opacity-90 max-w-lg mx-auto leading-relaxed" dangerouslySetInnerHTML={{__html: t.prizeDesc}}></p>
                    </div>
                </div>
            </div>

        </div>
    );
};
