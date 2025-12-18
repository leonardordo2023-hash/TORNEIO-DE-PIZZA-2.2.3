
import React, { useState } from 'react';
import { X, User, Loader2, ArrowRight, Phone, Lock } from 'lucide-react';
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
    const [formData, setFormData] = useState({ nickname: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '').substring(0, 11);
        if (numbers.length > 10) return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
        if (numbers.length > 6) return numbers.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        if (numbers.length > 2) return numbers.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
        return numbers;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!formData.nickname.startsWith('@')) { setError(t.mustStartWithAt); return; }
        if (formData.password.length !== 4) { setError('A senha deve ter 4 dígitos.'); return; }
        if (formData.phone.length < 14) { setError('Telefone inválido.'); return; }

        setIsLoading(true);
        try {
            const newUser: UserAccount = { nickname: formData.nickname, phone: formData.phone, password: formData.password, isVerified: true };
            await authService.registerUser(newUser);
            authService.saveUser(newUser);
            onLoginSuccess(newUser);
            onClose();
        } catch (err) { 
            setError((err as Error).message); 
            setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                <div className="h-24 bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-md shadow-lg"><User size={32} className="text-white" /></div>
                </div>
                <div className="p-6">
                    <h2 className="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Criar Cadastro</h2>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">{t.nickname}</label>
                            <input type="text" placeholder="@SeuApelido" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Telefone</label>
                            <input type="tel" placeholder="(99) 99999-9999" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: formatPhone(e.target.value)})} maxLength={15} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 ml-1">Senha (4 números)</label>
                            <input type="password" placeholder="0000" maxLength={4} inputMode="numeric" className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl dark:text-white tracking-widest" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value.replace(/\D/g, '')})} />
                        </div>
                        {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{error}</p>}
                        <button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl flex justify-center gap-2 shadow-lg transition-all active:scale-95">{isLoading ? <Loader2 className="animate-spin" /> : <>{t.next} <ArrowRight size={18} /></>}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
