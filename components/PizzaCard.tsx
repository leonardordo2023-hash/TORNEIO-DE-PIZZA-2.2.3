
import React, { useEffect, useState, useRef } from 'react';
import { PizzaData, getSum, MediaItem } from '../types';
import { Pizza, Star, UtensilsCrossed, User, Trash2, Check, X, Pencil, MessageSquare, Unlock } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface PizzaCardProps {
  data: PizzaData;
  userId: string;
  isAdmin: boolean;
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
  const [isFocused, setIsFocused] = useState(false);

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
    if (raw === '') { onChange(-1); return; }
    let val = parseFloat(raw);
    if (isNaN(val)) return;
    if (val > 10) val = 10;
    if (val < 0) val = 0;
    onChange(val);
  };

  return (
    <div className={`flex flex-col gap-1 relative transition-all duration-300 ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
      <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1 px-1">
        {icon} {label}
      </label>
      <div className={`flex items-center gap-1.5 p-0.5 rounded-lg border-0 transition-all ${isFocused ? 'bg-white shadow-sm ring-1 ring-indigo-500' : 'bg-slate-50/50 dark:bg-slate-800'}`}>
        <input 
            type="number" 
            min="0" 
            max="10" 
            step="0.1" 
            inputMode="decimal" 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent p-1.5 text-lg font-black text-center focus:outline-none dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            placeholder="-" 
            value={localStr} 
            onChange={handleChange}
        />
        <div className="pr-2 font-black text-[8px] text-slate-300">PTS</div>
      </div>
    </div>
  );
};

export const PizzaCard: React.FC<PizzaCardProps> = ({ data, userId, isAdmin, onUpdate, onConfirm, onUpdateNote, onUpdateGlobalNote, rank, peerCount, index = 0, onDelete, onUpdateDate, onAddPhoto, language, ownerName, variant }) => {
  const [isVisible, setIsVisible] = useState(false);
  const t = translations[language];
  
  useEffect(() => { 
      const timer = setTimeout(() => setIsVisible(true), 30 + (index * 20)); 
      return () => clearTimeout(timer);
  }, [index]);

  const isSalgada = variant === 'salgada';
  const beautyScoresMap = isSalgada ? data.beautyScores : (data.beautyScoresDoce || {});
  const tasteScoresMap = isSalgada ? data.tasteScores : (data.tasteScoresDoce || {});
  const bonusScoresMap = isSalgada ? (data.bonusScores || {}) : (data.bonusScoresDoce || {});

  // Pontuação do usuário logado para este card
  const myBeauty = beautyScoresMap?.[userId] ?? null;
  const myTaste = tasteScoresMap?.[userId] ?? null;
  const myBonus = bonusScoresMap?.[userId] ?? 0;
  
  const myTotalForThisCard = (myBeauty !== null && myBeauty !== -1 ? myBeauty : 0) + 
                             (myTaste !== null && myTaste !== -1 ? myTaste : 0) + 
                             (myBonus || 0);

  // Pontuação global (Soma de todos) - Apenas para uso do Admin
  const globalTotalPoints = getSum(beautyScoresMap) + getSum(tasteScoresMap) + getSum(bonusScoresMap);

  const isConfirmed = data.confirmedVotes?.[userId] === true;
  const hasMyVotes = (myBeauty !== null && myBeauty !== -1) && (myTaste !== null && myTaste !== -1);

  const handleToggleBonus = () => {
    if (isConfirmed) return;
    const newValue = myBonus === 1 ? 0 : 1;
    onUpdate(data.id, isSalgada ? 'bonusScores' : 'bonusScoresDoce', newValue);
  };

  const handleConfirmClick = () => {
      if (isConfirmed) {
          if (confirm("Deseja desbloquear esta ficha para editar seu voto?")) {
              onConfirm(data.id);
          }
      } else {
          onConfirm(data.id);
      }
  };

  // Valor a ser exibido no quadrado preto
  // Se for admin, mostra o total global. Se for jogador, mostra apenas o SEU voto convertido.
  const displayVal = isAdmin ? globalTotalPoints : myTotalForThisCard;
  const levelsGained = Math.floor(displayVal / 100);
  const remainingPercent = (displayVal % 100).toFixed(1);

  return (
    <div className={`transition-all duration-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-0 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden flex flex-col h-full relative">
          
          <div className="p-3 pb-1 flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSalgada ? 'bg-orange-100 text-orange-600' : 'bg-pink-100 text-pink-600'}`}>
                <Pizza size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">Pizza #{data.id}</h3>
                <span className="text-[7px] font-black uppercase text-indigo-500 tracking-tighter">{ownerName || 'Voto'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
                <button 
                    onClick={handleToggleBonus}
                    disabled={isConfirmed}
                    className={`p-1.5 rounded-lg transition-all ${myBonus === 1 ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} ${isConfirmed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    title="Bônus de Massa Artesanal (+1pt)"
                >
                    <Star size={14} fill={myBonus === 1 ? "currentColor" : "none"} className={myBonus === 1 ? 'animate-pulse' : ''} />
                </button>
                {displayVal > 0 && (
                    <div className="px-2 py-1 bg-slate-900 dark:bg-slate-800 rounded-lg font-black text-white shadow-sm flex flex-col items-center justify-center min-w-[40px] min-h-[32px] leading-none">
                      {isAdmin ? (
                          <span className="text-[10px]">{displayVal.toFixed(1)}</span>
                      ) : (
                          <>
                              {levelsGained > 0 && <span className="text-[6px] text-indigo-400 uppercase mb-0.5">lvl +{levelsGained}</span>}
                              <span className="text-[9px]">{remainingPercent}%</span>
                          </>
                      )}
                    </div>
                )}
            </div>
          </div>

          <div className="p-3 pt-1 grid grid-cols-2 gap-2">
              <ScoreInput label={t.beauty} myValue={myBeauty} icon={<Star size={8} />} colorClass="" onChange={(val) => onUpdate(data.id, isSalgada ? 'beautyScores' : 'beautyScoresDoce', val)} pointsLabel="" disabled={isConfirmed} />
              <ScoreInput label={t.taste} myValue={myTaste} icon={<UtensilsCrossed size={8} />} colorClass="" onChange={(val) => onUpdate(data.id, isSalgada ? 'tasteScores' : 'tasteScoresDoce', val)} pointsLabel="" disabled={isConfirmed} />
          </div>
          
          <div className="px-3 pb-2 flex gap-2">
              <button 
                onClick={handleConfirmClick} 
                disabled={!hasMyVotes && !isConfirmed} 
                className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isConfirmed ? 'bg-green-600 text-white shadow-lg' : !hasMyVotes ? 'bg-slate-50 text-slate-300' : 'bg-slate-900 text-white shadow-lg'}`}
              >
                  {isConfirmed ? <><Unlock size={12} strokeWidth={3} /> {t.voteSent}</> : t.voteButton}
              </button>
          </div>

          <div className="p-3 pt-0 space-y-2">
            <textarea 
                className="w-full text-[9px] font-bold p-2 rounded-lg border-0 bg-slate-50/50 dark:bg-slate-800 outline-none transition-all resize-none h-8" 
                rows={1} 
                value={data.userNotes?.[userId] || ''} 
                onChange={(e) => onUpdateNote(data.id, e.target.value)} 
                placeholder={t.yourNotes} 
            />
            <textarea 
                className="w-full text-[9px] font-bold p-2 rounded-lg border-0 bg-blue-50/20 dark:bg-slate-800 outline-none transition-all resize-none h-8" 
                rows={1} 
                value={data.notes || ''} 
                onChange={(e) => onUpdateGlobalNote(data.id, e.target.value)} 
                placeholder={t.globalNotes} 
            />
          </div>

          {isAdmin && (
             <div className="px-3 pb-3 flex justify-between items-center mt-auto">
                <div className="flex -space-x-1.5 overflow-hidden">
                    {Object.keys(data.confirmedVotes || {}).filter(uid => data.confirmedVotes?.[uid]).slice(0, 3).map((uid, i) => (
                        <div key={i} className="inline-block h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-200 flex items-center justify-center text-[6px] font-black">{uid.charAt(1).toUpperCase()}</div>
                    ))}
                    {Object.keys(data.confirmedVotes || {}).filter(uid => data.confirmedVotes?.[uid]).length > 3 && (
                        <div className="inline-block h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 flex items-center justify-center text-[5px] font-bold text-slate-400">+{Object.keys(data.confirmedVotes || {}).filter(uid => data.confirmedVotes?.[uid]).length - 3}</div>
                    )}
                </div>
                <button onClick={() => onDelete(data.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
             </div>
          )}
        </div>
    </div>
  );
};
