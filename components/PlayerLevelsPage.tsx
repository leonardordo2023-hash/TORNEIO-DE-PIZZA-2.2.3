
import React, { useMemo } from 'react';
import { UserAccount, PizzaData, SocialData } from '../types';
import { calculateUserLevel } from '../services/gamificationUtils';
import { translations, Language } from '../services/translations';
import { Zap, Crown, User, Award, ArrowLeft, ShieldCheck, Star } from 'lucide-react';
import { authService } from '../services/authService';

interface PlayerLevelsPageProps {
    currentUser: UserAccount;
    onClose: () => void;
    pizzas: PizzaData[];
    socialData: SocialData;
    language: Language;
    pizzaOwners: Record<number, string>;
}

export const PlayerLevelsPage: React.FC<PlayerLevelsPageProps> = ({ 
    currentUser, onClose, pizzas, socialData, language, pizzaOwners 
}) => {
    const t = translations[language];
    const allUsers = authService.getUsers();

    const getLevelTitle = (lvl: number) => {
        if (lvl >= 5) return "LENDA SUPREMA";
        if (lvl >= 4) return "GRÃO-MESTRE";
        if (lvl >= 3) return "CHEF DE ELITE";
        if (lvl >= 2) return "MESTRE PIZZAIOLO";
        return "APRENDIZ";
    };

    const sortedUsers = useMemo(() => {
        return allUsers.map(user => {
            const stats = calculateUserLevel(user, pizzas, socialData, pizzaOwners);
            return { user, stats };
        }).sort((a, b) => {
            if (b.stats.level !== a.stats.level) return b.stats.level - a.stats.level;
            return b.stats.currentBarProgress - a.stats.currentBarProgress;
        });
    }, [allUsers, pizzas, socialData, pizzaOwners]);

    return (
        <div className="fixed inset-0 z-[210] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header Fixo */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white leading-none">Nível dos Jurados</h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Status em Tempo Real</p>
                    </div>
                </div>
                <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30">
                    <Award size={20} />
                </div>
            </div>

            {/* Background Decorativo */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-500/5 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-orange-500/5 rounded-full blur-[80px]"></div>
            </div>

            {/* Lista com Scroll */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 relative z-10">
                <div className="max-w-2xl mx-auto space-y-3">
                    {sortedUsers.map(({ user, stats }, index) => {
                        const isMe = user.nickname === currentUser.nickname;
                        const isAdminUser = user.nickname === '@Leonardo';
                        
                        return (
                            <div 
                                key={user.nickname} 
                                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${isMe ? 'ring-2 ring-indigo-500 border-transparent shadow-indigo-100 dark:shadow-indigo-900/20' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-lg' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        {index + 1}º
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.nickname} /> : <User size={24} className="m-auto text-slate-300 mt-2" />}
                                        </div>
                                        {stats.level >= 5 && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-0.5 shadow-sm">
                                                <Crown size={12} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-black text-sm truncate uppercase tracking-tight ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {isAdminUser ? 'ADMINISTRADOR' : user.nickname}
                                            </span>
                                            {isAdminUser && <ShieldCheck size={14} className="text-blue-500 fill-blue-100 dark:fill-blue-900/40" />}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getLevelTitle(stats.level)}</span>
                                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{stats.currentBarProgress.toFixed(0)}%</span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5 shadow-inner">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${stats.level >= 5 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}
                                                style={{ width: `${stats.currentBarProgress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Level Badge */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800 shrink-0 text-center min-w-[50px]">
                                        <span className="block text-[8px] font-black text-indigo-400 dark:text-indigo-500 uppercase leading-none mb-1">Nível</span>
                                        <span className="block text-xl font-black text-indigo-600 dark:text-indigo-300 leading-none">{stats.level}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="py-20"></div>
            </div>
        </div>
    );
};
