
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PizzaData, getSum, SocialData, MediaItem, UserAccount } from '../types';
import { Award, Info, Pizza, Heart, MessageCircle, Trash2, User, X, Pencil, Check, Image as ImageIcon, Video, Smile, Loader2, Send, MoreHorizontal, CornerDownRight, BarChart2, ShieldCheck, Megaphone, Newspaper, Trophy, Plus, ListFilter } from 'lucide-react';
import { processMediaFile } from '../services/imageService';
import { Language, translations } from '../services/translations';

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
  onReplyToComment: (mediaId: string, commentId: string, text: string) => void;
  // Fix: Removed duplicate identifier 'onReplyReact'
  onReplyReact: (mediaId: string, commentId: string, replyId: string, emoji: string) => void;
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
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
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

export const NewsFeed: React.FC<NewsFeedProps> = ({ 
    pizzas, userId, onAddPhoto, onDeletePhoto,
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, onUpdateCaption, language, currentUser, onReplyToComment, onReplyReact, onPollVote,
    mode = 'news'
}) => {
  const t = translations[language];
  const isAdmin = userId.toLowerCase() === '@leonardo';

  const feedItems = useMemo(() => {
      return pizzas.flatMap(p => (p.media || [])
        .filter(item => !item.hiddenFromFeed)
        .filter(item => {
            const isExpired = (Date.now() - (item.date || 0)) > THREE_MONTHS_MS;
            if (isExpired) return false;
            if (mode === 'news') return item.type !== 'poll';
            if (mode === 'avisos') return item.type === 'poll' || item.type === 'news' || item.type === 'video' || item.type === 'image';
            return true;
        })
        .map(item => ({ pizzaId: p.id, item: item }))
      ).sort((a, b) => (b.item.date || 0) - (a.item.date || 0));
  }, [pizzas, mode]);

  const leader = useMemo(() => {
    const evaluated = pizzas.filter(p => (getSum(p.beautyScores) + getSum(p.tasteScores)) > 0);
    return [...evaluated].sort((a, b) => (getSum(b.beautyScores) + getSum(b.tasteScores)) - (getSum(a.beautyScores) + getSum(a.tasteScores)))[0];
  }, [pizzas]);

  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const visibleFeedItems = feedItems.slice(0, displayCount);
  const loaderRef = useRef<HTMLDivElement>(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPollMode, setIsPollMode] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && displayCount < feedItems.length) {
              setDisplayCount(prev => prev + ITEMS_PER_PAGE);
          }
      }, { rootMargin: '100px' });
      if (loaderRef.current) observer.observe(loaderRef.current);
      return () => observer.disconnect();
  }, [feedItems.length, displayCount]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedFile(file);
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
              onAddPhoto(targetId, {
                  id: Math.random().toString(36).substring(2, 15),
                  url: '',
                  type: 'poll',
                  category: 'pizza',
                  date: Date.now(),
                  caption: pollQuestion,
                  poll: {
                      question: pollQuestion,
                      options: pollOptions.filter(o => o.trim()).map(text => ({ id: Math.random().toString(36).substring(2, 9), text })),
                      votes: {},
                      allowMultiple: pollAllowMultiple
                  }
              });
          } else {
              if (!selectedFile && !postCaption.trim()) return;
              let url = '';
              let type: any = 'image';
              if (selectedFile) {
                  const processed = await processMediaFile(selectedFile, 100);
                  url = processed.url;
                  type = processed.type;
              }
              onAddPhoto(targetId, {
                  id: Math.random().toString(36).substring(2, 15),
                  url,
                  type,
                  category: 'pizza',
                  date: Date.now(),
                  caption: postCaption
              });
          }
          closePostModal();
      } catch (err) { alert("Erro ao publicar."); } finally { setIsUploading(true); setIsUploading(false); }
  };

  const closePostModal = () => {
      setIsPostModalOpen(false);
      setPostCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsPollMode(false);
      setPollQuestion('');
      setPollOptions(['', '']);
  };

  const renderPoll = (pizzaId: number | string, item: MediaItem) => {
      if (!item.poll) return null;
      const totalVotes = Object.values(item.poll.votes).length;
      const myVotes = item.poll.votes[currentUser.nickname] || [];

      return (
          <div className="space-y-3 mt-2">
              {item.poll.options.map(opt => {
                  const optionVotes = Object.values(item.poll!.votes).filter(v => v.includes(opt.id)).length;
                  const percent = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                  const isSelected = myVotes.includes(opt.id);

                  return (
                      <button 
                        key={opt.id}
                        onClick={() => onPollVote(pizzaId, item.id, isSelected ? myVotes.filter(id => id !== opt.id) : (item.poll!.allowMultiple ? [...myVotes, opt.id] : [opt.id]))}
                        className={`w-full relative h-12 rounded-xl border-2 transition-all overflow-hidden group ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                      >
                          <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isSelected ? 'bg-orange-200/50 dark:bg-orange-500/20' : 'bg-slate-100 dark:bg-slate-700/50'}`} style={{ width: `${percent}%` }}></div>
                          <div className="relative z-10 px-4 h-full flex items-center justify-between font-bold text-sm">
                              <span className="flex items-center gap-2">
                                  {isSelected && <Check size={16} className="text-orange-600" />}
                                  {opt.text}
                              </span>
                              <span className="text-xs opacity-60">{percent.toFixed(0)}%</span>
                          </div>
                      </button>
                  );
              })}
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mt-2">
                  {totalVotes} Votos computados • {item.poll.allowMultiple ? 'Múltipla escolha' : 'Escolha única'}
              </p>
          </div>
      );
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${mode === 'news' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-orange-500 text-white shadow-orange-500/20'} shadow-lg`}>
                {mode === 'news' ? <Newspaper size={24} /> : <Megaphone size={24} className="animate-wiggle" />}
            </div>
            <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">
                    {mode === 'news' ? t.news : t.avisos}
                </h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Atualizado em tempo real</span>
            </div>
        </div>
      </div>

      {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 border-2 border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-md">
                      <ShieldCheck size={20} className="text-blue-400" />
                  </div>
                  <button onClick={() => { setIsPollMode(false); setIsPostModalOpen(true); }} className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-2xl px-5 text-left text-slate-400 font-bold text-sm hover:bg-slate-100 transition-colors">
                      {mode === 'news' ? 'O que os jurados precisam saber?' : 'Publique um aviso importante...'}
                  </button>
              </div>
              <div className="flex gap-2 border-t border-slate-50 dark:border-slate-700 pt-3">
                  <button onClick={() => { setIsPollMode(false); setIsPostModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 font-black text-xs uppercase tracking-widest transition-all">
                      <ImageIcon size={16} /> Foto/Vídeo
                  </button>
                  <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 my-auto"></div>
                  <button onClick={() => { setIsPollMode(true); setIsPostModalOpen(true); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 font-black text-xs uppercase tracking-widest transition-all">
                      <ListFilter size={16} /> Criar Enquete
                  </button>
              </div>
          </div>
      )}

      {mode === 'news' && leader && (
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Pizza size={120} /></div>
              <div className="relative z-10 flex items-center justify-between">
                  <div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Competição Ativa</span>
                      <h3 className="text-3xl font-black leading-tight">Pizza #{leader.id}</h3>
                      <p className="text-blue-100 font-bold">Chef {pizzas.find(p => p.id === leader.id)?.notes || 'Mestre'}</p>
                  </div>
                  <div className="text-right">
                      <div className="text-4xl font-black">{(getSum(leader.beautyScores) + getSum(leader.tasteScores)).toFixed(1)}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Pontos Totais</span>
                  </div>
              </div>
          </div>
      )}

      <div className="space-y-6">
          {feedItems.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Info size={48} className="text-slate-300" />
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhuma publicação recente</p>
              </div>
          ) : (
              visibleFeedItems.map(({ pizzaId, item }) => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
                      <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${item.type === 'poll' ? 'bg-orange-100 border-orange-200 text-orange-600' : 'bg-blue-600 border-white text-white shadow-md'}`}>
                                  {item.type === 'poll' ? <ListFilter size={20} /> : <ShieldCheck size={20} />}
                              </div>
                              <div>
                                  <span className="block font-black text-slate-800 dark:text-slate-100 text-sm leading-none">
                                      {item.type === 'poll' ? 'Enquete Oficial' : 'Administrador'}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 block">{getRelativeTime(item.date)}</span>
                              </div>
                          </div>
                          {isAdmin && (
                              <button onClick={() => window.confirm("Excluir postagem?") && onDeletePhoto(pizzaId, item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={18} />
                              </button>
                          )}
                      </div>

                      <div className="px-6 pb-6">
                          {item.caption && <p className={`text-slate-800 dark:text-slate-200 font-bold mb-4 ${item.type === 'poll' ? 'text-lg tracking-tight' : 'text-sm leading-relaxed'}`}>{item.caption}</p>}
                          
                          {item.url && (
                              <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 mb-4 shadow-inner">
                                  {item.type === 'video' ? <video src={item.url} controls className="w-full max-h-[400px] object-cover" /> : <img src={item.url} className="w-full max-h-[400px] object-cover" />}
                              </div>
                          )}

                          {item.type === 'poll' && renderPoll(pizzaId, item)}
                      </div>

                      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
                          <button onClick={() => onReact(item.id, '❤️')} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${socialData.likes[item.id]?.[currentUser.nickname] ? 'bg-red-50 text-red-500 shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>
                              <Heart size={18} className={socialData.likes[item.id]?.[currentUser.nickname] ? 'fill-current' : ''} />
                              <span className="text-xs font-black">{Object.keys(socialData.likes[item.id] || {}).length}</span>
                          </button>
                          <div className="flex items-center gap-2 text-slate-400">
                              <MessageCircle size={18} />
                              <span className="text-xs font-black">{socialData.comments[item.id]?.length || 0}</span>
                          </div>
                      </div>
                  </div>
              ))
          )}
          {displayCount < feedItems.length && <div ref={loaderRef} className="py-10 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>}
      </div>

      {isPostModalOpen && (
          <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">{isPollMode ? 'Nova Enquete' : 'Nova Postagem'}</h3>
                      <button onClick={closePostModal} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 transition-colors"><X size={20}/></button>
                  </div>

                  <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
                      {isPollMode ? (
                          <>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pergunta da Enquete</label>
                                  <textarea autoFocus value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none font-bold text-lg dark:text-white transition-all" rows={2} placeholder="Ex: Qual a melhor pizza de hoje?" />
                              </div>
                              <div className="space-y-3">
                                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Opções de Resposta</label>
                                  {pollOptions.map((opt, i) => (
                                      <div key={i} className="flex gap-2">
                                          <input value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm dark:text-white" placeholder={`Opção ${i + 1}`} />
                                          {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>}
                                      </div>
                                  ))}
                                  <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all font-black text-[10px] uppercase flex items-center justify-center gap-2"><Plus size={14}/> Adicionar Opção</button>
                              </div>
                              <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl cursor-pointer group">
                                  <input type="checkbox" checked={pollAllowMultiple} onChange={e => setPollAllowMultiple(e.target.checked)} className="w-5 h-5 rounded border-none bg-slate-200 text-orange-500 focus:ring-0 transition-all" />
                                  <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Permitir múltiplas escolhas</span>
                              </label>
                          </>
                      ) : (
                          <>
                              <textarea autoFocus value={postCaption} onChange={e => setPostCaption(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-lg dark:text-white transition-all" rows={3} placeholder="Escreva algo sobre o torneio..." />
                              {previewUrl ? (
                                  <div className="relative rounded-3xl overflow-hidden border-4 border-slate-100 dark:border-slate-800">
                                      <img src={previewUrl} className="w-full aspect-video object-cover" />
                                      <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full"><X size={16}/></button>
                                  </div>
                              ) : (
                                  <label className="w-full py-10 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-slate-400 hover:text-blue-500">
                                      <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                                      <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform"><Plus size={32}/></div>
                                      <span className="font-black text-[10px] uppercase tracking-[0.2em]">Adicionar Mídia</span>
                                  </label>
                              )}
                          </>
                      )}
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={handlePostSubmit}
                        disabled={isUploading}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isPollMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 dark:bg-blue-600 hover:bg-black'} text-white`}
                      >
                          {isUploading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18}/> Publicar no Feed</>}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
