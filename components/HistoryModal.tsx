
import React from 'react';
import { X, Scroll, Trophy, Pizza, Calendar, Star, Bell } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onAlertAdmin?: () => void;
  language: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, isAdmin, onAlertAdmin, language }) => {
  const t = translations[language].historyContent;

  if (!isOpen) return null;

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
        <div className="bg-amber-100 dark:bg-amber-900/30 p-6 text-center border-b border-amber-200 dark:border-amber-800 relative overflow-hidden shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/30 rounded-full hover:bg-white dark:hover:bg-black/50 transition-colors text-amber-900 dark:text-amber-100"
          >
            <X size={20} />
          </button>
          
          <div className="flex justify-center mb-3">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm ring-4 ring-amber-50 dark:ring-amber-900/20">
                <Scroll size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-amber-900 dark:text-amber-100 uppercase tracking-wide">{t.title}</h2>
          <p className="text-amber-700 dark:text-amber-300 text-xs font-medium mt-1">{t.subtitle}</p>
        </div>

        {/* Conteúdo com scroll */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
          
          {isAdmin && (
              <button 
                onClick={onAlertAdmin}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-xl text-xs font-black uppercase tracking-tighter mb-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                  <Bell size={14} /> {t.notify}
              </button>
          )}

          <div className="relative pl-4 border-l-2 border-amber-200 dark:border-amber-800/50">
             <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white mb-2">
                <Pizza size={18} className="text-orange-500" /> {t.sections[0].title}
             </h3>
             <p className="text-sm">
               {t.sections[0].text}
             </p>
          </div>

          <div className="relative pl-4 border-l-2 border-amber-200 dark:border-amber-800/50">
             <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white mb-2">
                <Trophy size={18} className="text-yellow-500" /> {t.sections[1].title}
             </h3>
             <p className="text-sm">
               {t.sections[1].text}
             </p>
          </div>

          <div className="relative pl-4 border-l-2 border-amber-200 dark:border-amber-800/50">
             <h3 className="flex items-center gap-2 font-bold text-lg text-slate-800 dark:text-white mb-2">
                <Star size={18} className="text-purple-500" /> {t.sections[2].title}
             </h3>
             <p className="text-sm">
               {t.sections[2].text}
             </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex items-start gap-3">
             <Calendar className="text-amber-600 shrink-0 mt-0.5" size={20} />
             <div>
                 <span className="block font-bold text-amber-800 dark:text-amber-200 text-sm">{t.sections[3].title}</span>
                 <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    {t.sections[3].text}
                 </p>
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
            <button 
                onClick={onClose}
                className="w-full bg-slate-900 dark:bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
            >
                {t.close}
            </button>
        </div>
      </div>
    </div>
  );
};
