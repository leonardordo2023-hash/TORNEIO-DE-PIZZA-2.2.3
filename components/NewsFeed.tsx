
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PizzaData, getSum, SocialData, MediaItem, UserAccount } from '../types';
import { Award, Info, Pizza, Heart, MessageCircle, Trash2, User, X, Pencil, Check, Image as ImageIcon, Video, Smile, Loader2, Send, MoreHorizontal, CornerDownRight, BarChart2, ShieldCheck, Megaphone, Newspaper } from 'lucide-react';
import { processMediaFile } from '../services/imageService';
import { Language, translations } from '../services/translations';

// NewsFeedProps fixed to remove duplicated onReplyReact and redundant onAddReplyToComment
interface NewsFeedProps {
  pizzas: PizzaData[];
  userId: string;
  onAddPhoto: (id: number | string, mediaItem: MediaItem) => void;
  onDeletePhoto: (id: number | string, mediaId: string) => void;
  socialData: SocialData;
  onAddComment: (mediaId: string, text: string) => void;
  onEditComment: (mediaId: string, commentId: string, newText: string) => void;
  onDeleteComment: (mediaId: string, commentId: string) => void;
  onReact: (mediaId: string, emoji: string) => void;
  onCommentReact: (mediaId: string, commentId: string, emoji: string) => void;
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
  onReplyToComment: (mediaId: string, commentId: string, text: string) => void;
  onReplyReact: (mediaId: string, commentId: string, replyId: string, emoji: string) => void;
  onPollVote: (pizzaId: number | string, mediaId: string, selectedOptions: string[]) => void;
  mode?: 'news' | 'avisos';
}

