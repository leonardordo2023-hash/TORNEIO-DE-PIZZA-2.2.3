
import React, { useState } from 'react';
import { X, UserPlus, Loader2, Check } from 'lucide-react';
import { authService } from '../services/authService';
import { UserAccount } from '../types';
import { Language, translations } from '../services/translations';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (user: UserAccount) => void;
    language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, language }) => {
    const t = translations[language].auth;
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const cleanNickname = nickname.trim();
        if (!cleanNickname) { setError('Digite um apelido.'); return; }
        if (!cleanNickname.startsWith('@')) { setError('O apelido deve começar com @'); return; }
        if (cleanNickname.length < 3) { setError('Apelido muito curto.'); return; }

        setIsLoading(true);
        try {
            const newUser: UserAccount = { 
                nickname: cleanNickname, 
                phone: '', 
                password: '0000', 
                isVerified: true,
                avatar: `https://ui-avatars.com/api/?name=${cleanNickname.replace('@', '')}&background=random&color=fff`
            };
            
            await authService.registerUser(newUser);
            // Notifica sucesso para a página de login atualizar a lista
            onLoginSuccess(newUser);
            setNickname('');
            onClose();
        } catch (err: any) { 
            // O erro agora é garantido como string pelo authService
            setError(err.message || "Erro desconhecido"); 
            setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"><X size={24} /></button>
                
                <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserPlus size={40} className="text-white" />
                </div>

                <div className="p-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Novo Perfil</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">Digite seu nome de jurado</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-1 tracking-[0.2em]">Apelido do Jurado</label>
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="@SeuNome" 
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl dark:text-white outline-none transition-all font-bold text-lg shadow-inner" 
                                value={nickname} 
                                onChange={e => setNickname(e.target.value)} 
                            />
                            {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-bounce mt-2">{error}</p>}
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest">Adicionar e Sair</span>
                                    <Check size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
