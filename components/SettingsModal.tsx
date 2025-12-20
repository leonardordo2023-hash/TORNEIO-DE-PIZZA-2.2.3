
import React, { useState, useRef, useEffect } from 'react';
import { X, Globe, Settings as SettingsIcon, Loader2, Download, Upload, Database, ChevronRight, ArrowLeft, Palette, Sun, Moon, Check, HardDrive, Smartphone, Zap, History, Save, Trash2, RotateCcw, Droplet, Star, Sparkles, Leaf, Cloud, CloudOff, AlertCircle, Copy, RefreshCw, Bell } from 'lucide-react';
import { UserAccount, PizzaData, SocialData } from '../types';
import { Language, translations } from '../services/translations';
import { databaseService } from '../services/databaseService';
import { backupService } from '../services/backupService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserAccount | null;
    onUpdateUser: (user: UserAccount) => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    currentTheme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
    pizzas: PizzaData[];
    socialData: SocialData;
    installPrompt?: any;
    onInstall?: () => void;
    onSimulateLevelUp: () => void;
    themeColor: 'default' | 'babyBlue' | 'pink' | 'lightPurple' | 'babyGreen';
    onThemeColorChange: (color: 'default' | 'babyBlue' | 'pink' | 'lightPurple' | 'babyGreen') => void;
    onForceSync?: () => Promise<void>;
}