const getRelativeTime = (timestamp: number | undefined) => {
  if (!timestamp) return 'Recente';
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const ITEMS_PER_PAGE = 5;

export const NewsFeed: React.FC<NewsFeedProps> = ({ 
    pizzas, userId, onAddPhoto, onDeletePhoto,
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, onUpdateCaption, language, currentUser, onReplyToComment, onReplyReact, onPollVote,
    mode = 'news'
}) => {
  const t = translations[language];
  const evaluatedPizzas = pizzas.filter(p => (getSum(p.beautyScores) + getSum(p.tasteScores)) > 0);
  const sorted = [...evaluatedPizzas].sort((a, b) => (getSum(b.beautyScores) + getSum(b.tasteScores)) - (getSum(a.beautyScores) + getSum(a.tasteScores)));
  const leader = sorted[0];
  const totalVotes = pizzas.reduce((acc, p) => acc + Math.max(Object.keys(p.beautyScores).length, Object.keys(p.tasteScores).length), 0);
  
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [activeReplyInput, setActiveReplyInput] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activePostMenu, setActivePostMenu] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{id: string, text: string} | null>(null);
  
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  const [bouncingId, setBouncingId] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const isAdmin = userId.toLowerCase() === '@leonardo';

  const feedItems = useMemo(() => {
      return pizzas.flatMap(p => (p.media || [])
        .filter(item => !item.hiddenFromFeed)
        .filter(item => {
            if (mode === 'news') return item.type !== 'poll'; // Notícias: apenas mídias
            return true; // Avisos: mídias E enquetes
        })
        .map(item => ({ pizzaId: p.id, item: item }))
      ).sort((a, b) => (b.item.date || 0) - (a.item.date || 0));
  }, [pizzas, mode]);

  const visibleFeedItems = feedItems.slice(0, displayCount);

  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          const target = entries[0];
          if (target.isIntersecting && displayCount < feedItems.length) {
              setTimeout(() => {
                  setDisplayCount(prev => prev + ITEMS_PER_PAGE);
              }, 300);
          }
      }, {
          root: null,
          rootMargin: '100px',
          threshold: 0.1
      });

      if (loaderRef.current) observer.observe(loaderRef.current);
      return () => { if (loaderRef.current) observer.unobserve(loaderRef.current); };
  }, [feedItems.length, displayCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (target && activeMenu && !target.closest('.comment-menu')) setActiveMenu(null);
        if (target && activePostMenu && !target.closest('.post-menu-container')) setActivePostMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu, activePostMenu]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewUrl(objectUrl);
      setPreviewType(file.type.startsWith('video') ? 'video' : 'image');
      setIsPostModalOpen(true);
      setIsPollMode(false);
  };

  const handlePostSubmit = async () => {
      const targetId = pizzas[0]?.id;
      if (!targetId) return;
      setIsUploading(true);
      try {
          if (isPollMode) {
              if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
                  alert("Preencha a pergunta e pelo menos 2 opções.");
                  setIsUploading(false);
                  return;
              }
              const formattedOptions = pollOptions
                  .filter(o => o.trim())
                  .map(text => ({ id: Math.random().toString(36).substring(2, 9), text }));

              onAddPhoto(targetId, {
                  id: Math.random().toString(36).substring(2, 15),
                  url: '',
                  type: 'poll',
                  category: 'pizza',
                  date: Date.now(),
                  poll: { question: pollQuestion, options: formattedOptions, votes: {}, allowMultiple: pollAllowMultiple }
              });
          } else {
              if (!selectedFile) return;
              const { url, type } = await processMediaFile(selectedFile, 100);
              onAddPhoto(targetId, { id: Math.random().toString(36).substring(2, 15), url, type, category: 'pizza', date: Date.now(), caption: postCaption });
          }
          closePostModal();
      } catch (err) { alert("Erro ao publicar: " + (err as Error).message); } finally { setIsUploading(false); }
  };

  const closePostModal = () => {
      setIsPostModalOpen(false);
      setPostCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsPollMode(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollAllowMultiple(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddPollOption = () => setPollOptions([...pollOptions, '']);
  const handlePollOptionChange = (index: number, value: string) => {
      const newOptions = [...pollOptions];
      newOptions[index] = value;
      setPollOptions(newOptions);
  };
  const handlePollOptionChangeIdx = (index: number, value: string) => {
      const newOptions = [...pollOptions];
      newOptions[index] = value;
      setPollOptions(newOptions);
  };
  const handleRemovePollOption = (index: number) => {
      if (pollOptions.length > 2) {
          const newOptions = pollOptions.filter((_, i) => i !== index);
          setPollOptions(newOptions);
      }
  };

  const handleVote = (pizzaId: number | string, mediaItem: MediaItem, optionId: string) => {
      if (!mediaItem.poll) return;
      const currentVotes = mediaItem.poll.votes[currentUser.nickname] || [];
      let newVotes: string[] = [];
      if (mediaItem.poll.allowMultiple) {
          newVotes = currentVotes.includes(optionId) ? currentVotes.filter(id => id !== optionId) : [...currentVotes, optionId];
      } else {
          newVotes = currentVotes.includes(optionId) ? [] : [optionId];
      }
      onPollVote(pizzaId, mediaItem.id, newVotes);
  };

  const handleAddCommentAction = (mediaId: string) => {
    const text = commentInput[mediaId];
    if (!text?.trim()) return;
    onAddComment(mediaId, text);
    setCommentInput(prev => ({ ...prev, [mediaId]: '' }));
    triggerBounce(mediaId);
  };

  const triggerBounce = (id: string) => {
      setBouncingId(id);
      setTimeout(() => setBouncingId(null), 500);
  };

  const getReactionSummary = (mediaId: string) => {
     const reactionsMap = socialData.likes[mediaId] || {};
     let totalReactions = 0;
     let myReaction = null;
     Object.entries(reactionsMap).forEach(([uid, emoji]) => {
         if (typeof emoji === 'string') {
            totalReactions++;
            if (uid === currentUser.nickname) myReaction = emoji;
         }
     });
     return { totalReactions, myReaction };
  };

  const renderUserName = (nickname: string) => {
      if (nickname === '@Leonardo') {
          return (
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-black">
                  @ADMINISTRADOR
                  <ShieldCheck size={12} fill="currentColor" className="text-white dark:text-slate-900" />
              </span>
          );
      }
      return <span className="font-bold text-slate-800 dark:text-slate-200">{nickname}</span>;
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500 relative">
      
      {/* Título da Página com Decoração de Som */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl relative overflow-visible ${mode === 'news' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'} shadow-sm`}>
                {mode === 'news' ? <Newspaper size={24} /> : (
                    <>
                        <Megaphone size={24} className="relative z-10" />
                        {/* Efeito Visual de Som Saindo (Avisos) */}
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <div className="w-[2px] h-3 bg-orange-500/80 rounded-full animate-sound-bar" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-[2px] h-6 bg-orange-500/60 rounded-full animate-sound-bar" style={{ animationDelay: '0.3s' }}></div>
                            <div className="w-[2px] h-4 bg-orange-500/40 rounded-full animate-sound-bar" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                        <div className="absolute inset-0 bg-orange-400 rounded-xl animate-sound-wave pointer-events-none"></div>
                    </>
                )}
            </div>
            <div className="flex flex-col">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">
                    {mode === 'news' ? 'Notícias' : 'Avisos'}
                </h2>
                {mode === 'avisos' && <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Transmissão Ativa</span>}
            </div>
        </div>
      </div>

      {/* --- CREATE POST MODAL --- */}
      {isPostModalOpen && isAdmin && (
          <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 relative">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex-1 text-center">Criar {isPollMode ? 'Aviso' : 'Publicação'}</h3>
                      <button onClick={closePostModal} className="absolute right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X size={20} /></button>
                  </div>
                  <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                      {!isPollMode ? (
                          <>
                            <textarea placeholder={`No que você está pensando?`} className="w-full bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-none min-h-[80px]" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} autoFocus />
                            {previewUrl && (
                                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mt-2 bg-slate-50 dark:bg-black">
                                    <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="absolute top-2 right-2 p-1.5 bg-white text-slate-700 rounded-full shadow-md hover:bg-slate-100 z-10"><X size={16} /></button>
                                    {previewType === 'video' ? <video src={previewUrl} controls className="w-full max-h-[300px] object-contain" /> : <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-contain" />}
                                </div>
                            )}
                          </>
                      ) : (
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Pergunta do Aviso</label>
                                  <input type="text" placeholder="Faça uma pergunta" className="w-full p-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  {pollOptions.map((opt, idx) => (
                                      <div key={idx} className="flex gap-2">
                                          <input type="text" placeholder={`Opção ${idx + 1}`} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500" value={opt} onChange={(e) => handlePollOptionChange(idx, e.target.value)} />
                                          {pollOptions.length > 2 && <button onClick={() => handleRemovePollOption(idx)} className="text-slate-400 hover:text-red-500"><X size={20} /></button>}
                                      </div>
                                  ))}
                                  <button onClick={handleAddPollOption} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline flex items-center gap-1">+ Adicionar Opção</button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                      <button onClick={handlePostSubmit} disabled={isUploading || (!selectedFile && !isPollMode)} className={`flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}>
                          {isUploading ? <Loader2 size={20} className="animate-spin" /> : 'Publicar'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- CREATE POST BOX --- */}
      {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                      {currentUser.avatar ? <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><User size={20} /></div>}
                  </div>
                  <button onClick={() => setIsPostModalOpen(true)} className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-full px-4 py-2 text-left text-slate-500 hover:bg-slate-200 transition-colors flex items-center">
                      <span className="text-sm font-medium">{mode === 'news' ? 'O que há de novo hoje?' : 'Qual o aviso importante?'}</span>
                  </button>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-700 mb-2"></div>
              <div className="flex justify-center gap-4">
                  <button onClick={() => { setIsPostModalOpen(true); setIsPollMode(false); setTimeout(() => fileInputRef.current?.click(), 100); }} className="flex items-center gap-2 py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                      <ImageIcon size={20} className="text-green-500" />
                      <span className="text-sm font-bold">Foto/Vídeo</span>
                  </button>
                  {mode === 'avisos' && (
                    <button onClick={() => { setIsPostModalOpen(true); setIsPollMode(true); }} className="flex items-center gap-2 py-2 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                        <BarChart2 size={20} className="text-orange-500" />
                        <span className="text-sm font-bold">Criar Enquete</span>
                    </button>
                  )}
              </div>
              <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </div>
      )}

      {mode === 'news' && leader && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-xl p-4 text-white shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1"><Award className="text-yellow-300" size={18} /><span className="font-bold text-blue-100 text-[10px] uppercase tracking-wider">{t.leader}</span></div>
                <h3 className="text-xl font-black">Pizza #{leader.id}</h3>
                <p className="text-blue-100 text-xs">{(getSum(leader.beautyScores) + getSum(leader.tasteScores)).toFixed(1)} {t.points}</p>
            </div>
            <div className="text-right relative z-10"><div className="text-2xl font-bold">{totalVotes}</div><div className="text-[10px] text-blue-200 uppercase">{t.computedVotes}</div></div>
            <Pizza className="absolute -right-4 -bottom-4 text-white opacity-10 rotate-12" size={100} />
        </div>
      )}

      <div className="space-y-6">
        {feedItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700"><Info className="mx-auto mb-2 opacity-50" size={32} /><p>{mode === 'news' ? 'Nenhuma notícia no momento.' : 'Nenhum aviso ou enquete ativa.'}</p></div>
        ) : (
            <>
                {visibleFeedItems.map(({ pizzaId, item }) => {
                    const { totalReactions, myReaction } = getReactionSummary(item.id);
                    return (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border relative ${item.type === 'poll' ? 'bg-orange-100 text-orange-600' : 'bg-blue-600 text-white'}`}>
                                    {item.type === 'poll' ? <Megaphone size={20} /> : <ShieldCheck size={20} />}
                                    {item.type === 'poll' && (
                                        <div className="absolute -inset-1 border border-orange-400 rounded-full animate-ping opacity-20"></div>
                                    )}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                                        {item.type === 'poll' ? 'AVISO / ENQUETE' : renderUserName('@Leonardo')}
                                    </span>
                                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{getRelativeTime(item.date)}</span>
                                </div>
                            </div>
                            {isAdmin && (
                                <button onClick={() => { if (window.confirm(t.deleteConfirm)) onDeletePhoto(pizzaId, item.id); }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            )}
                        </div>

                        {item.type === 'poll' && item.poll ? (
                            <div className="px-4 pb-4">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{item.poll.question}</h3>
                                <div className="space-y-2">
                                    {item.poll.options.map(option => {
                                        const allVotes = Object.values(item.poll!.votes).flat();
                                        const optionVotes = allVotes.filter(v => v === option.id).length;
                                        const totalVotesCount = allVotes.length || 1;
                                        const percentage = Math.round((optionVotes / totalVotesCount) * 100);
                                        const isVoted = (item.poll!.votes[currentUser.nickname] || []).includes(option.id);
                                        return (
                                            <button key={option.id} onClick={() => handleVote(pizzaId, item, option.id)} className="w-full relative group">
                                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                                                    <div className="h-full bg-green-200 dark:bg-green-900/40 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                                <div className="relative flex items-center justify-between p-3 z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isVoted ? 'bg-green-500 border-green-500' : 'border-slate-400'}`}>
                                                            {isVoted && <Check size={12} className="text-white" strokeWidth={4} />}
                                                        </div>
                                                        <span className="font-medium text-slate-800 dark:text-slate-100 text-sm">{option.text}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{optionVotes}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="cursor-pointer" onClick={() => setSelectedMedia(item)}>
                                {item.caption && <p className="px-3 pb-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{item.caption}</p>}
                                <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                    {item.type === 'video' ? <video src={item.url} className="w-full h-full object-contain" /> : <img src={item.url} className="w-full h-full object-contain" loading="lazy" />}
                                </div>
                            </div>
                        )}
                        
                        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                             <div className="flex items-center gap-1.5 min-h-[20px]">
                                 {totalReactions > 0 ? (
                                     <span className="text-xs text-slate-500">{myReaction ? `Você e mais ${totalReactions - 1}` : `${totalReactions} curtidas`}</span>
                                 ) : <span className="text-xs text-slate-500">Curta esta publicação</span>}
                             </div>
                             <div className="text-xs text-slate-500">{socialData.comments[item.id]?.length || 0} comentários</div>
                        </div>

                        <div className="flex items-center px-2 py-1">
                            <div className="relative flex-1">
                                <button onClick={() => { onReact(item.id, '❤️'); triggerBounce(item.id); }} className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${myReaction ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                                    <Heart size={18} className={myReaction ? "fill-red-500" : ""} />
                                    <span className="text-sm">Curtir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )})}
                {displayCount < feedItems.length && <div ref={loaderRef} className="py-4 flex justify-center text-slate-400"><Loader2 className="animate-spin" size={24} /></div>}
            </>
        )}
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedMedia(null)}>
            <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                {selectedMedia.type === 'video' ? <video src={selectedMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" /> : <img src={selectedMedia.url} className="max-w-full max-h-[85vh] object-contain rounded-lg" />}
                <button onClick={() => setSelectedMedia(null)} className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-black"><X size={20} /></button>
            </div>
        </div>
      )}
    </div>
  );
};
