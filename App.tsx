import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PizzaData, getSum, MediaItem, SocialData, Comment, Reply, UserAccount } from './types';
import { PizzaCard } from './components/PizzaCard';
import { UnifiedPhotoAlbum } from './components/UnifiedPhotoAlbum';
import { RankingTable } from './components/Charts';
import { NewsFeed } from './components/NewsFeed';
import { RulesPage } from './components/RulesPage';
import { AuthPage } from './components/AuthPage'; 
import { AberturaPage } from './components/AberturaPage';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { RulesModal } from './components/RulesModal';
import { CalendarModal } from './components/CalendarModal';
import { ProfilePage } from './components/ProfilePage';
import { DynamicsPage } from './components/DynamicsPage';
import { LevelUpModal } from './components/LevelUpModal';
import { VotingSimulation } from './components/VotingSimulation';
import { authService } from './services/authService';
import { databaseService } from './services/databaseService';
import { securityService } from './services/securityService';
import { calculateUserLevel } from './services/gamificationUtils';
import { Language, translations } from './services/translations';
import { supabase } from './services/supabaseClient';
import { 
    initializeP2P, broadcastVote, broadcastGlobalNote, broadcastReset, broadcastDelete, broadcastAddPizza,
    broadcastMedia, broadcastDeleteMedia, broadcastDate, broadcastMediaUpdate,
    broadcastComment, broadcastCommentEdit, broadcastCommentDelete, broadcastReaction, broadcastCommentReaction,
    broadcastReply, broadcastReplyEdit, broadcastReplyDelete, broadcastReplyReaction, broadcastPollVote, forceManualSync, broadcastConfirmVote,
    broadcastAppNotification, broadcastPresence, broadcastUserUpdate
} from './services/p2pService';
import { Trophy, Plus, User, Bell, Loader2, LogOut, Settings as SettingsIcon, ScrollText, BookOpen, Database, RefreshCw, MessageCircle, Newspaper, ImageIcon, Calendar, BarChart2, Grid, Gamepad2, X, Pizza, Cake, Check, Clock, Leaf, Sparkles, Wifi, WifiOff, Users, HelpCircle, Megaphone, Play, AlertTriangle, CloudOff, Lock, Unlock, Maximize, Smartphone, Monitor, MonitorSmartphone, PlayCircle, Trash2, Award } from 'lucide-react';
import { LOGO_BASE64 } from './constants';

const INITIAL_PI_IDS = [7, 8, 9, 10, 13, 14, 16, 21, 22, 28, 39, 42, 50];

const PIZZA_OWNERS: Record<number, string> = {
    22: "Programação"
};

export interface AppNotification {
    id: string; title: string; message: string; timestamp: number; read: boolean;
    targetTab: 'news' | 'rules' | 'dynamics' | 'album' | 'dates' | 'grid_salgada' | 'history' | 'avisos';
}

const ToastNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none w-[90%] max-w-xs">
        <div className="bg-slate-900/95 dark:bg-white/95 glass text-white dark:text-slate-900 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
            <div className="bg-green-500 rounded-full p-1.5 shrink-0"><Bell size={14} className="text-white fill-white" /></div>
            <span className="font-bold text-xs leading-tight">{message}</span>
        </div>
    </div>
);

