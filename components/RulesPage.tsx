
import React from 'react';
import { ScrollText, Star, Camera, MessageCircle, Trophy, Info, Wallet, Bell } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface RulesPageProps {
  language: Language;
  isAdmin?: boolean;
  onAlertAdmin?: () => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({ language, isAdmin, onAlertAdmin }) => {
  const t = translations[language];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star size={24} className="text-yellow-500" />;
      case 'camera': return <Camera size={24} className="text-blue-500" />;
      case 'message': return <MessageCircle size={24} className="text-green-500" />;
      case 'trophy': return <Trophy size={24} className="text-orange-500" />;
      case 'wallet': return <Wallet size={24} className="text-emerald-600" />;
      default: return <Info size={24} className="text-slate-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
      
      <div className="text-center">
        <div className="bg-indigo-600 text-white p-3 rounded-2xl w-fit mx-auto mb-4 shadow-lg animate-bounce-slow">
            <ScrollText size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
            {t.rules}
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">Diretrizes oficiais do torneio</p>
        
        {isAdmin && (
            <button 
                onClick={onAlertAdmin}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-indigo-200 dark:border-indigo-800 shadow-sm"
            >
                <Bell size={14} /> Notificar Mudança nas Regras
            </button>
        )}
      </div>

      <div className="space-y-6">
        {t.rulesContent.map((rule, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="p-6 flex items-start gap-5">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                        {getIcon(rule.icon)}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{rule.title}</h3>
                        <div 
                            className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium"
                            dangerouslySetInnerHTML={{ __html: rule.desc }}
                        />
                    </div>
                </div>
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-700 to-transparent"></div>
            </div>
        ))}

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/50 text-center shadow-inner">
            <p className="text-orange-800 dark:text-orange-200 text-sm font-black italic uppercase tracking-wider">
                "A decisão dos jurados é soberana e o objetivo principal é comer bem!"
            </p>
        </div>
      </div>
    </div>
  );
};
