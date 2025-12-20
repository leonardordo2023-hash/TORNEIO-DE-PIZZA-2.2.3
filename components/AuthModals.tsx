
import React, { useState } from 'react';
import { X, UserPlus, Loader2, Check, PlusCircle, MinusCircle } from 'lucide-react';
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
    const [names, setNames] = useState<string[]>(['']);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const addField = () => {
        if (names.length < 10) {
            setNames([...names, '']);
        }
    };

    const removeField = (index: number) => {
        if (names.length > 1) {
            const newNames = names.filter((_, i) => i !== index);
            setNames(newNames);
        }
    };

    const updateName = (index: number, value: string) => {
        const newNames = [...names];
        newNames[index] = value;
        setNames(newNames);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const validNames = names.map(n => n.trim()).filter(n => n !== '');
        
        if (validNames.length === 0) {
            setError('Digite pelo menos um nome.');
            return;
        }

        const shortNames = validNames.filter(n => n.length < 2);
        if (shortNames.length > 0) {
            setError('Todos os nomes devem ter pelo menos 2 letras.');
            return;
        }

        setIsLoading(true);
        try {
            let lastUserCreated: UserAccount | null = null;

            for (const name of validNames) {
                const cleanName = name.replace('@', '');
                const nickname = `@${cleanName}`;
                
                const newUser: UserAccount = { 
                    nickname: nickname, 
                    phone: '', 
                    password: '0000', 
                    isVerified: true,
                    avatar: `https://ui-avatars.com/api/?name=${cleanName}&background=random&color=fff&bold=true`
                };
                
                await authService.registerUser(newUser);
                lastUserCreated = newUser;
            }
            
            // Se criou vários, loga com o último ou apenas fecha
            if (lastUserCreated) {
                onLoginSuccess(lastUserCreated);
            }
            
            setNames(['']);
            onClose();
        } catch (err: any) { 
            setError(err.message || "Erro ao criar perfis"); 
            setIsLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-10"><X size={24} /></button>
                
                <div className="h-20 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <UserPlus size={32} className="text-white" />
                </div>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Novos Jurados</h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">Adicione até 10 pessoas de uma vez</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {names.map((name, index) => (
                                <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-sm">@</span>
                                        <input 
                                            type="text" 
                                            autoFocus={index === names.length - 1}
                                            placeholder="Nome do Jurado" 
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl dark:text-white outline-none transition-all font-bold text-sm shadow-inner" 
                                            value={name} 
                                            onChange={e => updateName(index, e.target.value)} 
                                        />
                                    </div>
                                    {names.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeField(index)}
                                            className="p-3 text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <MinusCircle size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {names.length < 10 && (
                            <button 
                                type="button"
                                onClick={addField}
                                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:border-indigo-500 transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <PlusCircle size={16} /> Adicionar outro nome
                            </button>
                        )}

                        {error && <p className="text-red-500 text-[10px] font-black text-center uppercase tracking-widest animate-bounce mt-2">{error}</p>}

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span className="uppercase tracking-widest">Criar Todos ({names.filter(n => n.trim() !== '').length})</span>
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
