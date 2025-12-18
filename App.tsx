
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
    broadcastReply, broadcastReplyReaction, broadcastPollVote, forceManualSync, broadcastConfirmVote,
    broadcastAppNotification, broadcastPresence, VotePayload, ConfirmVotePayload, GlobalNotePayload, FullSyncPayload, AddPizzaPayload, MediaPayload, MediaUpdatePayload, MediaDeletePayload, DatePayload, CommentPayload, CommentEditPayload, CommentDeletePayload, ReactionPayload, CommentReactionPayload, ReplyPayload, ReplyReactionPayload, PollVotePayload, AppNotificationPayload, PresencePayload, ResetXPPayload
} from './services/p2pService';
import { Trophy, Plus, RotateCcw, Table, User, ArrowUpDown, ArrowUp, ArrowDown, Bell, Loader2, LogOut, Settings as SettingsIcon, ScrollText, BookOpen, Database, RefreshCw, MessageCircle, Newspaper, ImageIcon, Calendar, BarChart2, Grid, Gamepad2, X, Pizza, Cake, Check, Clock, Leaf, Sparkles, Wifi, WifiOff, Users, HelpCircle, Megaphone, Play, AlertTriangle, CloudOff } from 'lucide-react';
import { LOGO_BASE64 } from './constants';

const INITIAL_PI_IDS = [7, 8, 9, 10, 13, 14, 16, 21, 22, 28, 39, 42, 50];

const PIZZA_OWNERS: Record<number, string> = {
    7: "Elisa", 14: "Marta", 13: "Angelica", 39: "Vania", 9: "Neiva", 16: "Simone",
    50: "Rebecca", 28: "Ana Júlia", 21: "Adry", 8: "Yulimar", 42: "Gecilda",
    10: "Vanusa", 22: "Leonardo"
};

const DM_AVATAR_URL = 'https://ui-avatars.com/api/?name=DM&background=000&color=fff&size=128&bold=true&length=2';

export interface AppNotification {
    id: string; title: string; message: string; timestamp: number; read: boolean;
    targetTab: 'news' | 'rules' | 'dynamics' | 'album' | 'dates' | 'grid_salgada' | 'history' | 'avisos';
}

const ToastNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
        <div className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-slate-200">
            <div className="bg-green-500 rounded-full p-1 animate-pulse"><Bell size={16} className="text-white fill-white" /></div>
            <span className="font-bold text-sm whitespace-nowrap">{message}</span>
        </div>
    </div>
);

