
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PizzaData, SocialData, MediaItem, UserAccount, Comment, PollData } from '../types';
import { Info, Heart, MessageCircle, Trash2, X, Check, Image as ImageIcon, Loader2, Send, ShieldCheck, Megaphone, Newspaper, Plus, ListFilter, Camera, Clock, PlusCircle, MinusCircle, Sparkles, Pencil } from 'lucide-react';
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
  onReplyReact: (mediaId: string, commentId: string, replyId: string, emoji: string) => void;
  onReplyToCommentAction?: (mediaId: string, commentId: string, text: string) => void;
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
  onPollVote: (pizzaId: number | string, mediaId: string, selectedOptions: string[]) => void;
  mode?: 'news' | 'avisos';
  uiScale?: number;
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

export const NewsFeed: React.FC<NewsFeedProps> = ({ 
    pizzas, userId, onAddPhoto, onDeletePhoto,
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, language, currentUser, onPollVote, onUpdateCaption,
    mode = 'news', uiScale = 1
}) => {
  const t = translations[language];
  const isAdmin = userId.toLowerCase() === '@leonardo';
  const isMaxScale = uiScale >= 1.3;

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  
  // Edit States
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostCaption, setEditPostCaption] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<{mediaId: string, commentId: string} | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postType, setPostType] = useState<'news' | 'poll'>('news');
  const [postCaption, setPostCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const feedItems = useMemo(() => {
      return pizzas.flatMap(p => (p.media || [])
        .filter(item => !item.hiddenFromFeed)
        .filter(item => {
            if (mode === 'news') return item.type !== 'poll';
            if (mode === 'avisos') return item.type === 'poll';
            return true;
        })
        .map(item => ({ pizzaId: p.id, item: item }))
      ).sort((a, b) => (b.item.date || 0) - (a.item.date || 0));
  }, [pizzas, mode]);

  const handleAddPollOption = () => {
      if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
      if (pollOptions.length > 2) {
          const newOpts = [...pollOptions];
          newOpts.splice(index, 1);
          setPollOptions(newOpts);
      }
  };

  const handlePostSubmit = async () => {
      const targetId = pizzas[0]?.id;
      if (!targetId) return;
      setIsUploading(true);
      try {
          let url = '';
          if (postType === 'news' && selectedFile) {
              const res = await processMediaFile(selectedFile, 50, setUploadProgress);
              url = res.url;
          }

          const mediaItem: MediaItem = {
              id: Math.random().toString(36).substring(2, 15),
              url,
              type: postType as any,
              category: 'pizza',
              date: Date.now(),
              caption: postCaption
          };

          if (postType === 'poll') {
              mediaItem.poll = {
                  question: postCaption,
                  options: pollOptions.filter(o => o.trim() !== '').map((o, idx) => ({ id: `opt-${idx}`, text: o })),
                  votes: {},
                  allowMultiple: false
              };
          }

          onAddPhoto(targetId, mediaItem);
          resetModal();
      } catch (err) { alert("Erro ao postar."); } finally { setIsUploading(false); }
  };

  const resetModal = () => {
      setIsPostModalOpen(false);
      setPostCaption('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setPollOptions(['', '']);
      setPostType('news');
  };

  const handleDeleteItem = (pizzaId: string | number, mediaId: string) => {
      if (confirm("Deseja apagar esta publicação do Feed?")) {
          onDeletePhoto(pizzaId, mediaId);
      }
  };

  const handleStartEditPost = (item: MediaItem) => {
      setEditingPostId(item.id);
      setEditPostCaption(item.caption || '');
  };

  const handleSaveEditPost = (pizzaId: string | number, mediaId: string) => {
      onUpdateCaption(pizzaId, mediaId, editPostCaption);
      setEditingPostId(null);
  };

  const handleStartEditComment = (mediaId: string, comment: Comment) => {
      setEditingCommentId({ mediaId, commentId: comment.id });
      setEditCommentText(comment.text);
  };

  const handleSaveEditComment = () => {
      if (!editingCommentId) return;
      onEditComment(editingCommentId.mediaId, editingCommentId.commentId, editCommentText);
      setEditingCommentId(null);
  };

  const renderPoll = (pizzaId: string | number, item: MediaItem) => {
      if (!item.poll) return null;
      const poll = item.poll;
      const allVotes = Object.values(poll.votes).flat();
      const totalVotes = allVotes.length;
      const userVotes = poll.votes[currentUser.nickname] || [];

      return (
          <div className="space-y-2 mt-4">
              {poll.options.map((opt) => {
                  const optVotes = allVotes.filter(v => v === opt.id).length;
                  const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                  const isSelected = userVotes.includes(opt.id);

                  return (
                      <button 
                        key={opt.id}
                        onClick={() => onPollVote(pizzaId, item.id, [opt.id])}
                        className={`w-full relative h-10 rounded-xl overflow-hidden border-0 transition-all duration-500 ${isSelected ? 'bg-indigo-50/20' : 'bg-slate-100 dark:bg-slate-800'}`}
                      >
                          <div 
                            className={`absolute inset-0 transition-all duration-1000 ease-out ${isSelected ? 'bg-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700'}`}
                            style={{ width: `${percentage}%`, opacity: 0.4 }}
                          />
                          <div className="absolute inset-0 px-4 flex items-center justify-between">
                              <span className={`text-[10px] font-black uppercase tracking-tight ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{opt.text}</span>
                              <span className="text-[9px] font-mono font-black opacity-50">{percentage.toFixed(0)}%</span>
                          </div>
                      </button>
                  );
              })}
              <p className="text-[8px] font-black text-slate-400 uppercase text-center tracking-widest mt-1">{totalVotes} votos registrados</p>
          </div>
      );
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 animate-fade-in-up">
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${mode === 'news' ? 'bg-indigo-600' : 'bg-orange-500'} text-white rotate-2`}>
                {mode === 'news' ? <Newspaper size={20} /> : <Megaphone size={20} />}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">{mode === 'news' ? 'Feed Social' : 'Avisos News'}</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setIsPostModalOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all">
            <Plus size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="space-y-6">
          {feedItems.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 bg-white/60 dark:bg-slate-900/40 rounded-[3rem] border-0">
                  <Sparkles size={40} className="text-slate-300 animate-pulse" />
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nada postado ainda</p>
              </div>
          ) : (
              feedItems.map(({ pizzaId, item }) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-0 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all group relative">
                      
                      {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2 z-20">
                              <button 
                                onClick={() => handleStartEditPost(item)}
                                className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white shadow-md"
                              >
                                  <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(pizzaId, item.id)}
                                className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-md"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      )}

                      <div className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'poll' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                              {item.type === 'poll' ? <ListFilter size={18} /> : <ShieldCheck size={18} />}
                          </div>
                          <div>
                              <span className="block font-black text-slate-800 dark:text-white text-[13px] uppercase tracking-tighter">{item.type === 'poll' ? 'Votação Aberta' : 'Leonardo Admin'}</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={8}/> {getRelativeTime(item.date)}</span>
                          </div>
                      </div>

                      <div className="px-5 pb-5">
                          {editingPostId === item.id ? (
                              <div className="mb-4 space-y-2">
                                  <textarea 
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[13px] font-bold outline-none border-2 border-indigo-500"
                                    value={editPostCaption}
                                    onChange={(e) => setEditPostCaption(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex gap-2">
                                      <button onClick={() => setEditingPostId(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-black text-[9px] uppercase">Cancelar</button>
                                      <button onClick={() => handleSaveEditPost(pizzaId, item.id)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase">Salvar</button>
                                  </div>
                              </div>
                          ) : (
                              item.caption && <p className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-[15px] leading-tight tracking-tight whitespace-pre-wrap">{item.caption}</p>
                          )}
                          
                          {item.type === 'poll' ? renderPoll(pizzaId, item) : (
                              item.url && (
                                  <div className="rounded-[2rem] overflow-hidden bg-white shadow-inner border-0">
                                      <img src={item.url} className={`w-full object-cover transition-transform duration-700 hover:scale-105 ${isMaxScale ? '' : 'max-h-[350px]'}`} loading="lazy" />
                                  </div>
                              )
                          )}
                      </div>

                      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-transparent flex items-center justify-between">
                        <div className="flex gap-4">
                            <button onClick={() => onReact(item.id, '❤️')} className={`flex items-center gap-1.5 transition-all active:scale-125 ${socialData.likes[item.id]?.[currentUser.nickname] ? 'text-red-500' : 'text-slate-400'}`}>
                                <Heart size={20} className={socialData.likes[item.id]?.[currentUser.nickname] ? 'fill-current' : ''} />
                                <span className="text-[11px] font-black">{Object.keys(socialData.likes[item.id] || {}).length}</span>
                            </button>
                            <button onClick={() => setExpandedComments(prev => ({...prev, [item.id]: !prev[item.id]}))} className={`flex items-center gap-1.5 text-slate-400 transition-all hover:text-indigo-500`}>
                                <MessageCircle size={20} />
                                <span className="text-[11px] font-black">{socialData.comments[item.id]?.length || 0}</span>
                            </button>
                        </div>
                      </div>

                      {(expandedComments[item.id] || isMaxScale) && (
                        <div className="bg-white dark:bg-slate-900 p-5 border-t border-transparent animate-in slide-in-from-top-2">
                             <div className={`space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2 ${isMaxScale ? '' : 'max-h-60'}`}>
                                {socialData.comments[item.id]?.length === 0 ? (
                                    <p className="text-[9px] text-slate-400 uppercase font-black text-center py-4">Nenhum comentário ainda</p>
                                ) : (
                                    socialData.comments[item.id]?.map(c => {
                                        const isAuthor = c.user === currentUser.nickname;
                                        const canModify = isAuthor || isAdmin;
                                        
                                        return (
                                            <div key={c.id} className="group/comment flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl relative">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-black text-[9px] uppercase text-indigo-500">{c.user}</span>
                                                    {canModify && (
                                                        <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                            <button onClick={() => handleStartEditComment(item.id, c)} className="text-slate-400 hover:text-indigo-600"><Pencil size={12}/></button>
                                                            <button onClick={() => confirm("Apagar comentário?") && onDeleteComment(item.id, c.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={12}/></button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingCommentId?.commentId === c.id ? (
                                                    <div className="space-y-1 mt-1">
                                                        <input 
                                                            className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg text-[11px] font-bold outline-none border border-indigo-400"
                                                            value={editCommentText}
                                                            onChange={(e) => setEditCommentText(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setEditingCommentId(null)} className="text-[8px] font-black text-slate-400">CANCELAR</button>
                                                            <button onClick={handleSaveEditComment} className="text-[8px] font-black text-indigo-600">SALVAR</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="font-bold text-[11px] text-slate-700 dark:text-slate-300 leading-tight">{c.text}</p>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                             </div>
                             <div className="flex gap-2">
                                <input className="flex-1 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Comentar..." value={commentInput[item.id] || ''} onChange={e => setCommentInput({...commentInput, [item.id]: e.target.value})} onKeyDown={e => e.key === 'Enter' && (onAddComment(item.id, commentInput[item.id]), setCommentInput({...commentInput, [item.id]: ''}))} />
                                <button onClick={() => (onAddComment(item.id, commentInput[item.id]), setCommentInput({...commentInput, [item.id]: ''}))} className="p-3 bg-indigo-600 text-white rounded-xl active:scale-95"><Send size={18} /></button>
                             </div>
                        </div>
                      )}
                  </div>
              ))
          )}
      </div>

      {isPostModalOpen && (
          <div className="fixed inset-0 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 animate-in fade-in" onClick={resetModal}>
              <div 
                className="bg-white dark:bg-slate-800 w-full max-w-[310px] rounded-[2.2rem] shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[88vh] relative"
                onClick={e => e.stopPropagation()}
              >
                  {/* HEADER - LIMPO SEM BORDAS */}
                  <div className="p-3 border-b border-transparent flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg rotate-3">
                            <Plus size={14} strokeWidth={3} />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-slate-800 dark:text-white">Novo Post</h3>
                      </div>
                      <button onClick={resetModal} className="p-1 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 transition-all text-slate-500 dark:text-slate-300"><X size={14}/></button>
                  </div>

                  {/* SELETOR - SUAVE */}
                  <div className="flex p-0.5 gap-0.5 bg-slate-100 dark:bg-slate-900 mx-3 my-2.5 rounded-lg shrink-0">
                      <button onClick={() => setPostType('news')} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${postType === 'news' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}>Normal</button>
                      <button onClick={() => setPostType('poll')} className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${postType === 'poll' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}>Enquete</button>
                  </div>

                  {/* CONTEÚDO - SEM BORDAS */}
                  <div className="px-4 pb-3 space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      <div className="space-y-1">
                        <label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">{postType === 'news' ? 'Legenda' : 'Pergunta'}</label>
                        <textarea 
                            value={postCaption} 
                            onChange={e => setPostCaption(e.target.value)} 
                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-0 rounded-xl outline-none font-bold text-xs h-20 transition-all shadow-inner text-slate-800 dark:text-white resize-none" 
                            placeholder={postType === 'news' ? "Escreva aqui..." : "Tema da enquete?"} 
                        />
                      </div>

                      {postType === 'news' ? (
                        <div className="space-y-1">
                            <label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Mídia</label>
                            <label className="w-full h-30 border-0 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all overflow-hidden relative group bg-slate-50 dark:bg-slate-900">
                                <input type="file" className="hidden" accept="image/*" onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) { setSelectedFile(f); setPreviewUrl(URL.createObjectURL(f)); }
                                }} />
                                {previewUrl ? (
                                    <img src={previewUrl} className="h-full w-full object-cover" />
                                ) : (
                                    <>
                                        <div className="p-2.5 bg-white dark:bg-slate-700 rounded-full shadow-md">
                                            <Camera size={20} className="text-indigo-500" />
                                        </div>
                                        <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Anexar Foto</span>
                                    </>
                                )}
                            </label>
                        </div>
                      ) : (
                          <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-500">
                             <label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Opções</label>
                             <div className="grid gap-1">
                                {pollOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-1.5 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 80}ms` }}>
                                        <input 
                                            className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-0 rounded-lg text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white" 
                                            placeholder={`Opção ${idx + 1}`}
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...pollOptions];
                                                newOpts[idx] = e.target.value;
                                                setPollOptions(newOpts);
                                            }}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button onClick={() => handleRemovePollOption(idx)} className="p-1 text-red-400 hover:text-red-600 transition-all"><MinusCircle size={16}/></button>
                                        )}
                                    </div>
                                ))}
                             </div>
                             {pollOptions.length < 5 && (
                                 <button onClick={handleAddPollOption} className="w-full py-2 border-0 rounded-lg flex items-center justify-center gap-1.5 text-indigo-400 bg-indigo-50 dark:bg-slate-700 transition-all">
                                     <PlusCircle size={12} />
                                     <span className="text-[7px] font-black uppercase tracking-widest">Nova Opção</span>
                                 </button>
                             )}
                          </div>
                      )}
                  </div>
                  
                  {/* FOOTER - LIMPO */}
                  <div className="p-3 bg-white dark:bg-slate-800 border-t border-transparent shrink-0">
                      {isUploading && (
                        <div className="mb-2 space-y-1">
                            <div className="flex justify-between text-[7px] font-black uppercase text-indigo-500">
                                <span className="flex items-center gap-1"><Loader2 size={6} className="animate-spin" /> Postando...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        </div>
                      )}
                      <button 
                        onClick={handlePostSubmit} 
                        disabled={isUploading || !postCaption || (postType === 'poll' && pollOptions.filter(o => o.trim() !== '').length < 2)} 
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.1em] shadow-lg active:scale-[0.98] disabled:opacity-30 transition-all flex items-center justify-center gap-1.5"
                      >
                          {isUploading ? <Loader2 className="animate-spin" size={14}/> : <><Send size={14}/> {postType === 'news' ? 'Publicar' : 'Lançar'}</>}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
