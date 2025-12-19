
import React, { useState } from 'react';
import { X, CalendarDays, Bell } from 'lucide-react';
import { Language, translations } from '../services/translations';
import { PizzaData } from '../types';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  isAdmin?: boolean;
  pizzas?: PizzaData[];
  onUpdateDateGlobal?: (id: number | string, date: string) => void;
  onAlertAdmin?: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, language, isAdmin, pizzas, onUpdateDateGlobal, onAlertAdmin }) => {
  const t = translations[language];
  const [dates, setDates] = useState<{ [key: string]: { day: string, year: string } }>(() => {
    try {
        const saved = localStorage.getItem('tournament_dates_global');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to parse saved dates"); }
    const currentYear = new Date().getFullYear().toString();
    return { '03': { day: '', year: currentYear }, '07': { day: '', year: currentYear }, '11': { day: '', year: currentYear } };
  });

  if (!isOpen) return null;

  const handleUpdate = (monthCode: string, field: 'day' | 'year', value: string) => {
    const newDates = { ...dates, [monthCode]: { ...dates[monthCode], [field]: value } };
    setDates(newDates);
    localStorage.setItem('tournament_dates_global', JSON.stringify(newDates));
    
    if (isAdmin && onUpdateDateGlobal && pizzas && pizzas.length > 0) {
        onUpdateDateGlobal(pizzas[0].id, JSON.stringify(newDates));
    }
  };

  const months = [
      { code: '03', label: language === 'pt' ? 'Março' : language === 'es' ? 'Marzo' : 'March', color: 'from-green-50 to-emerald-50 border-emerald-100 text-emerald-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:border-emerald-800 dark:text-emerald-200' },
      { code: '07', label: language === 'pt' ? 'Julho' : language === 'es' ? 'Julio' : 'July', color: 'from-orange-50 to-amber-50 border-amber-100 text-amber-800 dark:from-orange-900/40 dark:to-orange-900/40 dark:border-amber-800 dark:text-amber-200' },
      { code: '11', label: language === 'pt' ? 'Novembro' : language === 'es' ? 'Noviembre' : 'November', color: 'from-blue-50 to-indigo-50 border-indigo-100 text-indigo-800 dark:from-blue-900/40 dark:to-indigo-900/40 dark:border-indigo-800 dark:text-indigo-200' }
  ];
  
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#fffbf0] dark:bg-slate-900 w-[90%] max-w-xs sm:max-w-md rounded-3xl shadow-2xl overflow-hidden border border-blue-200 dark:border-slate-700 flex flex-col relative animate-in zoom-in-95 duration-300 max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 text-center border-b border-blue-200 dark:border-blue-800 relative overflow-hidden shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/50 dark:bg-black/30 rounded-full hover:bg-white dark:hover:bg-black/50 transition-colors text-blue-900 dark:text-blue-100"><X size={18} /></button>
          <div className="flex justify-center mb-2"><div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm ring-2 ring-blue-50 dark:ring-blue-900/20"><CalendarDays size={20} className="text-blue-600 dark:text-blue-400" /></div></div>
          <h2 className="text-xl font-black text-blue-900 dark:text-blue-100 uppercase tracking-wide leading-none">{t.dates}</h2>
          <p className="text-blue-700 dark:text-blue-300 text-[10px] font-bold mt-1 uppercase opacity-70">Calendário Oficial</p>
          {isAdmin && (
              <button onClick={onAlertAdmin} className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md"><Bell size={12} /> Notificar Datas</button>
          )}
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar space-y-3 text-slate-700 dark:text-slate-300">
            {months.map((m) => (
                <div key={m.code} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${m.color} p-4 shadow-sm transition-all group`}>
                    <h3 className="text-sm font-black uppercase tracking-tight mb-3 relative z-10">{m.label}</h3>
                    <div className="grid grid-cols-2 gap-2 relative z-10">
                        <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-1 rounded-lg flex items-center shadow-sm">
                            <span className="w-8 text-[8px] font-black uppercase text-center opacity-60">Dia</span>
                            <select disabled={!isAdmin} value={dates[m.code]?.day || ''} onChange={(e) => handleUpdate(m.code, 'day', e.target.value)} className="flex-1 bg-transparent font-bold text-sm text-center p-1 focus:outline-none cursor-pointer dark:text-white disabled:opacity-70 disabled:cursor-not-allowed">
                                <option value="" className="text-slate-900">--</option>
                                {days.map(d => <option key={d} value={d} className="text-slate-900">{d}</option>)}
                            </select>
                        </div>
                        <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-1 rounded-lg flex items-center shadow-sm">
                            <span className="w-8 text-[8px] font-black uppercase text-center opacity-60">Ano</span>
                            <select disabled={!isAdmin} value={dates[m.code]?.year || ''} onChange={(e) => handleUpdate(m.code, 'year', e.target.value)} className="flex-1 bg-transparent font-bold text-sm text-center p-1 focus:outline-none cursor-pointer dark:text-white disabled:opacity-70 disabled:cursor-not-allowed">
                                {years.map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
            <button onClick={onClose} className="w-full bg-slate-900 dark:bg-slate-700 text-white font-black text-xs uppercase py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md active:scale-[0.98]">Confirmar</button>
        </div>
      </div>
    </div>
  );
};