const App: React.FC = () => {
  const [showAbertura, setShowAbertura] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('pizza_theme') as any) || 'light');
  const [themeColor, setThemeColor] = useState<'default' | 'babyBlue' | 'pink' | 'lightPurple' | 'babyGreen'>(() => (localStorage.getItem('pizza_theme_color') as any) || 'default');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('pizza_language') as any) || 'pt');
  const [uiScale, setUiScale] = useState<number>(() => Number(localStorage.getItem('pizza_ui_scale')) || 1);
  const [showScaleMenu, setShowScaleMenu] = useState(false);
  const scaleMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale * 16}px`;
    localStorage.setItem('pizza_ui_scale', uiScale.toString());
  }, [uiScale]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(1);
  const previousLevelRef = useRef<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [gridMode, setGridMode] = useState<'salgada' | 'doce'>('salgada');
  const [triggerRankReveal, setTriggerRankReveal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [peerCount, setPeerCount] = useState<number>(1);
  const [onlineNicknames, setOnlineNicknames] = useState<Record<string, {nickname: string, lastSeen: number}>>({});
  const [cloudReady, setCloudReady] = useState(databaseService.getCloudStatus().isReady);
  
  const [isVotingReleased, setIsVotingReleased] = useState(false);

  const [isNavManuallyHidden, setIsNavManuallyHidden] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [showSubMenu, setShowSubMenu] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
      try { const saved = localStorage.getItem('pizza_notifications'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  
  // ADMIN REAL: Apenas @programação
  const isAdmin = currentUser?.nickname.toLowerCase() === '@programação';
  // PODE POSTAR: Admin ou @Leonardo
  const canPost = isAdmin || currentUser?.nickname.toLowerCase() === '@leonardo';

  const isSyncingRef = useRef(false);
  const cloudSaveTimeouts = useRef<Record<string, number>>({});
  const processedNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, []);

  const triggerSystemNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
        const cleanMsg = body.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*/g, '');
        try {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: cleanMsg,
                    icon: './logo.png',
                    badge: './logo.png',
                    vibrate: [200, 100, 200],
                    tag: 'pizza-update-' + Date.now(),
                    renotify: true
                } as any);
            });
        } catch (e) {
            new Notification(title, { body: cleanMsg, icon: './logo.png' });
        }
    }
  };

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); forceManualSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => { securityService.safeSetItem('pizza_notifications', JSON.stringify(securityService.deepClean(notifications))); }, [notifications]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { 
          if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) setShowNotificationMenu(false);
          if (scaleMenuRef.current && !scaleMenuRef.current.contains(event.target as Node)) setShowScaleMenu(false);
          const navElement = document.querySelector('.group\\/nav');
          if (navElement && !navElement.contains(event.target as Node)) setShowSubMenu(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
      const handleGlobalDoubleClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
          setIsNavManuallyHidden(prev => !prev);
      };
      window.addEventListener('dblclick', handleGlobalDoubleClick);
      return () => window.removeEventListener('dblclick', handleGlobalDoubleClick);
  }, []);

  const addAppNotification = (title: string, message: string, targetTab: AppNotification['targetTab'], id?: string) => {
      const notifId = id || Math.random().toString(36).substring(2, 9);
      if (processedNotifIds.current.has(notifId)) return;
      processedNotifIds.current.add(notifId);

      const newNotif: AppNotification = { id: notifId, title, message, timestamp: Date.now(), read: false, targetTab };
      setNotifications(prev => {
          if (prev.length > 0 && prev[0].message === message && (Date.now() - prev[0].timestamp < 2000)) return prev;
          return [newNotif, ...prev].slice(0, 30);
      });
  };

  const handleNotificationClick = (notif: AppNotification) => {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      setShowNotificationMenu(false);
      if (notif.targetTab === 'dates' && isAdmin) setShowCalendarModal(true);
      else if (notif.targetTab === 'rules') setShowRulesModal(true);
      else if (notif.targetTab === 'history') setShowHistory(true);
      else if (notif.targetTab === 'dynamics') setActiveTab('dynamics');
      else if (notif.targetTab === 'news') setActiveTab('news');
      else if (notif.targetTab === 'avisos') setActiveTab('avisos');
      else if (notif.targetTab === 'album') setActiveTab('album' as any);
      else if (notif.targetTab === 'grid_salgada') { setActiveTab('grid_salgada'); setGridMode('salgada'); }
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearNotifications = () => {
    if (notifications.length === 0) return;
    if (confirm("Deseja apagar todo o histórico de notificações?")) {
        setNotifications([]);
        processedNotifIds.current.clear();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    securityService.safeSetItem('pizza_theme', theme);
  }, [theme]);

  useEffect(() => { 
    securityService.safeSetItem('pizza_theme_color', themeColor); 
    securityService.safeSetItem('pizza_language', language); 
  }, [themeColor, language]);

  const [socialData, setSocialData] = useState<SocialData>(() => {
    try {
        const saved = localStorage.getItem('pizza_social_data');
        if (saved) {
             const parsed = JSON.parse(saved);
             const comments = parsed.comments || {};
             Object.keys(comments).forEach(key => {
                 comments[key] = (comments[key] || []).map((c: any) => ({ ...c, id: c.id || Math.random().toString(36).substring(2, 9), reactions: c.reactions || {}, replies: c.replies || [] }));
             });
             return { likes: parsed.likes || {}, comments: comments };
        }
    } catch (e) {}
    return { likes: {}, comments: {} };
  });

  const [pizzas, setPizzas] = useState<PizzaData[]>(() => {
    let finalData: PizzaData[] = [];
    try {
      const saved = localStorage.getItem('pizzaGradeDataV2');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) finalData = parsed;
      }
    } catch (e) {}
    const existingIds = new Set(finalData.map(p => String(p.id)));
    const missingIds = INITIAL_PI_IDS.filter(id => !existingIds.has(String(id)));
    if (missingIds.length > 0 || finalData.length === 0) {
        const defaults = INITIAL_PI_IDS.map(id => {
            const existing = finalData.find(f => String(f.id) === String(id));
            return existing || { id, beautyScores: {}, tasteScores: {}, beautyScoresDoce: {}, tasteScoresDoce: {}, bonusScores: {}, bonusScoresDoce: {}, confirmedVotes: {}, userNotes: {}, notes: '', media: [], scheduledDate: '' };
        });
        finalData = defaults;
    }
    return finalData;
  });

  const [isDbReady, setIsDbReady] = useState(false);
  const debouncedCloudSave = (key: string, data: any) => {
      if (cloudSaveTimeouts.current[key]) clearTimeout(cloudSaveTimeouts.current[key]);
      cloudSaveTimeouts.current[key] = window.setTimeout(() => {
          if (!isSyncingRef.current) {
              const dataToSave = key === 'pizzas' ? securityService.slimPizzas(data) : data;
              databaseService.saveToCloud(key, securityService.deepClean(dataToSave));
              setCloudReady(databaseService.getCloudStatus().isReady);
          }
      }, 2000);
  };

  const hydratePizzas = (slimPizzas: PizzaData[], mediaDict: Record<string, string>) => {
      return slimPizzas.map(p => ({
          ...p,
          media: p.media?.map(m => ({ ...m, url: m.url || mediaDict[m.id] || "" }))
      }));
  };

  const pizzasRef = useRef(pizzas); 
  const socialDataRef = useRef(socialData); 
  const currentUserRef = useRef<UserAccount | null>(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  useEffect(() => {
    const initCloud = async () => {
        await databaseService.init();
        const allArchivedMedia = await databaseService.getAllMedia();
        const mediaDict: Record<string, string> = {};
        allArchivedMedia.forEach(m => { mediaDict[m.id] = m.url; });
        isSyncingRef.current = true;
        let cloudPizzas = await databaseService.getFromCloud('pizzas');
        const cloudSocial = await databaseService.getFromCloud('social_data');
        
        setIsVotingReleased(false);

        if (cloudPizzas && Array.isArray(cloudPizzas)) {
            const missingMediaIds: string[] = [];
            cloudPizzas.forEach((p: PizzaData) => { p.media?.forEach(m => { if (!m.url && !mediaDict[m.id]) missingMediaIds.push(m.id); }); });
            if (missingMediaIds.length > 0) { const remoteMedia = await databaseService.getMediaFromCloud(missingMediaIds); Object.assign(mediaDict, remoteMedia); }
            cloudPizzas = hydratePizzas(cloudPizzas, mediaDict); setPizzas(cloudPizzas);
            securityService.safeSetItem('pizzaGradeDataV2', JSON.stringify(securityService.slimPizzas(cloudPizzas)));
        } else { setPizzas(prev => hydratePizzas(prev, mediaDict)); }
        if (cloudSocial) { setSocialData(cloudSocial); securityService.safeSetItem('pizza_social_data', JSON.stringify(cloudSocial)); }

        setIsDbReady(true); isSyncingRef.current = false; setCloudReady(databaseService.getCloudStatus().isReady);
        
        const channel = supabase.channel('app_global_sync')
            .on('broadcast', { event: 'notification' }, (payload) => {
                const p = payload.payload; const cleanMsg = p.message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*/g, '');
                addAppNotification(p.title, p.message, p.targetTab, p.id); triggerGlobalNotification(p.title + ": " + cleanMsg); triggerSystemNotification(p.title, cleanMsg);
            })
            .on('broadcast', { event: 'full_sync' }, (payload) => {
                const { pizzas: incoming, socialData: incomingSocial, votingReleased: incomingVR } = payload.payload;
                isSyncingRef.current = true; const hydratedIncoming = hydratePizzas(incoming, mediaDict);
                setPizzas(hydratedIncoming); setSocialData(incomingSocial);
                if (incomingVR !== undefined) setIsVotingReleased(!!incomingVR);
                setTimeout(() => { isSyncingRef.current = false; }, 500);
            })
            .subscribe();
        initializeP2P({
            onVoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, [p.field]: p.value === -1 ? (()=>{const s={...pz[p.field]};delete s[p.userId];return s})() : { ...pz[p.field], [p.userId]: p.value } } : pz)),
            onVoteConfirm: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, confirmedVotes: { ...pz.confirmedVotes, [p.userId]: p.status } } : pz)),
            onGlobalNoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, notes: p.note } : pz)),
            onFullSync: (p) => { isSyncingRef.current = true; setPizzas(p.pizzas); setSocialData(p.socialData); if(p.users) authService.mergeUsers(p.users); setTimeout(() => isSyncingRef.current = false, 1000); },
            onPeerCountChange: setPeerCount,
            onReset: () => window.location.reload(),
            onDelete: (id) => setPizzas(prev => prev.filter(p => p.id !== id)),
            onAddPizza: (p) => setPizzas(prev => [...prev, p.pizza]),
            onMediaAdd: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: [...(pz.media || []), p.mediaItem] } : pz)),
            onMediaUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.map(m => m.id === p.mediaId ? { ...m, caption: p.caption } : m) } : pz)),
            onMediaDelete: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.filter(m => m.id !== p.mediaId) } : pz)),
            onPollVoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.map(m => m.id === p.mediaId ? { ...m, poll: { ...m.poll!, votes: { ...m.poll!.votes, [p.userId]: p.selectedOptions } } } : m) } : pz)),
            onDateUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, scheduledDate: p.date } : pz)),
            onCommentAdd: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: [...(prev.comments[p.mediaId] || []), p.comment] } })),
            onCommentEdit: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, text: p.newText } : c) } })),
            onCommentDelete: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).filter(c => c.id !== p.commentId) } })),
            onReactionUpdate: (p) => setSocialData(prev => { const curr = prev.likes[p.mediaId] || {}; return { ...prev, likes: { ...prev.likes, [p.mediaId]: { ...curr, [p.userId]: curr[p.userId] === p.emoji ? undefined : p.emoji } as any } }; }),
            onCommentReactionUpdate: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, reactions: { ...c.reactions, [p.userId]: p.emoji } } : c) } })),
            onReplyAdd: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: [...(prev.comments[p.mediaId] || []), p.reply] } })),
            onReplyEdit: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, replies: (c.replies || []).map(r => r.id === p.replyId ? { ...r, text: p.newText } : r) } : c) } })),
            onReplyDelete: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, replies: (c.replies || []).filter(r => r.id !== p.replyId) } : c) } })),
            onReplyReactionUpdate: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, replies: (c.replies || []).map(r => r.id === p.replyId ? { ...r, reactions: { ...r.reactions, [p.userId]: p.emoji } } : r) } : c) } })),
            onResetUserXP: (p) => { if (p.targetNickname === 'ALL' || p.targetNickname === currentUserRef.current?.nickname) { window.location.reload(); } },
            onUserUpdate: (p) => authService.mergeUsers([p]),
            onAppNotification: (p) => { const cleanMsg = p.message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*/g, ''); addAppNotification(p.title, p.message, p.targetTab as any); triggerGlobalNotification(p.title + ": " + cleanMsg); triggerSystemNotification(p.title, cleanMsg); },
            onPresence: (p, pid) => setOnlineNicknames(prev => ({ ...prev, [pid]: { nickname: p.nickname, lastSeen: Date.now() } })),
            getCurrentState: () => ({ pizzas: pizzasRef.current, socialData: socialDataRef.current, users: authService.getUsers() })
        });
        return () => { supabase.removeChannel(channel); };
    };
    initCloud();
  }, []);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [userId, setUserId] = useState('');
  useEffect(() => { setUserId(currentUser?.nickname || ''); }, [currentUser]);

  const handleLoginSuccess = (user: UserAccount) => { setCurrentUser(user); setIsLevelInitialized(false); setActiveTab('news'); };
  const handleUpdateUser = (updated: UserAccount) => setCurrentUser(updated);
  const handleLogout = () => { authService.logout(); setCurrentUser(null); setIsLevelInitialized(false); setActiveTab('news'); };

  useEffect(() => {
    if (isDbReady && !isSyncingRef.current) { debouncedCloudSave('social_data', socialData); databaseService.saveBackup('social_data', socialData); securityService.safeSetItem('pizza_social_data', JSON.stringify(securityService.deepClean(socialData))); }
  }, [socialData, isDbReady]);

  const [activeTab, setActiveTab] = useState<'news' | 'avisos' | 'rules' | 'grid_salgada' | 'grid_doce' | 'charts' | 'album' | 'calendar' | 'history' | 'dynamics' | 'profile'>('news');
  const [gridSort, setGridSort] = useState<'asc' | 'desc' | 'rank'>('asc');
  
  const triggerGlobalNotification = (message: string) => { if (showSettingsModal) return; setToastMessage(message); try { const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3'); audio.volume = 0.4; audio.play().catch(() => {}); } catch {} setTimeout(() => setToastMessage(null), 4000); };

  useEffect(() => {
    pizzasRef.current = pizzas;
    if (isDbReady && !isSyncingRef.current) { debouncedCloudSave('pizzas', pizzas); databaseService.saveBackup('pizzas', pizzas); securityService.safeSetItem('pizzaGradeDataV2', JSON.stringify(securityService.slimPizzas(pizzas))); }
  }, [pizzas, isDbReady]);

  const [isLevelInitialized, setIsLevelInitialized] = useState(false);
  useEffect(() => {
      if (!currentUser) return; const stats = calculateUserLevel(currentUser, pizzas, socialData, PIZZA_OWNERS);
      if (!isLevelInitialized) { previousLevelRef.current = stats.level; setIsLevelInitialized(true); } 
      else if (stats.level > previousLevelRef.current) { setLevelUpLevel(stats.level); setShowLevelUpModal(true); previousLevelRef.current = stats.level; }
  }, [pizzas, socialData, currentUser, isLevelInitialized]);

  const handleNavClick = (tabId: string) => { 
    if ((tabId === 'calendar' || tabId === 'charts') && !isAdmin) return; 
    
    if (tabId === 'profile') { setShowProfilePage(true); return; }
    if (tabId === 'history') { setShowHistory(true); return; }
    if (tabId === 'rules') { setShowRulesModal(true); return; }

    setActiveTab(tabId as any); 
    if (tabId === 'grid_salgada') setGridMode('salgada'); 
    if (tabId === 'grid_doce') setGridMode('doce'); 
  };

  const sortedGridPizzas = useMemo(() => {
      const sorted = [...pizzas]; const sortNumeric = (a: PizzaData, b: PizzaData) => parseFloat(String(a.id)) - parseFloat(String(b.id));
      if (gridSort === 'asc') return sorted.sort(sortNumeric); if (gridSort === 'desc') return sorted.sort((a, b) => sortNumeric(b, a));
      return sorted.sort((a, b) => {
          const scoreA = gridMode === 'salgada' ? getSum(a.beautyScores) + getSum(a.tasteScores) : getSum(a.beautyScoresDoce) + getSum(a.tasteScoresDoce);
          const scoreB = gridMode === 'salgada' ? getSum(b.beautyScores) + getSum(b.tasteScores) : getSum(b.beautyScoresDoce) + getSum(b.tasteScoresDoce);
          return scoreB - scoreA;
      });
  }, [pizzas, gridSort, gridMode]);

  const rankMap = useMemo(() => {
    const stats = pizzas.map(p => ({ id: p.id, score: gridMode === 'salgada' ? getSum(p.beautyScores) + getSum(p.tasteScores) : getSum(p.beautyScoresDoce) + getSum(p.tasteScoresDoce) })).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    const map: Record<string, number> = {}; stats.forEach((s, idx) => map[String(s.id)] = idx + 1); return map;
  }, [pizzas, gridMode]);

  const syncAndBroadcast = (updatedPizzas: PizzaData[], updatedSocial?: SocialData, updatedVR?: boolean) => {
      setPizzas(updatedPizzas); if (updatedSocial) setSocialData(updatedSocial);
      if (updatedVR !== undefined) { setIsVotingReleased(updatedVR); databaseService.saveToCloud('voting_released', updatedVR); }
      supabase.channel('app_global_sync').send({ type: 'broadcast', event: 'full_sync', payload: { pizzas: updatedPizzas, socialData: updatedSocial || socialData, votingReleased: updatedVR !== undefined ? updatedVR : isVotingReleased } });
      databaseService.saveBackup('pizzas', updatedPizzas); if (updatedSocial) databaseService.saveBackup('social_data', updatedSocial);
  };

  const handleUpdateScore = (id: any, field: any, value: any) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, [field]: value === -1 ? (()=>{const s={...p[field]};delete s[userId];return s})() : { ...p[field], [userId]: value }, confirmedVotes: (()=>{const c={...p.confirmedVotes};delete c[userId];return c})() } : p);
      syncAndBroadcast(updated); broadcastVote({ pizzaId: id, userId, field, value }); 
  };

  const handleConfirmVote = (id: any) => { 
      const currentlyConfirmed = pizzas.find(p => p.id === id)?.confirmedVotes?.[userId];
      const newState = !currentlyConfirmed; const updated = pizzas.map(p => p.id === id ? { ...p, confirmedVotes: { ...p.confirmedVotes, [userId]: newState } } : p);
      syncAndBroadcast(updated); broadcastConfirmVote({ pizzaId: id, userId, status: newState }); if (newState) triggerGlobalNotification("Voto Confirmado na Pizza #" + id);
  };

  const handleAdminClearTable = async () => {
      if (!isAdmin) return;
      if (confirm("ADMIN: Deseja LIMPAR TODAS as notas? XP e Nível serão preservados.")) {
          if (confirm("Confirmar limpeza total?")) {
              try {
                  const allUsers = authService.getUsers(); const updatedPizzas = pizzas.map(p => ({ ...p, beautyScores: {}, tasteScores: {}, beautyScoresDoce: {}, tasteScoresDoce: {}, confirmedVotes: {} }));
                  for (const user of allUsers) {
                      const currentStats = calculateUserLevel(user, pizzas, socialData, PIZZA_OWNERS);
                      const xpToPreserve = (currentStats.rawProgress - (typeof user.xpOffset === 'number' ? user.xpOffset : 0));
                      const pointsToPreserve = (currentStats.totalDisplayPointsRaw - (typeof user.pointsOffset === 'number' ? user.pointsOffset : 0));
                      if (xpToPreserve > 0 || pointsToPreserve > 0) {
                          const updatedUser = await authService.updateUser(user.nickname, { xpOffset: (user.xpOffset || 0) - xpToPreserve, pointsOffset: (user.pointsOffset || 0) - pointsToPreserve });
                          broadcastUserUpdate(updatedUser);
                      }
                  }
                  syncAndBroadcast(updatedPizzas); alert("Planilha limpa com sucesso!");
              } catch (e) { alert("Erro ao realizar limpeza."); }
          }
      }
  };

  const handleUpdateNote = (id: any, note: string) => setPizzas(prev => prev.map(p => p.id === id ? { ...p, userNotes: { ...p.userNotes, [userId]: note } } : p));
  const handleUpdateNoteGlobal = (id: any, note: string) => { const updated = pizzas.map(p => p.id === id ? { ...p, notes: note } : p); syncAndBroadcast(updated); broadcastGlobalNote({ pizzaId: id, note }); };
  
  const handleAddMedia = (id: any, item: MediaItem) => { 
    if (String(id) === '22') item.hiddenFromFeed = true;
    const updated = pizzas.map(p => p.id === id ? { ...p, media: [...(p.media || []), item] } : p);
    syncAndBroadcast(updated); if(isDbReady) databaseService.archiveMedia(item.id, item.url, item.type); broadcastMedia({ pizzaId: id, mediaItem: item }); 
    const section = item.hiddenFromFeed ? 'album' : (item.type === 'poll' ? 'avisos' : 'news');
    if (String(id) === '22') return;
    const notifId = Math.random().toString(36).substring(2, 9);
    const payload = { id: notifId, title: item.type === 'poll' ? 'Novo Aviso ⚠️' : 'Nova Notícia 🍕', message: item.caption || 'Confira o novo conteúdo postado!', targetTab: section };
    supabase.channel('app_global_sync').send({ type: 'broadcast', event: 'notification', payload });
    broadcastAppNotification(payload as any); addAppNotification(payload.title, payload.message, section as any, notifId); triggerSystemNotification(payload.title, payload.message);
  };

  const handleUpdateCaption = (id: any, mediaId: string, caption: string) => { const updated = pizzas.map(p => p.id === id ? { ...p, media: p.media?.map(m => m.id === mediaId ? { ...m, caption: caption } : m) } : p); syncAndBroadcast(updated); broadcastMediaUpdate({ pizzaId: id, mediaId, caption }); };
  
  // Helper to calculate interactions before deletion to preserve XP/Level
  const calculateLegacyInteractions = (mediaId: string, social: SocialData) => {
    const userStats: Record<string, { likes: number, comments: number }> = {};
    const getStats = (nick: string) => {
        if (!userStats[nick]) userStats[nick] = { likes: 0, comments: 0 };
        return userStats[nick];
    };
    const postLikes = social.likes[mediaId] || {};
    Object.keys(postLikes).forEach(nick => { if (postLikes[nick]) getStats(nick).likes += 1; });
    const comments = social.comments[mediaId] || [];
    const participants = new Set<string>();
    comments.forEach(c => {
        participants.add(c.user);
        Object.keys(c.reactions || {}).forEach(nick => { if (c.reactions[nick]) getStats(nick).likes += 1; });
        (c.replies || []).forEach(r => {
            participants.add(r.user);
            Object.keys(r.reactions || {}).forEach(nick => { if (r.reactions[nick]) getStats(nick).likes += 1; });
        });
    });
    participants.forEach(nick => { getStats(nick).comments += 1; });
    return userStats;
  };

  // Helper to persist interactions as legacy points
  const applyUserLegacyUpdates = async (interactions: Record<string, { likes: number, comments: number }>, allUsers: UserAccount[]) => {
    for (const [nickname, counts] of Object.entries(interactions)) {
        const user = allUsers.find(u => u.nickname === nickname);
        if (user) {
            const updated = await authService.updateUser(nickname, {
                legacyLikes: (user.legacyLikes || 0) + counts.likes,
                legacyComments: (user.legacyComments || 0) + counts.comments
            });
            broadcastUserUpdate(updated);
        }
    }
  };

  const handleDeleteMedia = async (id: any, mediaId: string) => { 
    if (!isAdmin) return; 
    const allUsers = authService.getUsers(); 
    const updatedSocial = { ...socialData }; 
    const interactions = calculateLegacyInteractions(mediaId, updatedSocial); 
    await applyUserLegacyUpdates(interactions, allUsers); 
    delete updatedSocial.likes[mediaId]; 
    delete updatedSocial.comments[mediaId]; 
    const updatedPizzas = pizzas.map(p => p.id === id ? { ...p, media: p.media?.filter(m => m.id !== mediaId) } : p); 
    syncAndBroadcast(updatedPizzas, updatedSocial); 
    broadcastDeleteMedia({ pizzaId: id, mediaId }); 
  };

  const handleAddComment = (mediaId: string, text: string) => { const c: Comment = { id: Math.random().toString(36).substring(2, 15), user: currentUser?.nickname || 'Juiz', text, date: new Date().toISOString(), reactions: {}, replies: [] }; const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: [...(socialData.comments[mediaId] || []), p.comment] } }; syncAndBroadcast(pizzas, updatedSocial); broadcastComment({ mediaId, comment: c }); };
  const handleMainReaction = (mediaId: string, emoji: string) => { const curr = socialData.likes[mediaId] || {}; const updatedSocial = { ...socialData, likes: { ...socialData.likes, [mediaId]: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any } }; syncAndBroadcast(pizzas, updatedSocial); broadcastReaction({ mediaId, userId, emoji }); };
  const handlePollVote = (pId: any, mId: any, opts: any) => { const updated = pizzas.map(p => p.id === pId ? { ...p, media: p.media?.map(m => m.id === mId ? { ...m, poll: { ...m.poll!, votes: { ...m.poll!.votes, [userId]: opts } } } : m) } : p); syncAndBroadcast(updated); broadcastPollVote({ pizzaId: pId, mediaId: mId, userId, selectedOptions: opts }); };
  const handleUpdateDate = (id: number | string, date: string) => { const updated = pizzas.map(p => p.id === id ? { ...p, scheduledDate: date } : p); syncAndBroadcast(updated); broadcastDate({ pizzaId: id, date }); };
  const handleDeletePizza = (id: number | string) => { if (window.confirm(t.deleteConfirm)) { const updated = pizzas.filter(p => p.id !== id); syncAndBroadcast(updated); broadcastDelete(id); } };
  const handleEditComment = (mediaId: string, commentId: string, newText: string) => { const updatedComments = (socialData.comments[mediaId] || []).map(c => c.id === commentId ? { ...c, text: newText } : c); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastCommentEdit({ mediaId, commentId, newText }); };
  const handleDeleteComment = (mediaId: string, commentId: string) => { const updatedComments = (socialData.comments[mediaId] || []).filter(c => c.id !== commentId); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastCommentDelete({ mediaId, commentId }); };
  const handleCommentReaction = (mediaId: string, commentId: string, emoji: string) => { const updatedComments = (socialData.comments[mediaId] || []).map(c => { if (c.id === commentId) { const curr = c.reactions || {}; return { ...c, reactions: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any }; } return c; }); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastCommentReaction({ mediaId, commentId, userId, emoji }); };

  const handleReplyToComment = (mediaId: string, commentId: string, text: string) => { const r: Reply = { id: Math.random().toString(36).substring(2, 15), user: currentUser?.nickname || 'Juiz', text, date: new Date().toISOString(), reactions: {} }; const updatedComments = (socialData.comments[mediaId] || []).map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), r] } : c); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastReply({ mediaId, commentId, reply: r }); };
  const handleEditReply = (mediaId: string, commentId: string, replyId: string, newText: string) => { const updatedComments = (socialData.comments[mediaId] || []).map(c => { if (c.id === commentId) { return { ...c, replies: (c.replies || []).map(r => r.id === replyId ? { ...r, text: newText } : r) }; } return c; }); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastReplyEdit({ mediaId, commentId, replyId, newText }); };
  const handleDeleteReply = (mediaId: string, commentId: string, replyId: string) => { const updatedComments = (socialData.comments[mediaId] || []).map(c => { if (c.id === commentId) { return { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) } ; } return c; }); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastReplyDelete({ mediaId, commentId, replyId }); };
  const handleReplyReaction = (mediaId: string, commentId: string, replyId: string, emoji: string) => { const updatedComments = (socialData.comments[mediaId] || []).map(c => { if (c.id === commentId) { const updatedReplies = (c.replies || []).map(r => { if (r.id === replyId) { const curr = r.reactions || {}; return { ...r, reactions: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any }; } return r; }); return { ...c, replies: updatedReplies }; } return c; }); const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } }; syncAndBroadcast(pizzas, updatedSocial); broadcastReplyReaction({ mediaId, commentId, replyId, userId, emoji }); };
  const handleToggleVoting = () => { const newState = !isVotingReleased; syncAndBroadcast(pizzas, socialData, newState); const payload = { id: Math.random().toString(36).substring(2, 9), title: newState ? 'Votação Aberta! 🍕' : 'Votação Encerrada', message: newState ? 'As fichas de votação já estão disponíveis!' : 'Votação finalizada.', targetTab: newState ? 'grid_salgada' : 'news' }; supabase.channel('app_global_sync').send({ type: 'broadcast', event: 'notification', payload }); broadcastAppNotification(payload as any); addAppNotification(payload.title, payload.message, payload.targetTab as any); triggerSystemNotification(payload.title, payload.message); };
  const handleRevealComplete = (winnerData?: { id: string | number, score: number }) => { setTriggerRankReveal(false); if (winnerData && isAdmin) { const announcement: MediaItem = { id: "leader-notif-" + Date.now(), url: "", type: "news" as any, category: "pizza", date: Date.now(), caption: `🏆 LÍDER ATUAL\n🍕 Pizza #${winnerData.id}\n⭐ ${winnerData.score.toFixed(1)} pts`, hiddenFromFeed: false }; handleAddMedia(pizzas[0].id, announcement); } };
  
  const visibleTabs = useMemo(() => { 
    const base = ['news', 'avisos', 'grid_salgada', 'grid_doce', 'dynamics', 'album', 'profile']; 
    if (isAdmin) return [...base, 'charts', 'calendar']; 
    return base; 
  }, [isAdmin]);

  const handleBroadcastAlert = (section: string) => { const titles: Record<string, string> = { 'rules': t.rules, 'dynamics': t.dynamics, 'history': t.history, 'news': t.news, 'avisos': t.avisos, 'album': t.album, 'dates': t.dates }; const notifId = Math.random().toString(36).substring(2, 9); const payload = { id: notifId, title: titles[section] || 'Aviso', message: `Atualização importante em **${titles[section] || section}**!`, targetTab: section as any }; supabase.channel('app_global_sync').send({ type: 'broadcast', event: 'notification', payload }); broadcastAppNotification(payload as any); addAppNotification(payload.title, payload.message, section as any, notifId); triggerSystemNotification(payload.title, payload.message); };
  const getTabLabel = (id: string) => { const map: Record<string, string> = { grid_salgada: 'Salgada', grid_doce: 'Doce', charts: t.rankings, calendar: t.dates, news: t.news, avisos: t.avisos, rules: t.rules, dynamics: t.dynamics, album: t.album, history: t.history, profile: t.profile }; return map[id] || (t as any)[id] || id; };

  if (showAbertura) return <AberturaPage onFinish={() => setShowAbertura(false)} language={language} />;
  if (!currentUser) return <AuthPage onLoginSuccess={handleLoginSuccess} language={language} setLanguage={setLanguage} notifications={notifications} onlineNicknames={Object.values(onlineNicknames).map((v: any) => v.nickname)} />;

  const navEffectiveVisibility = !isNavManuallyHidden;

  return (
    <div className={`min-h-screen pb-20 relative transition-all duration-700 ${themeColor === 'babyBlue' ? 'theme-baby-blue-animate' : themeColor === 'pink' ? 'theme-pink-animate' : themeColor === 'lightPurple' ? 'theme-purple-animate' : themeColor === 'babyGreen' ? 'theme-green-animate' : 'bg-slate-50 dark:bg-slate-950'} overflow-x-hidden`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0"><div className="absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-orange-400/10 dark:bg-orange-600/5 rounded-full blur-[120px] animate-float opacity-70"></div><div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-500/10 dark:bg-indigo-700/5 rounded-full blur-[120px] animate-float-delayed opacity-70"></div><div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] bg-pink-400/5 dark:bg-pink-600/5 rounded-full blur-[100px] animate-pulse-slow"></div></div>
      {toastMessage && !showSettingsModal && <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      {isAdmin && (<div className={`${isVotingReleased ? 'bg-green-600' : 'bg-slate-900'} text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-between animate-in slide-in-from-top duration-500 z-[250] sticky top-0 border-b border-white/10 shadow-lg glass`}><div className="flex items-center gap-2">{isVotingReleased ? <Unlock size={12} className="animate-pulse" /> : <Lock size={12} />}<span>{isVotingReleased ? 'Votação Liberada' : 'Fichas Bloqueadas'}</span></div><button onClick={handleToggleVoting} className="bg-white text-slate-900 px-4 py-1.5 rounded-full hover:bg-slate-100 transition-all shadow-md active:scale-95 font-black uppercase text-[8px] tracking-tighter">{isVotingReleased ? 'Encerrar Votação' : 'Liberar para Jurados'}</button></div>)}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} currentUser={currentUser} onUpdateUser={handleUpdateUser} currentLanguage={language} onLanguageChange={setLanguage} currentTheme={theme} onThemeChange={setTheme} pizzas={pizzas} socialData={socialData} onSimulateLevelUp={() => { setLevelUpLevel(l => l >= 5 ? 1 : l + 1); setIsSimulating(true); setShowLevelUpModal(true); setShowSettingsModal(false); }} themeColor={themeColor} onThemeColorChange={setThemeColor} onForceSync={async () => { isSyncingRef.current = true; const cp = await databaseService.getFromCloud('pizzas'); const cs = await databaseService.getFromCloud('social_data'); const allArchivedMedia = await databaseService.getAllMedia(); const mediaDict: Record<string, string> = {}; allArchivedMedia.forEach(m => { mediaDict[m.id] = m.url; }); if (cp) { const hydratedPizzas = hydratePizzas(cp, mediaDict); setPizzas(hydratedPizzas); securityService.safeSetItem('pizzaGradeDataV2', JSON.stringify(securityService.slimPizzas(hydratedPizzas))); } if (cs) { setSocialData(cs); securityService.safeSetItem('pizza_social_data', JSON.stringify(cs)); } isSyncingRef.current = false; }} />
      {showProfilePage && <ProfilePage currentUser={currentUser} onUpdateUser={handleUpdateUser} onClose={() => setShowProfilePage(false)} pizzas={pizzas} socialData={socialData} language={language} pizzaOwners={PIZZA_OWNERS} />}
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onAlertAdmin={() => handleBroadcastAlert('history')} isAdmin={isAdmin} language={language} />
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} language={language} onAlertAdmin={() => handleBroadcastAlert('rules')} isAdmin={isAdmin} />
      <CalendarModal isOpen={showCalendarModal || (activeTab === 'calendar' && isAdmin)} onClose={() => { setShowCalendarModal(false); if (activeTab === 'calendar') setActiveTab('news'); }} language={language} isAdmin={isAdmin} onUpdateDateGlobal={handleUpdateDate} onAlertAdmin={() => handleBroadcastAlert('dates')} pizzas={pizzas} />
      {showLevelUpModal && <LevelUpModal newLevel={levelUpLevel} onClose={() => setShowLevelUpModal(false)} nickname={currentUser.nickname} onTestNextLevel={isSimulating ? () => setLevelUpLevel(prev => prev >= 5 ? 1 : prev + 1) : undefined} />}
      <VotingSimulation isOpen={showSimulation} onClose={() => setShowSimulation(false)} onNavigateToSalgada={() => { setActiveTab('grid_salgada'); setGridMode('salgada'); }} currentTab={activeTab} />
      
      <nav className={`sticky top-0 z-[240] pt-safe transition-all duration-500 bg-white/70 dark:bg-slate-900/70 glass border-b border-white/10 shadow-2xl backdrop-blur-md group/top-nav ${!navEffectiveVisibility ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex justify-between items-center relative">
          <div className="flex flex-col gap-0.5 w-1/3 relative">
            <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/30 px-2 py-1 rounded-full border border-slate-200/30 dark:border-slate-700/30 w-fit">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[8px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1 uppercase tracking-tighter">{isOnline ? t.online : t.offline} • <Users size={9} className="text-indigo-500" /> {peerCount}</span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><img src={LOGO_BASE64} alt="Logo" className="h-8 w-auto object-contain pointer-events-auto hover:scale-110 transition-transform cursor-pointer drop-shadow-md" onClick={() => isAdmin && setActiveTab('news')} /></div>
          <div className="flex items-center justify-end gap-1 w-1/3" ref={notificationMenuRef}>
            <div className="relative group" ref={scaleMenuRef}><button onClick={() => setShowScaleMenu(!showScaleMenu)} className="p-2 rounded-lg relative text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-all active:scale-90 hover:shadow-lg"><Maximize size={16} /></button>{showScaleMenu && (<div className="absolute top-full right-0 mt-2 w-48 bg-white/95 dark:bg-slate-900/95 glass rounded-xl shadow-5xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[300] animate-in slide-in-from-top-2"><div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50"><MonitorSmartphone size={12} className="text-indigo-500" /><h3 className="font-black text-[9px] uppercase text-slate-500 tracking-widest">Escala Global</h3></div><div className="p-1.5 space-y-1">{[ { label: 'Mini', scale: 0.85, icon: <Smartphone size={12}/> }, { label: 'Padrão', scale: 1, icon: <MonitorSmartphone size={12}/> }, { label: 'Grande', scale: 1.15, icon: <Monitor size={12}/> }, { label: 'Máximo', scale: 1.3, icon: <Maximize size={12}/> } ].map((opt) => (<button key={opt.scale} onClick={() => { setUiScale(opt.scale); setShowScaleMenu(false); }} className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-left ${uiScale === opt.scale ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}><div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase tracking-tight">{opt.label}</span></div>{uiScale === opt.scale && <Check size={12} />}</button>))}</div></div>)}</div>
            <div className="relative group"><button onClick={() => setShowNotificationMenu(!showNotificationMenu)} className="p-2 rounded-lg relative text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 transition-all active:scale-90 hover:shadow-lg"><Bell size={16} className={unreadCount > 0 ? "animate-wiggle" : ""} />{unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></span>}</button>{showNotificationMenu && (<div className="absolute top-full right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 glass rounded-xl shadow-5xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[300] animate-in slide-in-from-top-2"><div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50"><h3 className="font-black text-xs uppercase text-slate-500 tracking-widest">{t.comments}</h3><div className="flex gap-2"><button onClick={markAllRead} className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">Lidas</button><button onClick={clearNotifications} className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Limpar</button></div></div><div className="max-h-[250px] overflow-y-auto custom-scrollbar">{notifications.length === 0 ? <div className="p-8 text-center flex flex-col items-center gap-2 opacity-30"><Bell size={24}/><p className="text-[8px] font-black uppercase tracking-[0.2em]">Vazio</p></div> : notifications.map(n => (<button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full text-left p-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-2.5 relative ${!n.read ? 'bg-indigo-50/20' : ''}`}><div className="p-2 bg-indigo-600 text-white rounded-lg h-fit shadow-md"><Bell size={12} /></div><div className="min-w-0 flex-1"><h4 className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">{n.title}</h4><p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 font-medium leading-tight" dangerouslySetInnerHTML={{ __html: n.message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }}></p></div></button>))}</div></div>)}</div>
            <div className="relative group"><button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 relative hover:shadow-lg transition-all active:scale-90"><SettingsIcon size={16} /></button></div>
            <div className="relative group"><button onClick={handleLogout} className="p-2 rounded-lg text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 hover:shadow-lg transition-all active:scale-90"><LogOut size={16} /></button></div>
          </div>
        </div>
      </nav>

      <div className={`fixed bottom-3 sm:bottom-5 pb-safe left-1/2 -translate-x-1/2 z-[240] flex gap-0.5 glass p-0.5 rounded-[1.8rem] border border-white/40 dark:border-slate-800/40 bg-white/70 dark:bg-slate-900/70 shadow-4xl shadow-black/10 transition-all duration-500 transform w-[98%] max-w-[420px] sm:w-auto justify-center items-center group/nav ${!navEffectiveVisibility ? 'opacity-0 translate-y-32 pointer-events-none' : 'opacity-100 translate-y-0'}`} onMouseLeave={() => setHoveredTab(null)}>
        {visibleTabs.map(id => { 
          const isActive = activeTab === id || (id === 'grid_salgada' && (activeTab === 'grid_salgada' || activeTab === 'grid_doce')); 
          const isHovered = hoveredTab === id; 
          const shouldExpand = isActive || isHovered; 
          
          return (
            <div key={id} className="relative">
              {id === 'dynamics' && showSubMenu && (
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 flex flex-col gap-2 animate-in fade-in-up duration-300 pointer-events-auto">
                  <button onClick={() => { handleNavClick('rules'); setShowSubMenu(false); }} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 hover:scale-110 active:scale-95 transition-all border border-white/20">
                    <ScrollText size={18} strokeWidth={2.5} />
                    <span className="text-[9px] font-black uppercase whitespace-nowrap tracking-wider">Regras</span>
                  </button>
                  <button onClick={() => { handleNavClick('history'); setShowSubMenu(false); }} className="bg-indigo-600 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 hover:scale-110 active:scale-95 transition-all border border-white/20">
                    <BookOpen size={18} strokeWidth={2.5} />
                    <span className="text-[9px] font-black uppercase whitespace-nowrap tracking-wider">História</span>
                  </button>
                </div>
              )}

              <button 
                onClick={() => handleNavClick(id)} 
                onDoubleClick={() => id === 'dynamics' && setShowSubMenu(!showSubMenu)}
                onMouseEnter={() => setHoveredTab(id)} 
                className={`group relative flex items-center justify-center p-1.5 rounded-2xl transition-all duration-300 ease-out overflow-hidden h-9 sm:h-10 ${shouldExpand ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`} 
                style={{ minWidth: shouldExpand ? (window.innerWidth < 640 ? '68px' : '96px') : (window.innerWidth < 640 ? '28px' : '38px') }}
              >
                <div className="flex items-center gap-1">
                  <span className={`shrink-0 transition-transform duration-300 ${shouldExpand ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {id === 'news' ? <Newspaper size={16} /> : 
                     id === 'avisos' ? <Megaphone size={16} /> : 
                     id === 'grid_salgada' ? <Grid size={16} /> : 
                     id === 'charts' ? <Trophy size={16} /> : 
                     id === 'dynamics' ? <Gamepad2 size={16} /> : 
                     id === 'album' ? <ImageIcon size={16} /> : 
                     id === 'calendar' ? <Calendar size={16} /> : 
                     id === 'profile' ? <User size={16} /> :
                     <BookOpen size={16} />}
                  </span>
                  <div className={`flex items-center overflow-hidden transition-all duration-300 ease-out h-full ${shouldExpand ? 'max-w-[70px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[7px] sm:text-[9px] font-black uppercase tracking-tighter whitespace-nowrap ml-1">{getTabLabel(id)}</span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-3 h-[calc(100vh-56px)] flex flex-col min-h-0 relative z-10">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar custom-scrollbar pb-20 pt-1">
            {activeTab === 'news' && <NewsFeed mode="news" pizzas={pizzas} userId={userId} onAddPhoto={handleAddMedia} onDeletePhoto={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} onReplyToComment={handleReplyToComment} onEditReply={handleEditReply} onDeleteReply={handleDeleteReply} onReplyReact={handleReplyReaction} onPollVote={handlePollVote} uiScale={uiScale} canPost={canPost} />}
            {activeTab === 'avisos' && <NewsFeed mode="avisos" pizzas={pizzas} userId={userId} onAddPhoto={handleAddMedia} onDeletePhoto={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} onReplyToComment={handleReplyToComment} onEditReply={handleEditReply} onDeleteReply={handleDeleteReply} onReplyReact={handleReplyReaction} onPollVote={handlePollVote} uiScale={uiScale} canPost={canPost} />}
            {activeTab === 'rules' && <RulesPage language={language} isAdmin={isAdmin} onAlertAdmin={() => handleBroadcastAlert('rules')} />}
            {activeTab === 'dynamics' && <DynamicsPage language={language} isAdmin={isAdmin} onAlertAdmin={() => handleBroadcastAlert('dynamics')} />}
            {(activeTab === 'grid_salgada' || activeTab === 'grid_doce') && (<div className="space-y-3 animate-in fade-in duration-700 select-none relative group/grid-container">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black flex items-center gap-2 tracking-tighter uppercase leading-none">
                    {gridMode === 'doce' ? <Cake className="text-pink-500 w-5 h-5" /> : <Pizza className="text-orange-500 w-5 h-5" />} 
                    <span className="bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                      {t.grid} {gridMode === 'doce' ? 'Doce' : 'Salgada'}
                    </span>
                    <button onClick={() => setShowSimulation(true)} className="ml-2 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 hover:scale-110 active:scale-95 transition-all shadow-sm group relative">
                      <span className="font-black text-xs">?</span>
                    </button>
                  </h2>
                  {isAdmin && (
                    <button onClick={handleAdminClearTable} className="ml-2 p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90 border border-red-200 group relative">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {!isVotingReleased && !isAdmin ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner text-slate-400">
                    <Lock size={40} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Fichas Bloqueadas</h3>
                  <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-sm">Aguardando o administrador liberar o período de votação. Fique atento aos avisos!</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1 overflow-x-auto no-scrollbar px-1">
                    {['asc', 'desc', 'rank'].map(s => (
                      <button key={s} onClick={() => setGridSort(s as any)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 shadow-sm ${gridSort === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {s === 'asc' ? 'Crescente' : s === 'desc' ? 'Decrescente' : 'Melhores'}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-0.5">
                    {sortedGridPizzas.map((p, i) => (
                      <PizzaCard key={`${gridMode}-${p.id}`} index={i} data={p} userId={userId} isAdmin={isAdmin} onUpdate={handleUpdateScore} onConfirm={handleConfirmVote} onUpdateNote={handleUpdateNote} onUpdateGlobalNote={handleUpdateNoteGlobal} onDelete={handleDeletePizza} onUpdateDate={handleUpdateDate} rank={rankMap[String(p.id)]} peerCount={peerCount} onAddPhoto={handleAddMedia} language={language} ownerName={isAdmin ? PIZZA_OWNERS[Number(p.id)] : undefined} variant={gridMode} />
                    ))}
                  </div>
                </>
              )}
            </div>)}
            {activeTab === 'charts' && isAdmin && (<div className="flex flex-col gap-4 animate-in fade-in duration-700"><div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2"><div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-indigo-500 shadow-xl flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><PlayCircle size={24} /></div><div><h3 className="font-black text-xs uppercase tracking-tight leading-none mb-1">Modo Espetáculo</h3><p className="text-[9px] text-slate-500 font-bold uppercase">Revelação de Resultados</p></div></div><button onClick={() => setTriggerRankReveal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95">Iniciar</button></div></div><RankingTable data={pizzas} language={language} pizzaOwners={PIZZA_OWNERS} triggerReveal={triggerRankReveal} onRevealComplete={handleRevealComplete} /></div>)}
            {activeTab === 'album' && <UnifiedPhotoAlbum pizzas={pizzas} userId={userId} onAddMedia={handleAddMedia} onDeleteMedia={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} onReplyToComment={handleReplyToComment} onReplyReact={handleReplyReaction} onEditReply={handleEditReply} onDeleteReply={handleDeleteReply} uiScale={uiScale} canPost={canPost} />}
        </div>
      </main>
    </div>
  );
};

export default App;
