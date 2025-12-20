
import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, PizzaData, SocialData } from '../types';
import { processMediaFile } from '../services/imageService';
import { authService } from '../services/authService';
import { calculateUserLevel } from '../services/gamificationUtils';
import { translations, Language } from '../services/translations';
import { Camera, User, Zap, Star, Crown, Save, Loader2, ArrowLeft, ShieldCheck, Heart, Trash2, X, Search, Check, RefreshCcw, MessageCircle, Image as ImageIcon, HelpCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { broadcastResetUserXP, broadcastUserUpdate } from '../services/p2pService';
import { GamificationSimulation } from './GamificationSimulation';

interface ProfilePageProps {
    currentUser: UserAccount;
    onUpdateUser: (user: UserAccount) => void;
    onClose: () => void;
    pizzas: PizzaData[];
    socialData: SocialData;
    language: Language;
    pizzaOwners: Record<number, string>; 
}

const DM_AVATAR_URL = 'https://ui-avatars.com/api/?name=DM&background=000&color=fff&size=128&bold=true&length=2';

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
    currentUser, onUpdateUser, onClose, pizzas, socialData, language, pizzaOwners 
}) => {
    const t = translations[language];
    const [isEditing, setIsEditing] = useState(false);
    const [showResetList, setShowResetList] = useState(false);
    const [showGamiHelp, setShowGamiHelp] = useState(false);
    const [resetSearch, setResetSearch] = useState('');
    const [formData, setFormData] = useState({ 
        nickname: currentUser.nickname, 
        avatar: currentUser.avatar || '',
        cover: currentUser.cover || ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // ADMIN REAL: Apenas @programação
    const isAdmin = currentUser.nickname.toLowerCase() === '@programação';

    useEffect(() => {
        setFormData({
            nickname: currentUser.nickname,
            avatar: currentUser.avatar || '',
            cover: currentUser.cover || ''
        });
    }, [currentUser]);

    const stats = calculateUserLevel(currentUser, pizzas, socialData, pizzaOwners);

    const getLevelTitle = (lvl: number) => {
        if (lvl >= 5) return "LENDA SUPREMA";
        if (lvl >= 4) return "GRÃO-MESTRE";
        if (lvl >= 3) return "CHEF DE ELITE";
        if (lvl >= 2) return "MESTRE PIZZAIOLO";
        return "APRENDIZ";
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        setError('');
        try {
            const quality = field === 'cover' ? 150 : 100;
            const { url } = await processMediaFile(file, quality);
            setFormData(prev => ({ ...prev, [field]: url }));
            setIsEditing(true); 
        } catch (err) {
            setError("Erro ao processar imagem.");
        } finally {
            setIsLoading(false);
            if (e.target) e.target.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setError('');
        setSuccess('');
        if (!formData.nickname.startsWith('@')) { setError(t.auth.mustStartWithAt || "Deve começar com @"); return; }
        setIsLoading(true);
        try {
            const updatedUser = await authService.updateUser(currentUser.nickname, {
                nickname: formData.nickname,
                avatar: formData.avatar,
                cover: formData.cover
            });
            broadcastUserUpdate(updatedUser);
            onUpdateUser(updatedUser);
            setSuccess(t.profileEdit.success);
            setTimeout(() => { setSuccess(''); setIsEditing(false); }, 1000);
        } catch (err) { setError((err as Error).message); } finally { setIsLoading(false); }
    };

    const handleResetUserXP = async (user: UserAccount) => {
        if (confirm(`ZERAR PROGRESSO: Deseja realmente resetar ${user.nickname} para o Nível 1 com 0 pontos?`)) {
            setIsLoading(true);
            try {
                const userStats = calculateUserLevel(user, pizzas, socialData, pizzaOwners);
                const updated = await authService.updateUser(user.nickname, { 
                    xpOffset: userStats.rawProgress, 
                    pointsOffset: userStats.totalDisplayPointsRaw 
                });
                broadcastResetUserXP({ targetNickname: user.nickname, resetTime: Date.now() });
                broadcastUserUpdate(updated);
                if (currentUser.nickname === user.nickname) window.location.reload();
                else { alert(`Experiência de ${user.nickname} zerada!`); setShowResetList(false); }
            } catch (err) { alert("Erro ao zerar experiência."); } finally { setIsLoading(false); }
        }
    };

    const handleAdjustPoints = async (user: UserAccount, amount: number) => {
        const actionLabel = amount > 0 ? "remover" : "adicionar";
        if (confirm(`AJUSTE MANUAL: Deseja realmente ${actionLabel} ${Math.abs(amount)} pontos de ${user.nickname}?`)) {
            setIsLoading(true);
            try {
                const updated = await authService.updateUser(user.nickname, { 
                    xpOffset: (user.xpOffset || 0) + amount, 
                    pointsOffset: (user.pointsOffset || 0) + amount 
                });
                broadcastResetUserXP({ targetNickname: user.nickname, resetTime: Date.now() });
                broadcastUserUpdate(updated);
                alert(`Ajuste de ${amount} pontos aplicado a ${user.nickname}.`);
            } catch (err) { alert("Erro ao ajustar pontos."); } finally { setIsLoading(false); }
        }
    };

    const handleResetAllXP = async () => {
        if (confirm("ATENÇÃO ADMIN: Esta ação resetará TODOS OS JOGADORES para o Nível 1 com 0 pontos. Deseja prosseguir?")) {
            setIsLoading(true);
            try {
                const allPlayers = authService.getUsers().filter(u => u.nickname.toLowerCase() !== '@programação');
                await Promise.all(allPlayers.map(async (player) => {
                    const stats = calculateUserLevel(player, pizzas, socialData, pizzaOwners);
                    const updated = await authService.updateUser(player.nickname, { 
                        xpOffset: stats.rawProgress,
                        pointsOffset: stats.totalDisplayPointsRaw 
                    });
                    broadcastUserUpdate(updated);
                }));
                broadcastResetUserXP({ targetNickname: 'ALL', resetTime: Date.now() });
                alert("Todos os perfis foram zerados com sucesso!");
                setShowResetList(false);
                window.location.reload();
            } catch (err) { alert("Erro ao zerar experiência global."); } finally { setIsLoading(false); }
        }
    };

    const allUsers = authService.getUsers().filter(u => u.nickname.toLowerCase() !== '@programação');
    const filteredUsers = allUsers.filter(u => u.nickname.toLowerCase().includes(resetSearch.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-10 duration-300">
            <GamificationSimulation isOpen={showGamiHelp} onClose={() => setShowGamiHelp(false)} />
            
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-orange-400/20 rounded-full blur-[80px] animate-float dark:bg-orange-900/20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/20 rounded-full blur-[90px] animate-float-delayed dark:bg-purple-900/20"></div>
            </div>

            <div className="sticky top-0 w-full max-w-md px-4 sm:px-6 pt-4 sm:pt-6 z-50 flex justify-start pointer-events-none">
                <button onClick={onClose} className="p-2 sm:p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-slate-700 dark:text-slate-200 shadow-lg hover:scale-110 transition-transform pointer-events-auto"><ArrowLeft size={20} className="sm:w-6 sm:h-6" /></button>
            </div>

            {showResetList && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-black text-xs uppercase text-slate-500 tracking-widest">Gestão de Jurados (Admin)</h3>
                            <button onClick={() => setShowResetList(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20">
                            <button onClick={handleResetAllXP} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-[10px] uppercase tracking-widest">{isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />} Zerar Experiência de Todos</button>
                        </div>

                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                <input type="text" placeholder="Buscar perfil (ex: @Elisa)..." className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={resetSearch} onChange={(e) => setResetSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredUsers.length === 0 ? <p className="text-center py-8 text-xs text-slate-400">Nenhum perfil encontrado</p> : filteredUsers.map(user => (
                                <div key={user.nickname} className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}</div>
                                    <div className="flex-1 min-w-0"><span className="block font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{user.nickname}</span><span className="text-[9px] text-slate-400 uppercase font-black">Nível {calculateUserLevel(user, pizzas, socialData, pizzaOwners).level}</span></div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleAdjustPoints(user, 20)} className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm" title="Remover 20 pontos">
                                            <span className="text-[8px] font-black leading-none">-20</span>
                                        </button>
                                        <button onClick={() => {
                                            const amt = prompt(`Quanto de XP/Pontos remover de ${user.nickname}?`, "0");
                                            if (amt) handleAdjustPoints(user, parseFloat(amt));
                                        }} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <MinusCircle size={14} />
                                        </button>
                                        <button onClick={() => handleResetUserXP(user)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                            <RefreshCcw size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md p-4 sm:p-6 relative z-10 flex flex-col min-h-full justify-center py-6 sm:py-10 landscape:py-4">
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl landscape:scale-[0.75] landscape:origin-top transition-transform">
                    <div className={`h-24 sm:h-32 landscape:h-16 relative overflow-hidden group ${!formData.cover ? (isAdmin ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-black' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500') : ''}`}>
                        {formData.cover ? <img src={formData.cover} className="w-full h-full object-cover" alt="Cover" /> : <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>}
                        {isEditing && <button onClick={() => coverInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 z-20"><ImageIcon size={24} /><span className="text-[10px] font-black uppercase tracking-widest text-center">Alterar Capa</span></button>}
                        {isAdmin && <div className="absolute top-4 left-6 flex items-center gap-3 z-10 landscape:top-2"><div className="text-white/30"><ShieldCheck size={48} className="landscape:w-8 landscape:h-8" /></div><button onClick={() => setShowResetList(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] sm:text-[9px] font-black uppercase px-3 sm:px-4 py-1.5 rounded-full shadow-lg transition-all active:scale-90 border border-indigo-400/30 whitespace-nowrap tracking-widest">GERENCIAR PONTOS</button></div>}
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                    </div>

                    <div className="px-4 sm:px-8 pb-4 sm:pb-8 relative">
                        <div className="relative -mt-10 sm:-mt-16 mb-2 sm:mb-4 inline-block group landscape:-mt-8">
                            <div className={`w-24 h-24 sm:w-32 sm:h-32 landscape:w-16 landscape:h-16 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl relative z-10 transition-transform ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                                {formData.avatar ? <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"><User className="w-12 h-12 sm:w-16 sm:h-16 landscape:w-8 landscape:h-8" /></div>}
                                {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"><Camera className="text-white" size={24} /></div>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className={`absolute bottom-1 left-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border-2 border-white dark:border-slate-900 z-30 shadow-sm transition-colors ${!isEditing && 'hidden'}`}><Camera size={12} /></button>
                            <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-yellow-400 text-yellow-900 text-[10px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border-2 border-white dark:border-slate-900 z-20 shadow-sm flex items-center gap-1 pointer-events-none landscape:right-0 landscape:bottom-0"><Zap size={8} fill="currentColor" /> {stats.level}</div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                        </div>

                        <div className="text-center mb-4 sm:mb-6 landscape:mb-1">
                            {isEditing ? <div className="mb-2 sm:mb-4"><input type="text" value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full text-center text-xl sm:text-2xl font-black bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-1.5 sm:p-2 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="@SeuApelido" disabled={isAdmin} /></div> : <div className="flex items-center justify-center gap-2 mb-0.5 sm:mb-1">{isAdmin ? <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">ADMIN <ShieldCheck className="text-blue-600 fill-blue-100 dark:fill-blue-900/50" size={20} /></h1> : <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{currentUser.nickname}</h1>}</div>}
                            <p className={`text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 ${isAdmin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{isAdmin ? 'Administrador' : 'Jurado'}</p>
                            {error && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{error}</p>}
                            {success && <p className="text-green-500 text-[10px] font-bold mt-1 flex items-center justify-center gap-1"><Check size={10}/> {success}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4 sm:mb-6 landscape:mb-1">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 sm:p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-0.5 sm:mb-1">{stats.totalPoints.toFixed(1)}</span>
                                <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight">Pontos</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 sm:p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-xl sm:text-2xl font-black text-red-500 dark:text-red-400 leading-none mb-0.5 sm:mb-1">{stats.likesGiven}</span>
                                <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight">Likes</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-1.5 sm:p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-xl sm:text-2xl font-black text-blue-500 dark:text-blue-400 leading-none mb-0.5 sm:mb-1">{stats.commentsGiven}</span>
                                <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tight">Posts</span>
                            </div>
                        </div>

                        <div className="mb-4 sm:mb-6 text-center landscape:mb-2">
                            <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-400 mb-1.5 sm:mb-2 items-center">
                                <span className="flex items-center gap-1.5">
                                    {stats.level === 5 ? 'Nível Máximo LENDÁRIO' : `Nível ${stats.level}`}
                                    <button onClick={() => setShowGamiHelp(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 flex items-center gap-1 shadow-lg shadow-indigo-500/20 transition-all active:scale-90 animate-pulse ring-2 ring-white dark:ring-slate-800"><span className="font-black text-[8px] sm:text-[10px]">?</span><span className="text-[7px] sm:text-[9px] font-black uppercase tracking-tighter">Ajuda</span></button>
                                </span>
                                <span>{stats.currentBarProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-2 sm:h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5 sm:mb-2 shadow-inner"><div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out" style={{ width: `${stats.currentBarProgress}%` }}></div></div>
                            <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-indigo-100 dark:border-indigo-800">{getLevelTitle(stats.level)}</span>
                        </div>

                        {isEditing ? <div className="flex gap-2 sm:gap-3"><button onClick={() => setIsEditing(false)} className="flex-1 py-3 sm:py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm sm:text-base">Cancelar</button><button onClick={handleSaveProfile} disabled={isLoading} className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base">{isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar</button></div> : <button onClick={() => setIsEditing(true)} className="w-full py-3 sm:py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm sm:text-base">Editar Perfil</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
