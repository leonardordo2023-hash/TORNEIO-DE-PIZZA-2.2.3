import React, { useRef, useState, useMemo, useCallback } from 'react';
import { PizzaData, MediaItem, MediaCategory, SocialData, UserAccount, Comment, Reply } from '../types';
import { processMediaFile } from '../services/imageService';
import { Camera, Image as ImageIcon, Loader2, Trash2, Download, Video, Trophy, Users, Pizza, Heart, Send, User, X, Pencil, Check, MessageCircle, Type, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, LayoutGrid, Grip, Filter, ArrowUp, ArrowDown, Film, Plus, ShieldCheck, Clock, Bell, Sparkles, Maximize2, ExternalLink } from 'lucide-react';
import JSZip from 'jszip';
import { Language, translations } from '../services/translations';

interface UnifiedPhotoAlbumProps {
  pizzas: PizzaData[];
  userId: string;
  onAddMedia: (id: number | string, item: MediaItem) => void;
  onDeleteMedia: (id: number | string, mediaId: string) => void;
  socialData: SocialData;
  onAddComment: (mediaId: string, text: string) => void;
  onEditComment: (mediaId: string, commentId: string, newText: string) => void;
  onDeleteComment: (mediaId: string, commentId: string) => void;
  onReact: (mediaId: string, emoji: string) => void;
  onCommentReact: (mediaId: string, commentId: string, emoji: string) => void;
  onReplyToComment: (mediaId: string, commentId: string, text: string) => void;
  onReplyReact: (mediaId: string, commentId: string, replyId: string, emoji: string) => void;
  onReplyEdit?: (mediaId: string, commentId: string, replyId: string, newText: string) => void;
  onReplyDelete?: (mediaId: string, commentId: string, replyId: string) => void;
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
  onAlertAdmin?: () => void;
  uiScale?: number;
  canPost?: boolean;
}