type SettingsView = 'menu' | 'language' | 'backup' | 'theme' | 'cloud_status';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, currentUser, onUpdateUser, currentLanguage, onLanguageChange, currentTheme, onThemeChange, pizzas, socialData, installPrompt, onInstall, onSimulateLevelUp, themeColor, onThemeColorChange, onForceSync
}) => {
    const t = translations[currentLanguage];
    const [activeView, setActiveView] = useState<SettingsView>('menu');
    const [storageInfo, setStorageInfo] = useState<{ usage: number, quota: number } | null>(null);
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cloudStatus, setCloudStatus] = useState(databaseService.getCloudStatus());
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

    // ADMIN REAL: Apenas @programação
    const isAdmin = currentUser?.nickname.toLowerCase() === '@programação';

    useEffect(() => {
        if (isOpen) {
            setActiveView('menu');
            checkStorage();
            loadSnapshots();
            setCloudStatus(databaseService.getCloudStatus());
            if ("Notification" in window) setNotifPermission(Notification.permission);
        }
    }, [isOpen]);

    const checkStorage = async () => {
        const info = await databaseService.getStorageEstimate();
        setStorageInfo(info);
    };

    const loadSnapshots = async () => {
        const list = await databaseService.getSnapshots();
        setSnapshots(list.sort((a, b) => b.timestamp - a.timestamp));
    };

    const handleRequestNotifs = async () => {
        if (!("Notification" in window)) {
            alert("Este navegador não suporta notificações.");
            return;
        }
        const res = await Notification.requestPermission();
        setNotifPermission(res);
        if (res === "granted") {
            new Notification("Notificações Ativadas!", { body: "Você receberá avisos sobre o torneio aqui.", icon: './logo.png' });
        }
    };

    const handleForceSync = async () => {
        setIsSyncing(true);
        try {
            const cloudPizzas = await databaseService.getFromCloud('pizzas');
            const cloudSocial = await databaseService.getFromCloud('social_data');
            
            if (cloudPizzas) localStorage.setItem('pizzaGradeDataV2', JSON.stringify(cloudPizzas));
            if (cloudSocial) localStorage.setItem('pizza_social_data', JSON.stringify(cloudSocial));
            
            if (onForceSync) await onForceSync();
            
            alert("Restauração da Nuvem concluída com sucesso!");
            window.location.reload();
        } catch (e) {
            alert("Erro ao sincronizar dados da nuvem.");
        } finally {
            setIsSyncing(false);
        }
    };

    if (!isOpen) return null;

    const SQL_SCRIPT = `
-- 1. Criar tabelas fundamentais
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  nickname TEXT PRIMARY KEY,
  phone TEXT,
  password TEXT,
  avatar TEXT,
  cover TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para persistência de Fotos Binárias (Base64)
CREATE TABLE IF NOT EXISTS public.media_registry (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;

-- 3. Habilitar RLS e criar políticas
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total anonimo app_state" ON public.app_state FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total anonimo users" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE public.media_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso total anonimo media_registry" ON public.media_registry FOR ALL TO anon USING (true) WITH CHECK (true);
`.trim();

    const handleCopySQL = () => {
        navigator.clipboard.writeText(SQL_SCRIPT);
        alert("Script SQL copiado! Cole no SQL Editor do Supabase.");
    };

    const handleCreateSnapshot = async () => {
        const name = prompt("Dê um nome para este ponto de restauração:", `Backup ${new Date().toLocaleString()}`);
        if (!name) return;
        setIsCreatingSnapshot(true);
        const state = backupService.getCurrentAppState();
        await databaseService.createSnapshot(name, state);
        await loadSnapshots();
        setIsCreatingSnapshot(false);
    };

    const handleRestoreSnapshot = (snapshot: any) => {
        if (confirm(`Restaurar para "${snapshot.name}"?`)) {
            backupService.applyRestore(snapshot.data);
        }
    };

    const handleDeleteSnapshot = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Excluir backup permanentemente?")) {
            await databaseService.deleteSnapshot(id);
            await loadSnapshots();
        }
    };

    const MenuItem = ({ icon: Icon, label, onClick, subLabel, highlight, danger }: { icon: any, label: string, onClick: () => void, subLabel?: string, highlight?: boolean, danger?: boolean }) => (
        <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-xl border shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group ${highlight ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : danger ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${highlight ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300' : danger ? 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}><Icon size={18} /></div>
                <div className="text-left">
                    <span className={`block text-sm font-bold ${highlight ? 'text-indigo-700 dark:text-indigo-300' : danger ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>{label}</span>
                    {subLabel && <span className={`text-[10px] font-medium ${highlight ? 'text-indigo-500 dark:text-indigo-400' : danger ? 'text-red-500' : 'text-slate-400'}`}>{subLabel}</span>}
                </div>
            </div>
            <ChevronRight size={16} className={`transition-all ${highlight ? 'text-indigo-500' : danger ? 'text-red-500' : 'text-slate-400 group-hover:text-indigo-500'}`} />
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative animate-in zoom-in-95 duration-200 h-[620px]" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-2">
                        {activeView !== 'menu' && (
                            <button onClick={() => setActiveView('menu')} className="mr-1 p-1 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
                        )}
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {activeView === 'cloud_status' ? 'Status da Nuvem' : activeView === 'backup' ? 'Armazenamento' : activeView === 'theme' ? t.appearance : activeView === 'language' ? t.language : t.settings}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-colors"><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeView === 'menu' && (
                        <div className="space-y-3">
                            <MenuItem 
                                icon={Bell} 
                                label="Notificações no Celular" 
                                subLabel={notifPermission === "granted" ? "Ativadas ✅" : "Clique para Ativar 🔔"} 
                                onClick={handleRequestNotifs} 
                                highlight={notifPermission !== "granted"} 
                            />
                            {isAdmin && (
                                <MenuItem icon={AlertCircle} label="Configurar Supabase" subLabel="Atualizar Script SQL" onClick={() => setActiveView('cloud_status')} danger={!cloudStatus.isReady} highlight={!cloudStatus.isReady} />
                            )}
                            {isAdmin && (
                                <MenuItem icon={RefreshCw} label="Restaurar da Nuvem" subLabel={isSyncing ? "Restaurando..." : "Forçar download total da nuvem"} onClick={handleForceSync} highlight={true} />
                            )}
                            {installPrompt && <MenuItem icon={Smartphone} label="Instalar Aplicativo" subLabel="Acesso rápido na tela inicial" onClick={() => onInstall?.()} highlight={true} />}
                            {isAdmin && <MenuItem icon={Zap} label="Simular Level Up" subLabel="Testar Animação de Nível" onClick={onSimulateLevelUp} highlight={true} />}
                            <MenuItem icon={Palette} label={t.appearance} subLabel="Cores e Tema" onClick={() => setActiveView('theme')} />
                            <MenuItem icon={Globe} label={t.language} subLabel={currentLanguage.toUpperCase()} onClick={() => setActiveView('language')} />
                            {isAdmin && <MenuItem icon={Database} label="Banco de Dados" subLabel="Backups e Restauração" onClick={() => setActiveView('backup')} />}
                        </div>
                    )}

                    {activeView === 'cloud_status' && isAdmin && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-2xl border border-orange-200 dark:border-orange-800">
                                <h3 className="text-sm font-black text-orange-700 dark:text-orange-300 uppercase mb-2">Correção de Permissão</h3>
                                <p className="text-xs text-orange-600 dark:text-orange-400 leading-relaxed">Se estiver recebendo erros de "Not Authorized" ou restrições de conflito, você precisa rodar este novo script que define corretamente a **PRIMARY KEY** e o **RLS**.</p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 ml-1">Script para o SQL Editor</h4>
                                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 relative group">
                                    <pre className="text-[8px] text-green-400 overflow-x-auto font-mono max-h-60">{SQL_SCRIPT}</pre>
                                    <button onClick={handleCopySQL} className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"><Copy size={14} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'backup' && isAdmin && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2"><History size={14}/> Snapshots Locais</h3>
                                    <button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">{isCreatingSnapshot ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}</button>
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {snapshots.length === 0 ? <p className="p-4 text-center text-[10px] text-slate-400">Nenhum snapshot.</p> : snapshots.map(s => (
                                        <div key={s.id} onClick={() => handleRestoreSnapshot(s)} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex justify-between items-center group">
                                            <div className="min-w-0 flex-1"><span className="block text-xs font-bold truncate text-slate-700 dark:text-slate-200">{s.name}</span><span className="text-[9px] text-slate-400">{new Date(s.timestamp).toLocaleString()}</span></div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><RotateCcw size={14} className="text-indigo-500" /><button onClick={(e) => handleDeleteSnapshot(e, s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'theme' && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 ml-1">Modo</h4>
                                <button onClick={() => onThemeChange('light')} className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${currentTheme === 'light' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex items-center gap-4"><div className="p-3 rounded-full bg-white border border-slate-200 text-orange-500"><Sun size={24} /></div><div className="text-left"><span className="block font-bold">{t.light}</span></div></div>{currentTheme === 'light' && <div className="bg-orange-500 text-white p-1 rounded-full"><Check size={16} /></div>}
                                </button>
                                <button onClick={() => onThemeChange('dark')} className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${currentTheme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                    <div className="flex items-center gap-4"><div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-indigo-400"><Moon size={24} /></div><div className="text-left"><span className="block font-bold">{t.dark}</span></div></div>{currentTheme === 'dark' && <div className="bg-indigo-500 text-white p-1 rounded-full"><Check size={16} /></div>}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeView === 'language' && (
                        <div className="space-y-3">
                            {['pt', 'es', 'en'].map((lang) => (
                                <button key={lang} onClick={() => onLanguageChange(lang as any)} className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border ${currentLanguage === lang ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 text-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-200'}`}><span className="font-bold uppercase text-sm">{lang === 'pt' ? '🇧🇷 Português' : lang === 'es' ? '🇪🇸 Español' : '🇺🇸 English'}</span>{currentLanguage === lang && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}</button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
