
import React, { useState, useEffect } from 'react';
import { ChevronRight, Search, UserPlus, X, Trash2, ShieldCheck, Bell, Ban, Wifi, Sparkles, User } from 'lucide-react';
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
    const t = translations[language];
    const [searchTerm, setSearchTerm] = useState('');
    const [storedUsers, setStoredUsers] = useState<UserAccount[]>([]);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const [splashUser, setSplashUser] = useState<UserAccount | null>(null);
    const [loadingDots, setLoadingDots] = useState('');
    const [userAlreadyOnline, setUserAlreadyOnline] = useState<string | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const hasUnreadNotifications = notifications.some(n => !n.read);

    useEffect(() => {
        if (splashUser) {
            const dotsInterval = setInterval(() => { setLoadingDots(prev => prev.length >= 3 ? '' : prev + '.'); }, 500);
            const loginTimer = setTimeout(() => { onLoginSuccess(splashUser); }, 3000);
            return () => { clearInterval(dotsInterval); clearTimeout(loginTimer); };
        }
    }, [splashUser, onLoginSuccess]);

    useEffect(() => {
        authService.syncUsers().then(setStoredUsers);
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

    const handleAdminSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPassword === '0000') {
            const admin = { nickname: '@Leonardo', phone: '', password: '', isVerified: true, avatar: DM_AVATAR_URL };
            authService.saveUser(admin);
            setSplashUser(admin);
            setShowAdminLogin(false);
        } else {
            setAdminError('Senha incorreta.');
        }
    };

    const filteredPlayers = storedUsers.filter(u => 
        u.nickname !== '@Leonardo' && 
        u.nickname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)} 
                onLoginSuccess={(u) => { setSplashUser(u); setShowAuthModal(false); }} 
                language={language} 
            />

            {userAlreadyOnline && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-red-500/20 text-center animate-in zoom-in-95 flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-wiggle"><Ban size={40} className="text-red-600" /></div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Acesso Negado</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-medium">O perfil <span className="text-red-500 font-black">{userAlreadyOnline}</span> já está online.</p>
                        <button onClick={() => setUserAlreadyOnline(null)} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl">FECHAR</button>
                    </div>
                </div>
            )}

            {splashUser && (
                <div className="fixed inset-0 z-[200] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in">
                    <div className="relative flex flex-col items-center animate-in zoom-in-95">
                        <div className="w-40 h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden mb-8 bg-white dark:bg-slate-900">
                            {splashUser.avatar ? <img src={splashUser.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={80} className="text-slate-400" /></div>}
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{splashUser.nickname}</h2>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Entrando{loadingDots}</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="pt-10 pb-6 flex flex-col items-center text-center px-6">
                    <div className="w-20 h-20 bg-orange-600 rounded-full shadow-lg flex items-center justify-center mb-4"><Sparkles size={40} className="text-white animate-pulse" /></div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Torneio de Pizza</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Entre para votar ou cadastre-se</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <button onClick={() => setShowAuthModal(true)} className="w-full flex items-center justify-center gap-3 p-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest text-sm">
                        <UserPlus size={20} /> CADASTRAR NOVO PERFIL
                    </button>

                    <button onClick={() => setShowAdminLogin(true)} className="w-full flex items-center justify-between p-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-lg transform hover:scale-[1.02] transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/20"><img src={DM_AVATAR_URL} className="w-full h-full object-cover" /></div>
                            <span className="block font-bold flex items-center gap-2">@ADMINISTRADOR <ShieldCheck size={14} className="text-blue-400" /> {hasUnreadNotifications && <Bell size={14} className="text-red-500 animate-wiggle shrink-0" />}</span>
                        </div>
                        <ChevronRight size={20} className="opacity-50" />
                    </button>

                    <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div><div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase text-slate-400 font-bold tracking-widest">Ou selecione seu perfil</span></div></div>

                    <div className="relative mb-2 group"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input type="text" placeholder="Buscar jurado..." className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {filteredPlayers.map((u) => {
                            const isOnline = onlineNicknames.includes(u.nickname);
                            return (
                                <button key={u.nickname} onClick={() => handleLogin(u.nickname, 'player')} className={`relative flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-orange-500 transition-all text-left shadow-sm ${isOnline ? 'ring-2 ring-green-500/30' : ''}`}>
                                    <div className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                                        {isOnline && <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center"><Wifi size={24} className="text-green-600 opacity-20 animate-pulse" /></div>}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 overflow-hidden"><span className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate">{u.nickname}</span>{isOnline && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>}</div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">Jurado</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showAdminLogin && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                        <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X size={20} /></button>
                        <div className="text-center mb-8"><div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-indigo-500"><ShieldCheck size={32} className="text-indigo-400" /></div><h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Modo Admin</h3></div>
                        <form onSubmit={handleAdminSubmit} className="space-y-6">
                            <input type="password" autoFocus placeholder="Senha" className="w-full text-center text-2xl tracking-[0.5em] p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl dark:text-white" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                            <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm">Entrar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
