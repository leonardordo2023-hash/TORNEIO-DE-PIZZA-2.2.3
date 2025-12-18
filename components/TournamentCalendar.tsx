import React, { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { PizzaData } from '../types';
import { Language, translations } from '../services/translations';

interface TournamentCalendarProps {
  pizzas: PizzaData[];
  onUpdateDate: (id: number | string, date: string) => void;
  language: Language;
}

export const TournamentCalendar: React.FC<TournamentCalendarProps> = ({ language }) => {
  const t = translations[language];
  const [dates, setDates] = useState<{ [key: string]: { day: string, year: string } }>(() => {
    try {
        const saved = localStorage.getItem('tournament_dates_global');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to parse saved dates"); }
    const currentYear = new Date().getFullYear().toString();
    return { '03': { day: '', year: currentYear }, '07': { day: '', year: currentYear }, '11': { day: '', year: currentYear } };
  });

  const handleUpdate = (monthCode: string, field: 'day' | 'year', value: string) => {
    const newDates = { ...dates, [monthCode]: { ...dates[monthCode], [field]: value } };
    setDates(newDates);
    localStorage.setItem('tournament_dates_global', JSON.stringify(newDates));
  };

  const months = [
      { code: '03', label: language === 'pt' ? 'Março' : language === 'es' ? 'Marzo' : 'March', color: 'from-green-50 to-emerald-50 border-emerald-100 text-emerald-800 dark:from-green-900/40 dark:to-emerald-900/40 dark:border-emerald-800 dark:text-emerald-200' },
      { code: '07', label: language === 'pt' ? 'Julho' : language === 'es' ? 'Julio' : 'July', color: 'from-orange-50 to-amber-50 border-amber-100 text-amber-800 dark:from-orange-900/40 dark:to-amber-900/40 dark:border-amber-800 dark:text-amber-200' },
      { code: '11', label: language === 'pt' ? 'Novembro' : language === 'es' ? 'Noviembre' : 'November', color: 'from-blue-50 to-indigo-50 border-indigo-100 text-indigo-800 dark:from-blue-900/40 dark:to-indigo-900/40 dark:border-indigo-800 dark:text-indigo-200' }
  ];
  
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
            <div className="bg-slate-900 dark:bg-slate-700 text-white p-2 rounded-lg"><CalendarDays size={24} /></div>
            {t.dates}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {months.map((m) => (
            <div key={m.code} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${m.color} p-6 shadow-sm hover:shadow-md transition-all group`}>
                <h3 className="text-2xl font-black uppercase tracking-tight mb-6 relative z-10">{m.label}</h3>
                <div className="space-y-4 relative z-10">
                    <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-1 rounded-xl flex items-center shadow-sm">
                        <span className="w-12 text-xs font-bold uppercase text-center opacity-60">Dia</span>
                        <select value={dates[m.code]?.day || ''} onChange={(e) => handleUpdate(m.code, 'day', e.target.value)} className="flex-1 bg-transparent font-bold text-lg text-center p-2 focus:outline-none cursor-pointer dark:text-white">
                            <option value="" className="text-slate-900">--</option>
                            {days.map(d => <option key={d} value={d} className="text-slate-900">{d}</option>)}
                        </select>
                    </div>
                    <div className="bg-white/60 dark:bg-black/20 backdrop-blur-sm p-1 rounded-xl flex items-center shadow-sm">
                        <span className="w-12 text-xs font-bold uppercase text-center opacity-60">Ano</span>
                        <select value={dates[m.code]?.year || ''} onChange={(e) => handleUpdate(m.code, 'year', e.target.value)} className="flex-1 bg-transparent font-bold text-lg text-center p-2 focus:outline-none cursor-pointer dark:text-white">
                            {years.map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
