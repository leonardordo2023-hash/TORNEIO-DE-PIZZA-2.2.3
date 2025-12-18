
import React, { useState, useRef, useEffect } from 'react';
import { UserAccount, PizzaData, SocialData } from '../types';
import { processMediaFile } from '../services/imageService';
import { authService } from '../services/authService';
import { calculateUserLevel } from '../services/gamificationUtils';
import { translations, Language } from '../services/translations';
import { Camera, User, Zap, Star, Crown, Save, Loader2, ArrowLeft, ShieldCheck, Heart, ChevronUp, Trash2, X, Search, Check, RefreshCcw, MessageCircle, Image as ImageIcon, HelpCircle } from 'lucide-react';
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

    const isAdmin = currentUser.nickname === '@Leonardo';

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

    const renderLevelArrows = (lvl: number) => {
        if (lvl >= 5) return <div className="mt-2 flex flex-col items-center animate-bounce-slow"><Crown size={20} className="text-yellow-500 fill-yellow-500 drop-shadow-md" /></div>;
        const arrowCount = lvl || 1;
        const arrows = Array.from({ length: arrowCount });
        return (
            <div className="mt-2 flex justify-center gap-0.5">
                {arrows.map((_, i) => (
                    <ChevronUp 
                        key={i} 
                        size={20} 
                        className="text-slate-700 dark:text-slate-400 drop-shadow-sm animate-pulse" 
                        style={{ animationDelay: `${i * 150}ms` }}
                        strokeWidth={4} 
                    />
                ))}
            </div>
        );
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
        if (!formData.nickname.startsWith('@')) { setError(t.auth.mustStartWithAt); return; }
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

    // HARD RESET: Define o offset como o total acumulado para voltar ao zero absoluto
    const applyLevelResetHard = (user: UserAccount) => {
        const cleanNick = user.nickname.replace('@', '').trim();
        // Recalculamos o XP sem offset para saber o valor total a anular
        const userStats = calculateUserLevel({ ...user }, pizzas, socialData, pizzaOwners);
        // O rawProgress contém todo o XP ganho até agora sem considerar o offset atual
        localStorage.setItem(`pizza_xp_offset_${cleanNick}`, userStats.rawProgress.toString());
    };

    const handleResetUserXP = (user: UserAccount) => {
        if (confirm(`ZERAR XP: Deseja realmente resetar ${user.nickname} para o Nível 1 com 0% de XP?`)) {
            broadcastResetUserXP({ targetNickname: user.nickname, resetTime: Date.now() });
            applyLevelResetHard(user);
            alert(`Perfil de ${user.nickname} zerado com sucesso!`);
            setShowResetList(false);
            if (currentUser.nickname === user.nickname) window.location.reload();
        }
    };

    const handleResetAllXP = () => {
        if (confirm("ATENÇÃO ADMIN: Esta ação resetará TODOS OS JOGADORES para o Nível 1 com 0% de XP. Deseja prosseguir?")) {
            const allPlayers = authService.getUsers();
            broadcastResetUserXP({ targetNickname: 'ALL', resetTime: Date.now() });
            allPlayers.forEach(user => applyLevelResetHard(user));
            alert("Todos os perfis foram zerados!");
            setShowResetList(false);
            window.location.reload();
        }
    };

    const allUsers = authService.getUsers().filter(u => u.nickname !== '@Leonardo');
    const filteredUsers = allUsers.filter(u => u.nickname.toLowerCase().includes(resetSearch.toLowerCase()));

    return (
        <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <GamificationSimulation isOpen={showGamiHelp} onClose={() => setShowGamiHelp(false)} />
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-orange-400/20 rounded-full blur-[80px] animate-float dark:bg-orange-900/20"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500/20 rounded-full blur-[90px] animate-float-delayed dark:bg-purple-900/20"></div>
            </div>
            <button onClick={onClose} className="absolute top-6 left-6 z-50 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-slate-700 dark:text-slate-200 shadow-lg hover:scale-110 transition-transform"><ArrowLeft size={24} /></button>

            {showResetList && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-black text-xs uppercase text-slate-500">Zerar Progresso (Admin)</h3>
                            <button onClick={() => setShowResetList(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/20">
                            <button 
                                onClick={handleResetAllXP}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                <RefreshCcw size={16} /> Zerar XP de Todos
                            </button>
                            <p className="text-[9px] text-red-500 dark:text-red-400 font-bold mt-2 text-center uppercase tracking-tighter">Todos voltarão ao Nível 1 com 0%</p>
                        </div>

                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                <input type="text" placeholder="Buscar perfil..." className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={resetSearch} onChange={(e) => setResetSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {filteredUsers.length === 0 ? <p className="text-center py-8 text-xs text-slate-400">Nenhum perfil encontrado</p> : filteredUsers.map(user => (
                                <button key={user.nickname} onClick={() => handleResetUserXP(user)} className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-left group border border-transparent hover:border-indigo-100 dark:hover:border-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">{user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}</div>
                                    <div className="flex-1 min-w-0"><span className="block font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{user.nickname}</span><span className="text-[10px] text-slate-400 uppercase font-black">Nível {calculateUserLevel(user, pizzas, socialData, pizzaOwners).level}</span></div>
                                    <Trash2 size={16} className="text-red-400 group-hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md p-6 relative z-10 flex flex-col h-full md:h-auto justify-center">
                <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                    <div className={`h-32 relative overflow-hidden group ${!formData.cover ? (isAdmin ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-black' : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500') : ''}`}>
                        {formData.cover ? <img src={formData.cover} className="w-full h-full object-cover" alt="Cover" /> : <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '20px 20px' }}></div>}
                        {isEditing && <button onClick={() => coverInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 z-20"><ImageIcon size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Alterar Capa</span></button>}
                        {isAdmin && <div className="absolute top-4 left-6 flex items-center gap-3 z-10"><div className="text-white/30"><ShieldCheck size={48} /></div><button onClick={() => setShowResetList(true)} className="bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-lg transition-all active:scale-90 border border-red-400/30">APAGAR</button></div>}
                        <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="relative -mt-16 mb-4 inline-block group">
                            <div className={`w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl relative z-10 transition-transform ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && fileInputRef.current?.click()}>
                                {formData.avatar ? <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400"><User size={48}/></div>}
                                {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"><Camera className="text-white" size={32} /></div>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className={`absolute bottom-1 left-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1.5 rounded-full border-2 border-white dark:border-slate-900 z-30 shadow-sm transition-colors ${!isEditing && 'hidden'}`}><Camera size={14} /></button>
                            <div className="absolute bottom-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full border-2 border-white dark:border-slate-900 z-20 shadow-sm flex items-center gap-1 pointer-events-none"><Zap size={10} fill="currentColor" /> {stats.level}</div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                        </div>

                        <div className="text-center mb-6">
                            {isEditing ? <div className="mb-4"><input type="text" value={formData.nickname} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full text-center text-2xl font-black bg-slate-100 dark:bg-slate-800 border-none rounded-xl p-2 dark:text-white focus:ring-2 focus:ring-indigo-500" placeholder="@SeuApelido" disabled={isAdmin} /></div> : <div className="flex items-center justify-center gap-2 mb-1">{isAdmin ? <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">@ADMINISTRADOR <ShieldCheck className="text-blue-600 fill-blue-100 dark:fill-blue-900/50" size={28} /></h1> : <h1 className="text-3xl font-black text-slate-900 dark:text-white">{currentUser.nickname}</h1>}</div>}
                            <p className={`text-sm font-bold flex items-center justify-center gap-1.5 ${isAdmin ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{isAdmin ? 'Administrador' : 'Jurados'}</p>
                            {error && <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">{error}</p>}
                            {success && <p className="text-green-500 text-xs font-bold mt-2 flex items-center justify-center gap-1"><Check size={12}/> {success}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mb-1">{stats.totalPoints.toFixed(1)}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Pontos</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-red-500 dark:text-red-400 leading-none mb-1">{stats.likesGiven}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Likes</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-black text-blue-500 dark:text-blue-400 leading-none mb-1">{stats.commentsGiven}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Posts</span>
                            </div>
                        </div>

                        <div className="mb-6 text-center">
                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 items-center">
                                <span className="flex items-center gap-2">
                                    {stats.level === 5 ? 'Nível Máximo LENDÁRIO' : `Progresso Nível ${stats.level}`}
                                    <button onClick={() => setShowGamiHelp(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all active:scale-90 animate-pulse ring-2 ring-white dark:ring-slate-800"><span className="font-black text-[10px]">?</span><span className="text-[9px] font-black uppercase tracking-tighter">Ajuda</span></button>
                                </span>
                                <span>{stats.currentBarProgress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2 shadow-inner"><div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out" style={{ width: `${stats.currentBarProgress}%` }}></div></div>
                            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">{getLevelTitle(stats.level)}</span>
                            {renderLevelArrows(stats.level)}
                        </div>

                        {isEditing ? <div className="flex gap-3"><button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancelar</button><button onClick={handleSaveProfile} disabled={isLoading} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">{isLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Salvar</button></div> : <button onClick={() => setIsEditing(true)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg transition-transform active:scale-95">Editar Perfil</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};
