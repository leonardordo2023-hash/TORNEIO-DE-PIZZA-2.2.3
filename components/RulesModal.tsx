
import React from 'react';
import { X, ScrollText, Star, Camera, MessageCircle, Trophy, Info, Wallet, Bell } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isAdmin?: boolean;
  onAlertAdmin?: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, language, isAdmin, onAlertAdmin }) => {
  const t = translations[language];

  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'star': return <Star size={20} className="text-yellow-500" />;
      case 'camera': return <Camera size={20} className="text-blue-500" />;
      case 'message': return <MessageCircle size={20} className="text-green-500" />;
      case 'trophy': return <Trophy size={20} className="text-orange-500" />;
      case 'wallet': return <Wallet size={20} className="text-emerald-600" />;
      default: return <Info size={20} className="text-slate-500" />;
    }
  };

  return (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-[#fffbf0] dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-amber-200 dark:border-slate-700 flex flex-col relative animate-in zoom-in-95 duration-300 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header decorativo */}
        <div className="bg-amber-100 dark:bg-amber-900/30 p-6 text-center border-b border-amber-200 dark:border-amber-800 relative overflow-hidden">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/30 rounded-full hover:bg-white dark:hover:bg-black/50 transition-colors text-amber-900 dark:text-amber-100"
          >
            <X size={20} />
          </button>
          
          <div className="flex justify-center mb-3">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm ring-4 ring-amber-50 dark:ring-amber-900/20">
                <ScrollText size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-wide">{t.rules}</h2>
          <p className="text-amber-700 dark:text-amber-300 text-xs font-medium mt-1">Diretrizes Oficiais</p>
        </div>

        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
          
          {isAdmin && (
              <button 
                onClick={onAlertAdmin}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-black uppercase tracking-tighter mb-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                  <Bell size={14} /> Notificar Mudança nas Regras
              </button>
          )}

          {t.rulesContent.map((rule, idx) => (
             <div key={idx} className="relative pl-4 border-l-2 border-amber-200 dark:border-amber-800/50">
                 <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white mb-2">
                    {getIcon(rule.icon)} {rule.title}
                 </h3>
                 <div 
                    className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: rule.desc }}
                 />
             </div>
          ))}

          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 text-center mt-4">
             <p className="text-amber-800 dark:text-amber-200 text-xs font-medium italic">
                "A decisão dos jurados é soberana e o objetivo principal é comer bem!"
             </p>
          </div>

        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
            <button 
                onClick={onClose}
                className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
                Entendido
            </button>
        </div>
      </div>
    </div>
  );
};