const App: React.FC = () => {
  const [showAbertura, setShowAbertura] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('pizza_theme') as any) || 'light');
  const [themeColor, setThemeColor] = useState<'default' | 'babyBlue' | 'pink' | 'lightPurple' | 'babyGreen'>(() => (localStorage.getItem('pizza_theme_color') as any) || 'default');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('pizza_language') as any) || 'pt');
  
  const t = translations[language];

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
  const [cloudReady, setCloudReady] = useState(true);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
      try { const saved = localStorage.getItem('pizza_notifications'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());

  const isSyncingRef = useRef(false);
  const cloudSaveTimeouts = useRef<Record<string, number>>({});
  const processedNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, []);

  const triggerSystemNotification = (title: string, body: string) => {
    if (document.visibilityState === 'hidden' && "Notification" in window && Notification.permission === "granted") {
        try {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: './logo.png',
                    badge: './logo.png',
                    vibrate: [200, 100, 200, 100, 400],
                    tag: 'pizza-update',
                    renotify: true
                } as any);
            });
        } catch (e) {
            new Notification(title, { body, icon: './logo.png' });
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

  useEffect(() => { localStorage.setItem('pizza_notifications', JSON.stringify(securityService.deepClean(notifications))); }, [notifications]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => { if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) setShowNotificationMenu(false); };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const scrollY = scrollContainerRef.current.scrollTop;
      if (scrollY > lastScrollY.current && scrollY > 50) { setIsNavVisible(false); } else { setIsNavVisible(true); }
      lastScrollY.current = scrollY;
    };
    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll, { passive: true });
    return () => { if (container) container.removeEventListener('scroll', handleScroll); };
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
      if (notif.targetTab === 'dates') setShowCalendarModal(true);
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
    localStorage.setItem('pizza_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('pizza_theme_color', themeColor); }, [themeColor]);

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
        const defaults = (missingIds.length > 0 ? missingIds : INITIAL_PI_IDS).map(id => ({ id, beautyScores: {}, tasteScores: {}, beautyScoresDoce: {}, tasteScoresDoce: {}, bonusScores: {}, bonusScoresDoce: {}, confirmedVotes: {}, userNotes: {}, notes: '', media: [], scheduledDate: '' }));
        finalData = [...finalData, ...defaults];
    }
    return finalData;
  });

  const [isDbReady, setIsDbReady] = useState(false);
  
  const debouncedCloudSave = (key: string, data: any) => {
      if (cloudSaveTimeouts.current[key]) clearTimeout(cloudSaveTimeouts.current[key]);
      cloudSaveTimeouts.current[key] = window.setTimeout(() => {
          if (!isSyncingRef.current) {
              databaseService.saveToCloud(key, securityService.deepClean(data));
              setCloudReady(databaseService.getCloudStatus().isReady);
          }
      }, 2000);
  };

  useEffect(() => {
    const initCloud = async () => {
        await databaseService.init();
        isSyncingRef.current = true;
        
        const cloudPizzas = await databaseService.getBackup('pizzas');
        const cloudSocial = await databaseService.getBackup('social_data');
        
        if (cloudPizzas) setPizzas(cloudPizzas);
        if (cloudSocial) setSocialData(cloudSocial);
        
        setIsDbReady(true);
        isSyncingRef.current = false;
        setCloudReady(databaseService.getCloudStatus().isReady);

        const channel = supabase.channel('app_global_sync')
            .on('broadcast', { event: 'notification' }, (payload) => {
                const p = payload.payload;
                const cleanMsg = p.message.replace(/\*\*/g, '');
                addAppNotification(p.title, p.message, p.targetTab, p.id);
                triggerGlobalNotification(p.title + ": " + cleanMsg);
                triggerSystemNotification(p.title, cleanMsg);
            })
            .on('broadcast', { event: 'full_sync' }, (payload) => {
                const { pizzas: incoming, socialData: incomingSocial } = payload.payload;
                isSyncingRef.current = true;
                setPizzas(incoming);
                setSocialData(incomingSocial);
                setTimeout(() => { isSyncingRef.current = false; }, 500);
            })
            .subscribe();

        // P2P Initialization
        initializeP2P({
            onVoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, [p.field]: p.value === -1 ? (()=>{const s={...pz[p.field]};delete s[p.userId];return s})() : { ...pz[p.field], [p.userId]: p.value } } : pz)),
            onVoteConfirm: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, confirmedVotes: { ...pz.confirmedVotes, [p.userId]: p.status } } : pz)),
            onGlobalNoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, notes: p.note } : pz)),
            onFullSync: (p) => { 
                isSyncingRef.current = true; 
                setPizzas(p.pizzas); 
                setSocialData(p.socialData); 
                if(p.users) authService.mergeUsers(p.users);
                setTimeout(() => isSyncingRef.current = false, 1000); 
            },
            onPeerCountChange: setPeerCount,
            onReset: () => window.location.reload(),
            onDelete: (id) => setPizzas(prev => prev.filter(p => p.id !== id)),
            onAddPizza: (p) => setPizzas(prev => [...prev, p.pizza]),
            onMediaAdd: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: [...(pz.media || []), p.mediaItem] } : pz)),
            onMediaUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.map(m => m.id === p.mediaId ? { ...m, caption: p.caption } : m) } : pz)),
            onMediaDelete: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.filter(m => m.id !== p.mediaId) } : pz)),
            onDateUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, scheduledDate: p.date } : pz)),
            onCommentAdd: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: [...(prev.comments[p.mediaId] || []), p.comment] } })),
            onCommentEdit: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, text: p.newText } : c) } })),
            onCommentDelete: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).filter(c => c.id !== p.commentId) } })),
            onReactionUpdate: (p) => setSocialData(prev => {
                const curr = prev.likes[p.mediaId] || {};
                return { ...prev, likes: { ...prev.likes, [p.mediaId]: { ...curr, [p.userId]: p.emoji } } };
            }),
            onCommentReactionUpdate: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, reactions: { ...c.reactions, [p.userId]: p.emoji } } : c) } })),
            onReplyAdd: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, replies: [...(c.replies || []), p.reply] } : c) } })),
            onReplyReactionUpdate: (p) => setSocialData(prev => ({ ...prev, comments: { ...prev.comments, [p.mediaId]: (prev.comments[p.mediaId] || []).map(c => c.id === p.commentId ? { ...c, replies: (c.replies || []).map(r => r.id === p.replyId ? { ...r, reactions: { ...r.reactions, [p.userId]: p.emoji } } : r) } : c) } })),
            onPollVoteUpdate: (p) => setPizzas(prev => prev.map(pz => pz.id === p.pizzaId ? { ...pz, media: pz.media?.map(m => m.id === p.mediaId ? { ...m, poll: { ...m.poll!, votes: { ...m.poll!.votes, [p.userId]: p.selectedOptions } } } : m) } : pz)),
            onAppNotification: (p) => {
                const cleanMsg = p.message.replace(/\*\*/g, '');
                addAppNotification(p.title, p.message, p.targetTab as any);
                triggerGlobalNotification(p.title + ": " + cleanMsg);
                triggerSystemNotification(p.title, cleanMsg);
            },
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
  const isAdmin = currentUser?.nickname.toLowerCase() === '@leonardo';

  const handleLoginSuccess = (user: UserAccount) => { 
    setCurrentUser(user); 
    setIsLevelInitialized(false); 
    setActiveTab('news');
  };
  const handleUpdateUser = (updated: UserAccount) => setCurrentUser(updated);
  const handleLogout = () => { authService.logout(); setCurrentUser(null); setIsLevelInitialized(false); setActiveTab('news'); };

  useEffect(() => {
    if (isDbReady && !isSyncingRef.current) {
        debouncedCloudSave('social_data', socialData);
        databaseService.saveBackup('social_data', socialData);
        try {
            localStorage.setItem('pizza_social_data', JSON.stringify(securityService.deepClean(socialData)));
        } catch (e) {
            console.warn("Quota exceeded for social data in localStorage");
        }
    }
  }, [socialData, isDbReady]);

  const [activeTab, setActiveTab] = useState<'news' | 'avisos' | 'rules' | 'grid_salgada' | 'grid_doce' | 'charts' | 'album' | 'calendar' | 'history' | 'dynamics'>('news');
  const [previewTab, setPreviewTab] = useState<string | null>(null);
  const [gridSort, setGridSort] = useState<'asc' | 'desc' | 'rank'>('asc');
  
  const pizzasRef = useRef(pizzas);
  const socialDataRef = useRef(socialData);
  const currentUserRef = useRef<UserAccount | null>(currentUser);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  
  const triggerGlobalNotification = (message: string) => {
      if (showSettingsModal) return;
      setToastMessage(message);
      try { const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3'); audio.volume = 0.4; audio.play().catch(() => {}); } catch {}
      setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    pizzasRef.current = pizzas;
    if (isDbReady && !isSyncingRef.current) {
        debouncedCloudSave('pizzas', pizzas);
        databaseService.saveBackup('pizzas', pizzas);
        
        try {
            localStorage.setItem('pizzaGradeDataV2', JSON.stringify(securityService.deepClean(pizzas)));
        } catch (e) {
            console.warn("Local storage quota exceeded, falling back to IndexedDB for pizzas.");
            const stripped = pizzas.map(p => ({
                ...p,
                media: p.media?.map(m => ({ ...m, url: "" }))
            }));
            try {
                localStorage.setItem('pizzaGradeDataV2', JSON.stringify(securityService.deepClean(stripped)));
            } catch (e2) {}
        }
    }
  }, [pizzas, isDbReady]);

  const [isLevelInitialized, setIsLevelInitialized] = useState(false);
  useEffect(() => {
      if (!currentUser) return;
      const stats = calculateUserLevel(currentUser, pizzas, socialData, PIZZA_OWNERS);
      if (!isLevelInitialized) { previousLevelRef.current = stats.level; setIsLevelInitialized(true); } 
      else if (stats.level > previousLevelRef.current) { setLevelUpLevel(stats.level); setShowLevelUpModal(true); previousLevelRef.current = stats.level; }
  }, [pizzas, socialData, currentUser, isLevelInitialized]);

  const handleNavClick = (tabId: string) => {
      if (previewTab === tabId) {
          if (tabId === 'calendar') { setShowCalendarModal(true); setPreviewTab(null); return; }
          if (tabId === 'history') { setShowHistory(true); setPreviewTab(null); return; }
          setActiveTab(tabId as any); setPreviewTab(null);
          if (tabId === 'grid_salgada') setGridMode('salgada');
          if (tabId === 'grid_doce') setGridMode('doce');
      } else {
          setPreviewTab(tabId); setTimeout(() => setPreviewTab(p => p === tabId ? null : p), 2500);
      }
  };

  const sortedGridPizzas = useMemo(() => {
      const sorted = [...pizzas];
      const sortNumeric = (a: PizzaData, b: PizzaData) => parseFloat(String(a.id)) - parseFloat(String(b.id));
      if (gridSort === 'asc') return sorted.sort(sortNumeric);
      if (gridSort === 'desc') return sorted.sort((a, b) => sortNumeric(b, a));
      return sorted.sort((a, b) => {
          const scoreA = gridMode === 'salgada' ? getSum(a.beautyScores) + getSum(a.tasteScores) : getSum(a.beautyScoresDoce) + getSum(a.tasteScoresDoce);
          const scoreB = gridMode === 'salgada' ? getSum(b.beautyScores) + getSum(b.tasteScores) : getSum(b.beautyScoresDoce) + getSum(b.tasteScoresDoce);
          return scoreB - scoreA;
      });
  }, [pizzas, gridSort, gridMode]);

  const rankMap = useMemo(() => {
    const stats = pizzas.map(p => ({ id: p.id, score: gridMode === 'salgada' ? getSum(p.beautyScores) + getSum(p.tasteScores) : getSum(p.beautyScoresDoce) + getSum(p.tasteScoresDoce) })).filter(p => p.score > 0).sort((a, b) => b.score - a.score);
    const map: Record<string, number> = {};
    stats.forEach((s, idx) => map[String(s.id)] = idx + 1);
    return map;
  }, [pizzas, gridMode]);

  const syncAndBroadcast = (updatedPizzas: PizzaData[], updatedSocial?: SocialData) => {
      setPizzas(updatedPizzas);
      if (updatedSocial) setSocialData(updatedSocial);
      
      supabase.channel('app_global_sync').send({
          type: 'broadcast',
          event: 'full_sync',
          payload: { pizzas: updatedPizzas, socialData: updatedSocial || socialData }
      });
  };

  const handleUpdateScore = (id: any, field: any, value: any) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, [field]: value === -1 ? (()=>{const s={...p[field]};delete s[userId];return s})() : { ...p[field], [userId]: value }, confirmedVotes: (()=>{const c={...p.confirmedVotes};delete c[userId];return c})() } : p);
      syncAndBroadcast(updated);
      broadcastVote({ pizzaId: id, userId, field, value }); 
  };

  const handleConfirmVote = (id: any) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, confirmedVotes: { ...p.confirmedVotes, [userId]: true } } : p);
      syncAndBroadcast(updated);
      broadcastConfirmVote({ pizzaId: id, userId, status: true }); 
  };

  const handleUpdateNote = (id: any, note: string) => setPizzas(prev => prev.map(p => p.id === id ? { ...p, userNotes: { ...p.userNotes, [userId]: note } } : p));
  const handleUpdateNoteGlobal = (id: any, note: string) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, notes: note } : p);
      syncAndBroadcast(updated);
      broadcastGlobalNote({ pizzaId: id, note }); 
  };
  
  const handleAddMedia = (id: any, item: MediaItem) => { 
    const updated = pizzas.map(p => p.id === id ? { ...p, media: [...(p.media || []), item] } : p);
    syncAndBroadcast(updated);
    
    if(isDbReady) databaseService.archiveMedia(item.id, item.url, item.type); 
    broadcastMedia({ pizzaId: id, mediaItem: item }); 

    const section = item.hiddenFromFeed ? 'album' : (item.type === 'poll' ? 'avisos' : 'news');
    const notifId = Math.random().toString(36).substring(2, 9);
    const payload = { 
        id: notifId,
        title: item.type === 'poll' ? 'Novo Aviso ⚠️' : 'Nova Notícia 🍕', 
        message: item.caption || 'Confira o novo conteúdo postado!', 
        targetTab: section 
    };

    supabase.channel('app_global_sync').send({
        type: 'broadcast',
        event: 'notification',
        payload
    });
    
    broadcastAppNotification(payload as any);
    addAppNotification(payload.title, payload.message, section as any, notifId);
  };

  const handleUpdateCaption = (id: any, mediaId: string, caption: string) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, media: p.media?.map(m => m.id === mediaId ? { ...m, caption } : m) } : p);
      syncAndBroadcast(updated);
      broadcastMediaUpdate({ pizzaId: id, mediaId, caption }); 
  };

  const handleDeleteMedia = (id: any, mediaId: string) => { 
      const updated = pizzas.map(p => p.id === id ? { ...p, media: p.media?.filter(m => m.id !== mediaId) } : p);
      syncAndBroadcast(updated);
      broadcastDeleteMedia({ pizzaId: id, mediaId }); 
  };

  const handleAddComment = (mediaId: string, text: string) => { 
      const c: Comment = { id: Math.random().toString(36).substring(2, 9), user: currentUser?.nickname || 'Juiz', text, date: new Date().toISOString(), reactions: {}, replies: [] }; 
      const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: [...(socialData.comments[mediaId] || []), c] } };
      syncAndBroadcast(pizzas, updatedSocial);
      broadcastComment({ mediaId, comment: c }); 
  };

  const handleMainReaction = (mediaId: string, emoji: string) => { 
      const curr = socialData.likes[mediaId] || {}; 
      const updatedSocial = { ...socialData, likes: { ...socialData.likes, [mediaId]: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any } }; 
      syncAndBroadcast(pizzas, updatedSocial);
      broadcastReaction({ mediaId, userId, emoji }); 
  };

  const handlePollVote = (pId: any, mId: any, opts: any) => { 
      const updated = pizzas.map(p => p.id === pId ? { ...p, media: p.media?.map(m => m.id === mId ? { ...m, poll: { ...m.poll!, votes: { ...m.poll!.votes, [userId]: opts } } } : m) } : p);
      syncAndBroadcast(updated);
      broadcastPollVote({ pizzaId: pId, mediaId: mId, userId, selectedOptions: opts }); 
  };

  const handleUpdateDate = (id: number | string, date: string) => {
    const updated = pizzas.map(p => p.id === id ? { ...p, scheduledDate: date } : p);
    syncAndBroadcast(updated);
    broadcastDate({ pizzaId: id, date });
  };

  const handleDeletePizza = (id: number | string) => {
    if (window.confirm(t.deleteConfirm)) {
        const updated = pizzas.filter(p => p.id !== id);
        syncAndBroadcast(updated);
        broadcastDelete(id);
    }
  };

  const handleEditComment = (mediaId: string, commentId: string, newText: string) => {
    const updatedComments = (socialData.comments[mediaId] || []).map(c => 
      c.id === commentId ? { ...c, text: newText } : c
    );
    const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } };
    syncAndBroadcast(pizzas, updatedSocial);
    broadcastCommentEdit({ mediaId, commentId, newText });
  };

  const handleDeleteComment = (mediaId: string, commentId: string) => {
    const updatedComments = (socialData.comments[mediaId] || []).filter(c => c.id !== commentId);
    const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } };
    syncAndBroadcast(pizzas, updatedSocial);
    broadcastCommentDelete({ mediaId, commentId });
  };

  const handleCommentReaction = (mediaId: string, commentId: string, emoji: string) => {
    const updatedComments = (socialData.comments[mediaId] || []).map(c => {
      if (c.id === commentId) {
        const curr = c.reactions || {};
        return { ...c, reactions: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any };
      }
      return c;
    });
    const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } };
    syncAndBroadcast(pizzas, updatedSocial);
    broadcastCommentReaction({ mediaId, commentId, userId, emoji });
  };

  const handleReplyToComment = (mediaId: string, commentId: string, text: string) => {
    const r: Reply = { id: Math.random().toString(36).substring(2, 9), user: currentUser?.nickname || 'Juiz', text, date: new Date().toISOString(), reactions: {} };
    const updatedComments = (socialData.comments[mediaId] || []).map(c => 
      c.id === commentId ? { ...c, replies: [...(c.replies || []), r] } : c
    );
    const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } };
    syncAndBroadcast(pizzas, updatedSocial);
    broadcastReply({ mediaId, commentId, reply: r });
  };

  const handleReplyReaction = (mediaId: string, commentId: string, replyId: string, emoji: string) => {
    const updatedComments = (socialData.comments[mediaId] || []).map(c => {
      if (c.id === commentId) {
        const updatedReplies = (c.replies || []).map(r => {
          if (r.id === replyId) {
            const curr = r.reactions || {};
            return { ...r, reactions: { ...curr, [userId]: curr[userId] === emoji ? undefined : emoji } as any };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      }
      return c;
    });
    const updatedSocial = { ...socialData, comments: { ...socialData.comments, [mediaId]: updatedComments } };
    syncAndBroadcast(pizzas, updatedSocial);
    broadcastReplyReaction({ mediaId, commentId, replyId, userId, emoji });
  };

  const visibleTabs: Array<'news' | 'avisos' | 'grid_salgada' | 'grid_doce' | 'charts' | 'rules' | 'dynamics' | 'album' | 'calendar' | 'history'> = [
    'news', 'avisos', 'grid_salgada', 'grid_doce', 'charts', 'rules', 'dynamics', 'album', 'calendar', 'history'
  ];

  const handleBroadcastAlert = (section: string) => {
      const titles: Record<string, string> = { 'rules': 'Regras Atualizadas', 'dynamics': 'Dinâmica', 'history': 'História', 'news': 'Notícias', 'avisos': 'Novos Avisos' };
      const notifId = Math.random().toString(36).substring(2, 9);
      const payload = { id: notifId, title: titles[section] || 'Aviso', message: `Atualização em **${section}**!`, targetTab: section };
      
      supabase.channel('app_global_sync').send({
          type: 'broadcast',
          event: 'notification',
          payload
      });

      broadcastAppNotification(payload as any); 
      addAppNotification(payload.title, payload.message, section as any, notifId);
  };

  if (showAbertura) return <AberturaPage onFinish={() => setShowAbertura(false)} />;
  if (!currentUser) return <AuthPage onLoginSuccess={handleLoginSuccess} language={language} setLanguage={setLanguage} notifications={notifications} onlineNicknames={Object.values(onlineNicknames).map((v: any) => v.nickname)} />;

  return (
    <div className={`min-h-screen pb-32 relative transition-all duration-700 ${themeColor === 'babyBlue' ? 'theme-baby-blue-animate' : themeColor === 'pink' ? 'theme-pink-animate' : themeColor === 'lightPurple' ? 'theme-purple-animate' : themeColor === 'babyGreen' ? 'theme-green-animate' : 'bg-slate-50 dark:bg-slate-950'} overflow-hidden`}>
      {toastMessage && !showSettingsModal && <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />}
      
      {isAdmin && !cloudReady && (
          <div className="bg-orange-500 text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between animate-in slide-in-from-top duration-500 z-[160] sticky top-0 border-b border-orange-600 shadow-lg">
              <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="animate-pulse" />
                  <span>Sincronização em Nuvem Desativada (Tabelas Faltando)</span>
              </div>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="bg-white text-orange-600 px-3 py-1 rounded-full hover:bg-orange-50 transition-colors shadow-sm"
              >
                Configurar Agora
              </button>
          </div>
      )}

      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} currentUser={currentUser} onUpdateUser={handleUpdateUser} currentLanguage={language} onLanguageChange={setLanguage} currentTheme={theme} onThemeChange={setTheme} pizzas={pizzas} socialData={socialData} onSimulateLevelUp={() => { setLevelUpLevel(l => l >= 5 ? 1 : l + 1); setIsSimulating(true); setShowLevelUpModal(true); setShowSettingsModal(false); }} themeColor={themeColor} onThemeColorChange={setThemeColor} />
      {showProfilePage && <ProfilePage currentUser={currentUser} onUpdateUser={handleUpdateUser} onClose={() => setShowProfilePage(false)} pizzas={pizzas} socialData={socialData} language={language} pizzaOwners={PIZZA_OWNERS} />}
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} onAlertAdmin={() => handleBroadcastAlert('history')} isAdmin={isAdmin} />
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} language={language} onAlertAdmin={() => handleBroadcastAlert('rules')} isAdmin={isAdmin} />
      <CalendarModal isOpen={showCalendarModal || (activeTab === 'calendar' && isAdmin)} onClose={() => { setShowCalendarModal(false); if (activeTab === 'calendar') setActiveTab('news'); }} language={language} isAdmin={isAdmin} onUpdateDateGlobal={handleUpdateDate} pizzas={pizzas} />
      {showLevelUpModal && <LevelUpModal newLevel={levelUpLevel} onClose={() => setShowLevelUpModal(false)} nickname={currentUser.nickname} onTestNextLevel={isSimulating ? () => setLevelUpLevel(prev => prev >= 5 ? 1 : prev + 1) : undefined} />}
      <VotingSimulation isOpen={showSimulation} onClose={() => setShowSimulation(false)} onNavigateToSalgada={() => { setActiveTab('grid_salgada'); setGridMode('salgada'); }} currentTab={activeTab} />

      <nav className={`${isAdmin && !cloudReady ? 'top-8' : 'top-0'} sticky pt-safe z-50 transition-all duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center relative">
            <div className="flex flex-col gap-1.5">
                <button onClick={() => setShowProfilePage(true)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 transition-all hover:scale-105">
                    {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-500"><User size={16} /></div>}
                    <span className="text-xs font-black truncate max-w-[80px] text-slate-700 dark:text-slate-200">{currentUser.nickname}</span>
                </button>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        {isOnline ? 'ONLINE' : 'OFFLINE'} | <Users size={10} className="text-indigo-500" /> {peerCount}
                    </span>
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src={LOGO_BASE64} alt="Logo" className="h-16 w-auto object-contain pointer-events-auto" onClick={() => isAdmin && setActiveTab('news')} />
            </div>

            <div className="flex items-center gap-1.5" ref={notificationMenuRef}>
               <button onClick={() => setShowNotificationMenu(!showNotificationMenu)} className="p-2 rounded-lg relative text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-all active:scale-95">
                   <Bell size={20} className={unreadCount > 0 ? "animate-wiggle" : ""} />
                   {unreadCount > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
               </button>
               {showNotificationMenu && (
                   <div className="absolute top-full right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[200] animate-in slide-in-from-top-2">
                       <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                           <h3 className="font-black text-xs uppercase text-slate-500">Notificações</h3>
                           <div className="flex gap-3">
                               <button onClick={markAllRead} className="text-[10px] font-bold text-indigo-500">Lidas</button>
                               <button onClick={clearNotifications} className="text-[10px] font-bold text-red-500">Limpar</button>
                           </div>
                       </div>
                       <div className="max-h-[300px] overflow-y-auto">
                           {notifications.length === 0 ? <p className="p-8 text-center text-xs text-slate-400">Nenhuma notificação</p> : notifications.map(n => (
                               <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 relative ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                                   <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full h-fit"><Bell size={16} className="text-indigo-500" /></div>
                                   <div><h4 className="text-sm font-bold">{n.title}</h4><p className="text-xs text-slate-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: n.message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }}></p></div>
                                   {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full"></div>}
                               </button>
                           ))}
                       </div>
                   </div>
               )}
               <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 relative">
                   <SettingsIcon size={20} />
                   {isAdmin && !cloudReady && <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>}
               </button>
               <button onClick={handleLogout} className="p-2 rounded-lg hover:text-red-500 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"><LogOut size={20} /></button>
            </div>
        </div>
      </nav>

      <div className={`fixed bottom-6 pb-safe left-1/2 -translate-x-1/2 z-[100] flex gap-1 sm:gap-2 backdrop-blur-md px-4 py-3 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-2xl transition-all duration-300 ${!isNavVisible ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
          {visibleTabs.map(id => (
              <button key={id} onClick={() => handleNavClick(id)} className={`p-2.5 rounded-full transition-all relative ${activeTab === id ? 'bg-indigo-600 text-white -translate-y-2 shadow-lg scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
                  {id === 'news' ? <Newspaper size={20} /> : id === 'avisos' ? (
                      <div className="relative group">
                          <Megaphone size={20} />
                          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 flex items-end gap-[1.5px] h-3 pointer-events-none">
                              <div className="w-[1.5px] bg-current rounded-full animate-sound-bar" style={{ animationDelay: '0s' }}></div>
                              <div className="w-[1.5px] bg-current rounded-full animate-sound-bar" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-[1.5px] bg-current rounded-full animate-sound-bar" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                      </div>
                  ) : id === 'grid_salgada' ? <Pizza size={20} /> : id === 'grid_doce' ? <Cake size={20} /> : id === 'charts' ? <Trophy size={20} /> : id === 'rules' ? <ScrollText size={20} /> : id === 'dynamics' ? <Gamepad2 size={20} /> : id === 'album' ? <ImageIcon size={20} /> : id === 'calendar' ? <Calendar size={20} /> : <BookOpen size={20} />}
              </button>
          ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar">
            {activeTab === 'news' && <NewsFeed mode="news" pizzas={pizzas} userId={userId} onAddPhoto={handleAddMedia} onDeletePhoto={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} onReplyToComment={handleReplyToComment} onReplyReact={handleReplyReaction} onPollVote={handlePollVote} />}
            {activeTab === 'avisos' && <NewsFeed mode="avisos" pizzas={pizzas} userId={userId} onAddPhoto={handleAddMedia} onDeletePhoto={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} onReplyToComment={handleReplyToComment} onReplyReact={handleReplyReaction} onPollVote={handlePollVote} />}
            {activeTab === 'rules' && <RulesPage language={language} isAdmin={isAdmin} onAlertAdmin={() => handleBroadcastAlert('rules')} />}
            {activeTab === 'dynamics' && <DynamicsPage language={language} isAdmin={isAdmin} onAlertAdmin={() => handleBroadcastAlert('dynamics')} />}
            {(activeTab === 'grid_salgada' || activeTab === 'grid_doce') && (
                <div className="space-y-6 pb-20">
                    <h2 className="text-2xl font-black flex items-center gap-2">{gridMode === 'doce' ? <Cake className="text-pink-500" /> : <Pizza className="text-orange-500" />} Fichas {gridMode === 'doce' ? 'Doce' : 'Salgada'}</h2>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 items-center">
                        {['asc', 'desc', 'rank'].map(s => <button key={s} onClick={() => setGridSort(s as any)} className={`px-4 py-2 rounded-xl text-xs font-black border transition-colors ${gridSort === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600'}`}>{s === 'asc' ? 'Crescente' : s === 'desc' ? 'Decrescente' : 'Melhores'}</button>)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedGridPizzas.map((p, i) => <PizzaCard key={String(p.id)} index={i} data={p} userId={userId} isAdmin={isAdmin} onUpdate={handleUpdateScore} onConfirm={handleConfirmVote} onUpdateNote={handleUpdateNote} onUpdateGlobalNote={handleUpdateNoteGlobal} onDelete={handleDeletePizza} onUpdateDate={handleUpdateDate} rank={rankMap[String(p.id)]} peerCount={peerCount} onAddPhoto={handleAddMedia} language={language} ownerName={isAdmin ? PIZZA_OWNERS[Number(p.id)] : undefined} variant={gridMode} />)}
                    </div>
                </div>
            )}
            {activeTab === 'charts' && (
                <div className="flex flex-col gap-6">
                    {isAdmin && (
                        <div className="p-4 bg-indigo-600/10 border-2 border-indigo-500 rounded-3xl flex items-center justify-between shadow-lg shadow-indigo-500/10">
                            <div>
                                <h3 className="font-black text-indigo-700 dark:text-indigo-300 uppercase text-xs tracking-widest">Controle Admin</h3>
                                <p className="text-[10px] text-indigo-500 font-medium">Inicie a transmissão oficial do ranking final</p>
                            </div>
                            <button 
                                onClick={() => setTriggerRankReveal(true)}
                                className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                <Play size={16} fill="currentColor" /> Simular Apuração Visual
                            </button>
                        </div>
                    )}
                    <RankingTable data={pizzas} language={language} pizzaOwners={PIZZA_OWNERS} triggerReveal={triggerRankReveal} onRevealComplete={() => setTriggerRankReveal(false)} />
                </div>
            )}
            {activeTab === 'album' && <UnifiedPhotoAlbum pizzas={pizzas} userId={userId} onAddMedia={handleAddMedia} onDeleteMedia={handleDeleteMedia} socialData={socialData} onAddComment={handleAddComment} onEditComment={handleEditComment} onDeleteComment={handleDeleteComment} onReact={handleMainReaction} onCommentReact={handleCommentReaction} onUpdateCaption={handleUpdateCaption} language={language} currentUser={currentUser} />}
        </div>
      </main>
    </div>
  );
};

export default App;
