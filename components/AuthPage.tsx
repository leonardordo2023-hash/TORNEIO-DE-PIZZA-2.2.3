
import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, X, ShieldCheck, Bell, Ban, Wifi, Sparkles, User, UserPlus, Trash2, Globe, RotateCcw, Ghost } from 'lucide-react';
import { UserAccount } from '../types';
import { authService } from '../services/authService';
import { Language, translations } from '../services/translations';
import { AppNotification } from '../App';
import { AuthModal } from './AuthModals';

interface AuthPageProps {
    onLoginSuccess: (user: UserAccount) => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    notifications: AppNotification[];
    onlineNicknames: string[];
}

const DM_AVATAR_URL = 'https://ui-avatars.com/api/?name=DM&background=000&color=fff&size=128&bold=true&length=2';

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, language, setLanguage, notifications, onlineNicknames }) => {
    const t = translations[language].auth;
    const [searchTerm, setSearchTerm] = useState('');
    const [storedUsers, setStoredUsers] = useState<UserAccount[]>([]);
    const [deletedUsers, setDeletedUsers] = useState<UserAccount[]>([]);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const [splashUser, setSplashUser] = useState<UserAccount | null>(null);
    const [loadingDots, setLoadingDots] = useState('');
    const [userAlreadyOnline, setUserAlreadyOnline] = useState<string | null>(null);

    const hasUnreadNotifications = notifications.some(n => !n.read);

    useEffect(() => {
        if (splashUser) {
            const dotsInterval = setInterval(() => { setLoadingDots(prev => prev.length >= 3 ? '' : prev + '.'); }, 500);
            const loginTimer = setTimeout(() => { onLoginSuccess(splashUser); }, 3000);
            return () => { clearInterval(dotsInterval); clearTimeout(loginTimer); };
        }
    }, [splashUser, onLoginSuccess]);

    const refreshUserList = async () => {
        const users = await authService.syncUsers();
        setStoredUsers(users);
        setDeletedUsers(authService.getDeletedUsers());
    };

    useEffect(() => {
        refreshUserList();
    }, []);

    const handleLogin = (nickname: string, type: 'admin' | 'player') => {
        if (type === 'player' && onlineNicknames.includes(nickname)) {
            setUserAlreadyOnline(nickname);
            return;
        }

        const user = storedUsers.find(u => u.nickname.toLowerCase() === nickname.toLowerCase());
        if (user) {
            authService.saveUser(user);
            setSplashUser(user);
        }
    };

    const handleDeleteUser = async (e: React.MouseEvent, nickname: string) => {
        e.stopPropagation();
        if (window.confirm(`${translations[language].deleteConfirm} (${nickname})`)) {
            try {
                await authService.deleteUser(nickname);
                await refreshUserList();
            } catch (err: any) {
                alert("Erro: " + err.message);
            }
        }
    };

    const handleRestoreUser = async (nickname: string) => {
        try {
            await authService.restoreUser(nickname);
            await refreshUserList();
            alert(`Perfil ${nickname} restaurado!`);
        } catch (err) {
            alert("Erro ao restaurar perfil.");
        }
    };

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAdminError('');
        
        if (adminPassword === '0000') {
            const admin: UserAccount = { 
                nickname: '@Programação', 
                phone: '', 
                password: '0000', 
                isVerified: true, 
                avatar: DM_AVATAR_URL 
            };
            authService.saveUser(admin);
            setShowAdminLogin(false);
            setSplashUser(admin);
        } else {
            setAdminError(t.wrongPassword);
            setAdminPassword('');
        }
    };

    const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredPlayers = storedUsers
        .filter(u => {
            const nick = u.nickname.toLowerCase();
            // Apenas o Admin principal é oculto da lista de jogadores.
            // @Leonardo é um jurado com permissão de postar, então ele aparece na lista.
            const isHiddenAdmin = nick === '@programação';
            const matchesSearch = normalize(u.nickname).includes(normalize(searchTerm));
            return !isHiddenAdmin && matchesSearch;
        })
        .sort((a, b) => a.nickname.localeCompare(b.nickname, 'pt', { sensitivity: 'base' }));

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-orange-400/10 rounded-full blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[100px] animate-float-delayed"></div>
            </div>

            <div className="absolute top-6 right-6 flex gap-2 z-50">
                {['pt', 'es', 'en'].map(l => (
                    <button 
                        key={l}
                        onClick={() => setLanguage(l as any)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px] uppercase transition-all shadow-md ${language === l ? 'bg-indigo-600 text-white scale-110' : 'bg-white dark:bg-slate-800 text-slate-400 opacity-60'}`}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {userAlreadyOnline && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-red-500/20 text-center animate-in zoom-in-95 flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-wiggle"><Ban size={40} className="text-red-600" /></div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{t.accessDenied}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">O perfil <span className="text-red-500 font-black">{userAlreadyOnline}</span> {t.alreadyOnline}</p>
                        <button onClick={() => setUserAlreadyOnline(null)} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest">FECHAR</button>
                    </div>
                </div>
            )}

            {splashUser && (
                <div className="fixed inset-0 z-[200] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in">
                    <div className="relative flex flex-col items-center animate-in zoom-in-95">
                        <div className="w-40 h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden mb-8 bg-white dark:bg-slate-900">
                            {splashUser.avatar ? <img src={splashUser.avatar} className="w-full h-full object-cover" alt="Avatar" /> : <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800"><User size={80} className="text-slate-400" /></div>}
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{splashUser.nickname}</h2>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.entering}{loadingDots}</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="pt-10 pb-6 flex flex-col items-center text-center px-6">
                    <div className="w-20 h-20 bg-orange-600 rounded-full shadow-lg flex items-center justify-center mb-4"><Sparkles size={40} className="text-white animate-pulse" /></div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{translations[language].appTitle}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.selectProfile}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    
                    <div className="relative mb-2 group">
                        <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder={t.searchPlaceholder} 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800 border-2 border-transparent dark:border-slate-700 rounded-2xl text-sm font-bold outline-none dark:text-white focus:border-orange-500 focus:bg-white dark:focus:bg-slate-750 transition-all shadow-inner" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>

                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                        <div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase text-slate-400 font-black tracking-widest">{t.judgeList}</span></div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pb-4">
                        {filteredPlayers.length > 0 ? (
                            filteredPlayers.map((u) => {
                                const isOnline = onlineNicknames.includes(u.nickname);
                                return (
                                    <div 
                                        key={u.nickname} 
                                        onClick={() => handleLogin(u.nickname, 'player')} 
                                        className={`relative flex flex-col items-center p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-orange-500 hover:shadow-xl transition-all text-center group shadow-sm cursor-pointer ${isOnline ? 'ring-2 ring-green-500/30' : ''}`}
                                    >
                                        <div 
                                            onClick={(e) => handleDeleteUser(e, u.nickname)}
                                            className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-20"
                                            title="Excluir Perfil"
                                        >
                                            <Trash2 size={10} />
                                        </div>

                                        <div className="relative mb-1.5">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border-2 border-slate-200 dark:border-slate-600 transition-transform group-hover:scale-110">
                                                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.nickname} /> : <User size={18} className="text-slate-400" />}
                                            </div>
                                            {isOnline && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center animate-pulse">
                                                    <Wifi size={8} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 w-full px-1">
                                            <span className="font-black text-slate-800 dark:text-slate-100 text-[9px] truncate uppercase tracking-tight block">{u.nickname}</span>
                                            <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest block opacity-70">Entrar</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-4 py-12 text-center flex flex-col items-center">
                                <Search size={32} className="text-slate-200 mb-4" />
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Nenhum perfil</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 pb-8">
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all active:scale-[0.98] group"
                        >
                            <UserPlus size={16} className="group-hover:animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.addProfile}</span>
                        </button>

                        <div className="flex gap-2">
                            <button onClick={() => setShowAdminLogin(true)} className="flex-1 flex items-center justify-between p-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-md transform hover:scale-[1.01] transition-all group">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/20">
                                        <img src={DM_AVATAR_URL} className="w-full h-full object-cover" alt="Admin" />
                                    </div>
                                    <span className="block font-bold text-[10px] flex items-center gap-1.5 tracking-wider uppercase">
                                        {t.adminPanel} <ShieldCheck size={12} className="text-blue-400" /> 
                                        {hasUnreadNotifications && <Bell size={12} className="text-red-500 animate-wiggle shrink-0" />}
                                    </span>
                                </div>
                                <ChevronRight size={16} className="opacity-50" />
                            </button>
                            
                            {deletedUsers.length > 0 && (
                                <button onClick={() => setShowTrash(true)} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl shadow-md hover:text-indigo-600 transition-all active:scale-95 group" title="Ver Lixeira">
                                    <Ghost size={20} className="group-hover:animate-bounce" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showTrash && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <Ghost size={20} className="text-indigo-500" />
                                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Reativar Perfil</h3>
                            </div>
                            <button onClick={() => setShowTrash(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto custom-scrollbar space-y-2">
                            {deletedUsers.map(u => (
                                <div key={u.nickname} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400 m-auto" />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{u.nickname}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleRestoreUser(u.nickname)} 
                                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1.5 font-black text-[9px] uppercase tracking-widest"
                                    >
                                        <RotateCcw size={14} /> Ativar
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Toque para restaurar fotos e progresso do jurado</p>
                        </div>
                    </div>
                </div>
            )}

            {showAdminLogin && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95">
                        <button onClick={() => { setShowAdminLogin(false); setAdminError(''); }} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-slate-900 dark:bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-400 shadow-lg">
                                <ShieldCheck size={32} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.adminMode}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t.restrictedAccess}</p>
                        </div>
                        <form onSubmit={handleAdminSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <input 
                                    type="password" 
                                    autoFocus 
                                    inputMode="numeric"
                                    placeholder="Senha" 
                                    className="w-full text-center text-3xl tracking-[0.4em] p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all shadow-inner font-black" 
                                    value={adminPassword} 
                                    onChange={(e) => setAdminPassword(e.target.value.replace(/\D/g, '').substring(0, 4))} 
                                />
                                {adminError && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-bounce">{adminError}</p>}
                            </div>
                            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">{t.accessPanel}</button>
                        </form>
                    </div>
                </div>
            )}

            <AuthModal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onLoginSuccess={() => {
                    setShowAddModal(false);
                    refreshUserList();
                }} 
                language={language} 
            />
        </div>
    );
};