const getRelativeTime = (timestamp: number | undefined) => {
  if (!timestamp) return 'Recente';
  const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 84600) return `há ${Math.floor(diffInSeconds / 3600)} h`;
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const UnifiedPhotoAlbum: React.FC<UnifiedPhotoAlbumProps> = ({ 
    pizzas, userId, onAddMedia, onDeleteMedia, 
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, onUpdateCaption, language, currentUser, onAlertAdmin,
    onReplyToComment, onReplyReact, onReplyEdit, onReplyDelete,
    uiScale = 1, canPost = false
}) => {
  const t = translations[language];
  const isAdmin = userId.toLowerCase() === '@programação';
  
  const isMaxScale = uiScale >= 1.3;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isZipping, setIsZipping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('pizza');
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [replyToId, setReplyToId] = useState<{mediaId: string, commentId: string} | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [zoomedMedia, setZoomedMedia] = useState<MediaItem | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{url: string, type: string}[]>([]);

  // Edit states
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [editCaptionValue, setEditCaptionValue] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<{commentId: string, replyId: string} | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  const allMedia = useMemo(() => {
    return pizzas.flatMap(p => (p.media || [])
        .filter(m => m.hiddenFromFeed === true) 
        .map(m => ({ ...m, pizzaId: p.id }))
    ).filter(m => m.category === activeCategory)
     .sort((a, b) => b.date - a.date);
  }, [pizzas, activeCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setStagedFiles(prev => [...prev, ...files]);
    
    const newPreviews = files.map((file: File) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image'
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handlePostSubmit = async () => {
    const targetId = pizzas[0]?.id;
    if (!targetId || stagedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
        for (let i = 0; i < stagedFiles.length; i++) {
            const file = stagedFiles[i];
            const { url, type } = await processMediaFile(file, 50, (percent) => {
                const totalPercent = Math.round(((i / stagedFiles.length) * 100) + (percent / stagedFiles.length));
                setUploadProgress(totalPercent);
            });
            onAddMedia(targetId, { 
                id: Math.random().toString(36).substring(2, 15), 
                url, type, category: activeCategory, 
                date: Date.now(), caption: uploadCaption, hiddenFromFeed: true
            });
        }
        setIsUploadModalOpen(false);
        setUploadCaption('');
        setStagedFiles([]);
        setPreviews([]);
    } catch (err) { alert("Erro no processamento."); } finally { setIsUploading(false); }
  };

  const handleSendReply = (mediaId: string, commentId: string) => {
      if (!replyInput.trim()) return;
      onReplyToComment(mediaId, commentId, replyInput);
      setReplyInput('');
      setReplyToId(null);
  };

  const handleDownloadAll = async () => {
    if (allMedia.length === 0) return;
    setIsZipping(true);
    try {
        const zip = new JSZip();
        
        const promises = allMedia.map(async (item, index) => {
            const ext = item.type === 'video' ? 'mp4' : 'jpg';
            const filename = `torneio-${activeCategory}-${index + 1}.${ext}`;
            
            try {
                if (item.url.startsWith('data:')) {
                    // Extract base64 part
                    const base64Data = item.url.split(',')[1];
                    zip.file(filename, base64Data, { base64: true });
                } else {
                    const response = await fetch(item.url);
                    const blob = await response.blob();
                    zip.file(filename, blob);
                }
            } catch (err) {
                console.error("Erro ao adicionar arquivo ao ZIP:", err);
            }
        });

        await Promise.all(promises);

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `album-${activeCategory}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) { 
        alert("Erro ao criar arquivo ZIP."); 
    } finally { 
        setIsZipping(false); 
    }
  };

  const handleDownloadSingle = async (item: MediaItem) => {
      try {
          const ext = item.type === 'video' ? 'mp4' : 'jpg';
          const filename = `pizza-${item.category}-${item.date}.${ext}`;
          
          if (item.url.startsWith('data:')) {
              const link = document.createElement('a');
              link.href = item.url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          } else {
              const response = await fetch(item.url);
              const blob = await response.blob();
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      } catch (e) {
          alert("Erro ao baixar imagem.");
      }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 animate-fade-in-up">
      <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-0">
          <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
                        <ImageIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">{t.album}</h2>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1 block">{allMedia.length} Itens Salvos</span>
                    </div>
                </div>
                {canPost && (
                  <button onClick={() => setIsUploadModalOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all">
                    <Plus size={20} strokeWidth={3} />
                  </button>
                )}
              </div>
              <div className="flex justify-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[ { id: 'pizza', label: 'Pizzas', icon: <Pizza size={10}/> }, { id: 'champion', label: 'Campeões', icon: <Trophy size={10}/> }, { id: 'team', label: 'Equipe', icon: <Users size={10}/> } ].map((cat) => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeCategory === cat.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-indigo-400'}`}>
                        {cat.icon} {cat.label}
                      </button>
                  ))}
              </div>
              <div className="flex gap-2">
                 <button onClick={handleDownloadAll} disabled={isZipping || allMedia.length === 0} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50">
                    {isZipping ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Baixar Tudo
                 </button>
                 {isAdmin && (
                    <button onClick={onAlertAdmin} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all active:scale-95">
                       <Bell size={12} /> Notificar
                    </button>
                 )}
              </div>
          </div>
      </div>

      <div className="space-y-6">
          {allMedia.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 bg-white/60 dark:bg-slate-900/40 rounded-[3rem]">
                  <Sparkles size={40} className="text-slate-300 animate-pulse" />
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhuma foto nesta categoria</p>
              </div>
          ) : (
              allMedia.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-lg overflow-hidden group relative">
                      {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2 z-20">
                              <button onClick={() => { setEditingMediaId(item.id); setEditCaptionValue(item.caption || ''); }} className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white shadow-md">
                                  <Pencil size={16} />
                              </button>
                              <button onClick={() => confirm("Apagar da galeria?") && onDeleteMedia(item.pizzaId, item.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-md">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      )}
                      <div className="p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center"><ShieldCheck size={18} /></div>
                          <div>
                              <span className="block font-black text-slate-800 dark:text-white text-[13px] uppercase tracking-tighter">Galeria Oficial</span>
                              <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={8}/> {getRelativeTime(item.date)}</span>
                          </div>
                      </div>
                      <div className="px-5 pb-5">
                          {editingMediaId === item.id ? (
                              <div className="mb-4 space-y-2">
                                  <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[13px] font-bold outline-none border-2 border-indigo-500" value={editCaptionValue} onChange={(e) => setEditCaptionValue(e.target.value)} rows={3}/>
                                  <div className="flex gap-2">
                                      <button onClick={() => setEditingMediaId(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-black text-[9px] uppercase">Cancelar</button>
                                      <button onClick={() => { onUpdateCaption(item.pizzaId, item.id, editCaptionValue); setEditingMediaId(null); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase">Salvar</button>
                                  </div>
                              </div>
                          ) : (
                              item.caption && <p className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-[15px] leading-tight tracking-tight whitespace-pre-wrap">{item.caption}</p>
                          )}
                          <div 
                            className="rounded-[2rem] overflow-hidden bg-black shadow-inner border-0 relative cursor-pointer group/img"
                            onClick={() => setZoomedMedia(item)}
                          >
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors z-10 flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                    <Maximize2 size={24} />
                                </div>
                              </div>
                              <img src={item.url} className={`w-full object-contain transition-transform duration-700 group-hover/img:scale-105 ${isMaxScale ? '' : 'max-h-[400px]'}`} loading="lazy" />
                          </div>
                      </div>
                      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-transparent flex items-center justify-between">
                        <div className="flex gap-4">
                            <button onClick={() => onReact(item.id, '❤️')} className={`flex items-center gap-1.5 transition-all active:scale-125 ${socialData.likes[item.id]?.[currentUser.nickname] ? 'text-red-500' : 'text-slate-400'}`}>
                                <Heart size={20} className={socialData.likes[item.id]?.[currentUser.nickname] ? 'fill-current' : ''} />
                                <span className="text-[11px] font-black">{Object.keys(socialData.likes[item.id] || {}).length}</span>
                            </button>
                            <button onClick={() => setExpandedComments(prev => ({...prev, [item.id]: !prev[item.id]}))} className={`flex items-center gap-1.5 text-slate-400 transition-all hover:text-indigo-500`}><MessageCircle size={20} /><span className="text-[11px] font-black">{socialData.comments[item.id]?.length || 0}</span></button>
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
                                        const hasLikedComment = c.reactions?.[currentUser.nickname] === '❤️';
                                        return (
                                            <div key={c.id} className="space-y-2">
                                                <div className="group/comment flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl relative">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-[9px] uppercase text-indigo-500">{c.user}</span>
                                                            <button onClick={() => onCommentReact(item.id, c.id, '❤️')} className={`p-1 transition-all ${hasLikedComment ? 'text-red-500 scale-110' : 'text-slate-300 hover:text-red-400'}`}><Heart size={10} fill={hasLikedComment ? "currentColor" : "none"} /></button>
                                                            {Object.keys(c.reactions || {}).length > 0 && <span className="text-[8px] font-black text-slate-400">{Object.keys(c.reactions || {}).length}</span>}
                                                        </div>
                                                        {canModify && (
                                                            <div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={12}/></button>
                                                                <button onClick={() => confirm("Apagar comentário?") && onDeleteComment(item.id, c.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={12}/></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {editingCommentId === c.id ? (
                                                        <div className="space-y-1 mt-1">
                                                            <input className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg text-[11px] font-bold outline-none border border-indigo-400" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus />
                                                            <div className="flex gap-2"><button onClick={() => setEditingCommentId(null)} className="text-[8px] font-black text-slate-400">CANCELAR</button><button onClick={() => { onEditComment(item.id, c.id, editCommentText); setEditingCommentId(null); }} className="text-[8px] font-black text-indigo-600">SALVAR</button></div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="font-bold text-[11px] text-slate-700 dark:text-slate-300 leading-tight">{c.text}</p>
                                                            <button onClick={() => setReplyToId({mediaId: item.id, commentId: c.id})} className="text-[8px] font-black text-slate-400 uppercase mt-1 hover:text-indigo-500 w-fit">Responder</button>
                                                        </>
                                                    )}
                                                </div>
                                                {c.replies && c.replies.length > 0 && (
                                                    <div className="ml-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                                                        {c.replies.map(r => {
                                                            const hasLikedReply = r.reactions?.[currentUser.nickname] === '❤️';
                                                            const isReplyAuthor = r.user === currentUser.nickname;
                                                            const canModifyReply = isReplyAuthor || isAdmin;
                                                            return (
                                                                <div key={r.id} className="bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-xl flex flex-col gap-1 relative group/reply">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-black text-[8px] uppercase text-indigo-400">{r.user}</span>
                                                                            <button onClick={() => onReplyReact(item.id, c.id, r.id, '❤️')} className={`p-1 transition-all ${hasLikedReply ? 'text-red-500 scale-110' : 'text-slate-300 hover:text-red-400'}`}><Heart size={8} fill={hasLikedReply ? "currentColor" : "none"} /></button>
                                                                            {Object.keys(r.reactions || {}).length > 0 && <span className="text-[7px] font-black text-slate-400">{Object.keys(r.reactions || {}).length}</span>}
                                                                        </div>
                                                                        {canModifyReply && (
                                                                            <div className="flex gap-2 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                                                <button onClick={() => { setEditingReplyId({commentId: c.id, replyId: r.id}); setEditReplyText(r.text); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={10}/></button>
                                                                                <button onClick={() => confirm("Apagar resposta?") && onReplyDelete?.(item.id, c.id, r.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={10}/></button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {editingReplyId?.replyId === r.id ? (
                                                                        <div className="space-y-1 mt-1">
                                                                            <input className="w-full bg-white dark:bg-slate-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-indigo-400" value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} autoFocus />
                                                                            <div className="flex gap-2"><button onClick={() => setEditingReplyId(null)} className="text-[7px] font-black text-slate-400">CANCELAR</button><button onClick={() => { onReplyEdit?.(item.id, c.id, r.id, editReplyText); setEditingReplyId(null); }} className="text-[7px] font-black text-indigo-600">SALVAR</button></div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">{r.text}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {replyToId?.commentId === c.id && (
                                                    <div className="ml-6 flex gap-2 animate-in slide-in-from-left-2">
                                                        <input className="flex-1 bg-slate-50 dark:bg-slate-800 border border-indigo-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none" placeholder={`Respondendo...`} value={replyInput} onChange={e => setReplyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply(item.id, c.id)} autoFocus />
                                                        <button onClick={() => handleSendReply(item.id, c.id)} className="p-2 bg-indigo-600 text-white rounded-lg"><Send size={12} /></button>
                                                        <button onClick={() => setReplyToId(null)} className="p-2 text-slate-400"><X size={12}/></button>
                                                    </div>
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

      {/* Floating Zoom / Lightbox */}
      {zoomedMedia && (
          <div className="fixed inset-0 z-[800] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
              {/* Controls Header */}
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[810] bg-gradient-to-b from-black/60 to-transparent">
                  <div className="flex items-center gap-3">
                      <span className="text-white font-bold text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">{zoomedMedia.category}</span>
                      <span className="text-white/60 text-xs font-mono">{getRelativeTime(zoomedMedia.date)}</span>
                  </div>
                  <button 
                    onClick={() => setZoomedMedia(null)} 
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110"
                  >
                      <X size={24} />
                  </button>
              </div>

              {/* Main Content */}
              <div className="flex-1 w-full h-full flex items-center justify-center p-4 relative" onClick={() => setZoomedMedia(null)}>
                  {zoomedMedia.type === 'video' ? (
                      <video 
                        src={zoomedMedia.url} 
                        controls 
                        autoPlay 
                        className="max-w-full max-h-[80vh] rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} 
                      />
                  ) : (
                      <img 
                        src={zoomedMedia.url} 
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none" 
                        onClick={(e) => e.stopPropagation()}
                      />
                  )}
              </div>

              {/* Download Button Footer */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[810]">
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingle(zoomedMedia);
                    }}
                    className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all group"
                  >
                      <Download size={20} className="group-hover:animate-bounce" /> Baixar Imagem
                  </button>
              </div>
          </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[400] glass bg-slate-950/80 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-5xl border border-white/20 overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Nova Mídia</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-2xl hover:bg-slate-300 transition-all"><X size={24}/></button>
              </div>
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <label className="w-full h-48 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange}/>
                      <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform shadow-sm"><Camera size={40} className="text-slate-400 group-hover:text-indigo-500" /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecionar Fotos</span>
                    </label>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descrição da Postagem</label>
                        <textarea className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-sm transition-all shadow-inner resize-none h-24" placeholder="Escreva algo legal sobre estas fotos..." value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} />
                    </div>
                  </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  {isUploading && (
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase text-indigo-500 tracking-widest"><span>Publicando...</span><span>{uploadProgress}%</span></div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}/></div>
                    </div>
                  )}
                  <button onClick={handlePostSubmit} disabled={isUploading || stagedFiles.length === 0} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all">{isUploading ? <Loader2 className="animate-spin" size={24}/> : 'Confirmar Postagem'}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
