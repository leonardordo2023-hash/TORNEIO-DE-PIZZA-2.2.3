
import React, { useEffect, useState, useRef } from 'react';
import { PizzaData, getSum, MediaItem } from '../types';
import { Pizza, Star, UtensilsCrossed, User, Trash2, Send, Check, X } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface PizzaCardProps {
  data: PizzaData;
  userId: string;
  isAdmin: boolean; // Propriedade explícita para controle de admin
  rank?: number;
  peerCount: number;
  index?: number;
  onUpdate: (id: number | string, field: 'beautyScores' | 'tasteScores' | 'beautyScoresDoce' | 'tasteScoresDoce' | 'bonusScores' | 'bonusScoresDoce', value: number) => void;
  onConfirm: (id: number | string) => void;
  onUpdateNote: (id: number | string, note: string) => void;
  onUpdateGlobalNote: (id: number | string, note: string) => void;
  onDelete: (id: number | string) => void;
  onUpdateDate: (id: number | string, date: string) => void;
  onAddPhoto: (id: number | string, item: MediaItem) => void;
  language: Language;
  ownerName?: string;
  variant: 'salgada' | 'doce';
}

const ScoreInput: React.FC<{
  label: string;
  myValue: number | null;
  icon: React.ReactNode;
  onChange: (val: number) => void;
  colorClass: string;
  pointsLabel: string;
  disabled: boolean;
}> = ({ label, myValue, icon, onChange, colorClass, pointsLabel, disabled }) => {
  const [localStr, setLocalStr] = useState(myValue !== null && myValue !== -1 ? myValue.toString() : '');
  const [isPopping, setIsPopping] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (myValue === null || myValue === -1) {
        if (localStr !== '') setLocalStr('');
    } else {
        const currentNum = parseFloat(localStr);
        if (currentNum !== myValue) {
            setLocalStr(myValue.toString());
        }
    }
  }, [myValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalStr(raw);
    setIsPopping(true);
    if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setIsPopping(false), 200);

    if (raw === '') { onChange(-1); return; }
    let val = parseFloat(raw);
    if (isNaN(val)) return;
    if (val > 10) val = 10;
    if (val < 0) val = 0;
    onChange(val);
  };

  return (
    <div className={`flex flex-col gap-2 relative group ${disabled ? 'opacity-70 grayscale' : ''}`}>
      <div className="flex justify-between items-center">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 cursor-help">
          {icon} {label}
          </label>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-full">
            <input 
                type="number" 
                min="0" 
                max="10" 
                step="0.1" 
                inputMode="decimal" 
                className={`w-full p-2 border-2 rounded-xl text-lg font-black text-center focus:outline-none focus:ring-0 transition-all duration-150 dark:bg-slate-900 dark:text-white ${colorClass} ${myValue !== null ? 'opacity-100' : 'opacity-60'} ${isPopping ? 'scale-105' : 'scale-100'} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} 
                placeholder="-" 
                value={localStr} 
                onChange={handleChange}
            />
        </div>
        <span className="text-slate-400 text-sm font-bold">{pointsLabel}</span>
      </div>
    </div>
  );
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(value);
    useEffect(() => { setDisplayValue(value); }, [value]);
    const formattedValue = displayValue.toFixed(1).replace(/\.0$/, '');
    return <span className="inline-block transition-transform duration-300 transform tabular-nums font-black text-slate-700 dark:text-slate-200">{formattedValue}</span>;
};

export const PizzaCard: React.FC<PizzaCardProps> = ({ data, userId, isAdmin, onUpdate, onConfirm, onUpdateNote, onUpdateGlobalNote, rank, peerCount, index = 0, onDelete, onUpdateDate, onAddPhoto, language, ownerName, variant }) => {
  const [isVisible, setIsVisible] = useState(false);
  const t = translations[language];
  
  useEffect(() => { 
      const delay = 50 + (index * 100);
      const timer = setTimeout(() => setIsVisible(true), delay); 
      return () => clearTimeout(timer);
  }, [index]);

  const playUrnaSound = () => {
      try {
          const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          const playTone = (freq: number, startTime: number, duration: number) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(freq, startTime);
              gain.gain.setValueAtTime(0.1, startTime);
              gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(startTime);
              osc.stop(startTime + duration);
          };
          playTone(880, now, 0.1);          
          playTone(880, now + 0.12, 0.1);   
          playTone(1760, now + 0.24, 0.5);  
      } catch (e) { console.error("Audio error", e); }
  };

  const isSalgada = variant === 'salgada';
  const beautyScoresMap = isSalgada ? data.beautyScores : (data.beautyScoresDoce || {});
  const tasteScoresMap = isSalgada ? data.tasteScores : (data.tasteScoresDoce || {});
  const bonusScoresMap = isSalgada ? (data.bonusScores || {}) : (data.bonusScoresDoce || {});

  const beautySum = getSum(beautyScoresMap);
  const tasteSum = getSum(tasteScoresMap);
  const bonusSum = getSum(bonusScoresMap);
  const totalPointsVal = beautySum + tasteSum + bonusSum;
  
  const myBeauty = beautyScoresMap?.[userId] ?? null;
  const myTaste = tasteScoresMap?.[userId] ?? null;
  const myBonus = bonusScoresMap?.[userId] ?? 0;
  
  const myNote = data.userNotes?.[userId] || '';
  const globalNote = data.notes || '';
  const isConfirmed = data.confirmedVotes?.[userId] === true;
  const hasMyVotes = (myBeauty !== null && myBeauty !== -1) && (myTaste !== null && myTaste !== -1);

  const borderColor = isSalgada 
      ? (totalPointsVal > 0 ? 'border-orange-200 dark:border-orange-900' : 'border-slate-200 dark:border-slate-700')
      : (totalPointsVal > 0 ? 'border-pink-200 dark:border-pink-900' : 'border-slate-200 dark:border-slate-700');

  return (
    <div style={{ perspective: '1000px' }} className="w-full h-full">
        <div className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform-gpu hover:-translate-y-2 hover:shadow-2xl active:scale-[0.98] ${borderColor} border-b-4 ${isVisible ? 'opacity-100 rotate-x-0 translate-y-0 scale-100' : 'opacity-0 -rotate-x-12 translate-y-20 scale-90'}`}>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-b-2 border-slate-100 dark:border-slate-700 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg border-2 ${isSalgada ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-pink-100 text-pink-600 border-pink-200'}`}><Pizza size={20} /></div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <h3 className="font-black text-slate-700 dark:text-slate-100 leading-none text-base">Pizza #{data.id}</h3>
                    {ownerName && <span className="text-[10px] font-bold text-indigo-500 truncate max-w-[80px]">{ownerName}</span>}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-1">
                    <span className={`w-2 h-2 rounded-full ${peerCount > 1 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    {peerCount} {t.votes}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
                {totalPointsVal > 0 && (
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 shadow-inner">
                      <AnimatedCounter value={totalPointsVal} />
                    </div>
                )}
                
                {/* BOTÃO ESTRELA DE BÔNUS (XP VOLÁTIL) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const newValue = myBonus === 1 ? 0 : 1;
                        onUpdate(data.id, isSalgada ? 'bonusScores' : 'bonusScoresDoce', newValue);
                    }}
                    disabled={isConfirmed}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border-2 ${myBonus === 1 ? 'bg-yellow-400 border-yellow-500 text-white fill-current animate-wiggle' : 'bg-red-500 border-red-600 text-white'} ${isConfirmed ? 'opacity-50 cursor-not-allowed' : 'active:scale-90 hover:scale-110'}`}
                    title="Ponto Extra (+8,5% XP)"
                >
                    <Star size={16} fill={myBonus === 1 ? "currentColor" : "none"} strokeWidth={3} />
                </button>

                {/* EXCLUIR - APENAS ADM */}
                {isAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(data.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all active:scale-90" title={t.deletePizza}>
                      <Trash2 size={16} />
                  </button>
                )}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-4">
              <ScoreInput label={t.beauty} myValue={myBeauty} icon={<Star size={12} />} colorClass="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20" onChange={(val) => onUpdate(data.id, isSalgada ? 'beautyScores' : 'beautyScoresDoce', val)} pointsLabel={t.points} disabled={isConfirmed} />
              <ScoreInput label={t.taste} myValue={myTaste} icon={<UtensilsCrossed size={12} />} colorClass={isSalgada ? "border-orange-200 text-orange-700 bg-orange-50" : "border-pink-200 text-pink-700 bg-pink-50"} onChange={(val) => onUpdate(data.id, isSalgada ? 'tasteScores' : 'tasteScoresDoce', val)} pointsLabel={t.points} disabled={isConfirmed} />
          </div>
          
          <div className="px-4 pb-4">
              <button onClick={() => { playUrnaSound(); onConfirm(data.id); }} disabled={!hasMyVotes || isConfirmed} className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:shadow-inner ${isConfirmed ? 'bg-green-100 text-green-600 border-2 border-green-200 cursor-default' : !hasMyVotes ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : isSalgada ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg active:scale-95' : 'bg-pink-600 text-white hover:bg-pink-700 hover:shadow-lg active:scale-95'}`}>
                  {isConfirmed ? <><Check size={18} /> {t.voteSent}</> : <><Send size={18} /> {t.voteButton}</>}
              </button>
          </div>

          <div className="px-4 pb-4 space-y-3">
              <textarea className="w-full text-xs p-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-300 dark:focus:border-slate-600 focus:outline-none transition-all resize-none text-slate-700 dark:text-slate-200 shadow-sm" rows={1} value={myNote} onChange={(e) => onUpdateNote(data.id, e.target.value)} placeholder={t.yourNotes} />
              <textarea className="w-full text-xs p-2 rounded-xl border-2 border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-200 dark:border-blue-800 focus:outline-none transition-all resize-none text-slate-700 dark:text-slate-200 shadow-sm" rows={2} value={globalNote} onChange={(e) => onUpdateGlobalNote(data.id, e.target.value)} placeholder={t.globalNotes} />
          </div>
        </div>
    </div>
  );
};
