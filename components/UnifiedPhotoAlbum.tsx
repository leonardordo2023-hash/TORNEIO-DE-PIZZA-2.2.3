
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PizzaData, MediaItem, MediaCategory, SocialData, UserAccount } from '../types';
import { processMediaFile } from '../services/imageService';
import { Camera, Image as ImageIcon, Loader2, Trash2, Download, Video, Trophy, Users, Pizza, Heart, Send, User, X, Pencil, Check, MessageCircle, Type, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, LayoutGrid, Grip, Filter, ArrowUp, ArrowDown, Film } from 'lucide-react';
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
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
}

interface MediaItemWithContext extends MediaItem {
    pizzaId: number | string;
}

export const UnifiedPhotoAlbum: React.FC<UnifiedPhotoAlbumProps> = ({ 
    pizzas, userId, onAddMedia, onDeleteMedia, 
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, onUpdateCaption, language, currentUser
}) => {
  const t = translations[language];
  const [isUploading, setIsUploading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('pizza');
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [showReactions, setShowReactions] = useState<string | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'standard' | 'compact'>('standard');
  
  // Filter & Sort State
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Animation State
  const [animatingHeart, setAnimatingHeart] = useState<string | null>(null);
  
  // Lightbox State
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // Comment ID
  const [editingComment, setEditingComment] = useState<{id: string, text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caption State
  const [editingCaption, setEditingCaption] = useState<string | null>(null); // Media ID
  const [captionText, setCaptionText] = useState('');

  // Check if current user is admin
  const isAdmin = userId.toLowerCase() === '@leonardo';

  // Filter ONLY items marked as hiddenFromFeed (which implies they were uploaded to Album)
  const allMedia = pizzas.flatMap(p => (p.media || [])
    .filter(m => m.hiddenFromFeed === true) 
    .map(m => ({ ...m, pizzaId: p.id }))
  );
  
  // Apply Filtering and Sorting
  const filteredMedia = allMedia
    .filter(m => m.category === activeCategory)
    .filter(m => filterType === 'all' || m.type === filterType)
    .sort((a, b) => {
        return sortOrder === 'desc' 
            ? b.date - a.date 
            : a.date - b.date;
    });

  const selectedMediaIndex = filteredMedia.findIndex(m => m.id === selectedMediaId);
  const selectedMedia = selectedMediaIndex >= 0 ? filteredMedia[selectedMediaIndex] : null;

  const triggerHeartAnimation = (mediaId: string) => {
      setAnimatingHeart(mediaId);
      setTimeout(() => setAnimatingHeart(null), 600);
  };

  const handleNext = useCallback(() => {
      if (selectedMediaIndex < filteredMedia.length - 1) {
          setSelectedMediaId(filteredMedia[selectedMediaIndex + 1].id);
          setIsZoomed(false);
      }
  }, [selectedMediaIndex, filteredMedia]);

  const handlePrev = useCallback(() => {
      if (selectedMediaIndex > 0) {
          setSelectedMediaId(filteredMedia[selectedMediaIndex - 1].id);
          setIsZoomed(false);
      }
  }, [selectedMediaIndex, filteredMedia]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!selectedMedia) return;
          
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') handlePrev();
          if (e.key === 'Escape') setSelectedMediaId(null);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, handleNext, handlePrev]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (target && activeMenu && !target.closest('.comment-menu')) {
            setActiveMenu(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const targetId = pizzas[0]?.id;
    if (!files || files.length === 0 || !targetId) return;
    setIsUploading(true);
    try {
        const fileArray = Array.from(files) as File[];
        await Promise.all(fileArray.map(async (file) => {
            const { url, type } = await processMediaFile(file, 100);
            onAddMedia(targetId, { 
                id: Math.random().toString(36).substring(2, 15), 
                url, 
                type, 
                category: activeCategory, 
                date: Date.now(),
                hiddenFromFeed: true
            });
        }));
    } catch (err) { alert("Erro ao processar: " + (err as Error).message); } finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDownloadAll = async () => {
    if (filteredMedia.length === 0) return;
    setIsZipping(true);
    try {
        const zip = new JSZip();
        filteredMedia.forEach((item, index) => { const base64Data = item.url.split(',')[1]; if (base64Data) zip.file(`torneio-${activeCategory}-${index + 1}.${item.type === 'video' ? 'mp4' : 'jpg'}`, base64Data, { base64: true }); });
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `album-${activeCategory}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) { alert("Erro ZIP."); } finally { setIsZipping(false); }
  };

  const handleAddCommentAction = (mediaId: string) => {
    const text = commentInput[mediaId];
    if (!text?.trim()) return;
    onAddComment(mediaId, text);
    setCommentInput(prev => ({ ...prev, [mediaId]: '' }));
  };
  
  const submitEdit = (mediaId: string) => {
      if (editingComment && editingComment.text.trim()) {
          onEditComment(mediaId, editingComment.id, editingComment.text);
          setEditingComment(null);
      }
  };

  const saveCaption = (pizzaId: number | string, mediaId: string) => {
      onUpdateCaption(pizzaId, mediaId, captionText);
      setEditingCaption(null);
  };

  const getMyReaction = (mediaId: string) => {
      const likesMap = socialData.likes[mediaId] || {};
      return likesMap[currentUser.nickname];
  };

  const getReactionCount = (mediaId: string) => {
      const likesMap = socialData.likes[mediaId] || {};
      return Object.keys(likesMap).length;
  };

  const categories = [
      { id: 'pizza', label: t.categories.pizza, icon: <Pizza size={16} /> },
      { id: 'champion', label: t.categories.champion, icon: <Trophy size={16} /> },
      { id: 'team', label: t.categories.team, icon: <Users size={16} /> },
  ];

  const reactions = [{ label: 'Amei', emoji: '❤️' }, { label: 'Delícia', emoji: '😋' }, { label: 'Uau', emoji: '😮' }, { label: 'Top', emoji: '🔥' }, { label: 'Pizza', emoji: '🍕' }];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[500px]">
      
      {/* LIGHTBOX MODAL */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-0 md:p-4 overflow-hidden" onClick={() => setSelectedMediaId(null)}>
            
            {selectedMediaIndex > 0 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-[110]"
                >
                    <ChevronLeft size={40} />
                </button>
            )}
            
            {selectedMediaIndex < filteredMedia.length - 1 && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-[110]"
                >
                    <ChevronRight size={40} />
                </button>
            )}

            <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                
                <div className="flex-1 w-full h-full flex flex-col items-center justify-center relative p-2 md:p-0">
                    
                    {selectedMedia.caption && !isZoomed && (
                         <div className="absolute top-4 z-20 bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full max-w-[90%] text-center">
                            <p className="text-white font-medium shadow-sm">{selectedMedia.caption}</p>
                        </div>
                    )}

                    <div 
                        className={`relative transition-all duration-300 ease-out cursor-pointer overflow-hidden rounded-lg bg-black/50 ${isZoomed ? 'scale-150 z-50' : 'scale-100'} ${animatingHeart === selectedMedia.id ? 'scale-105 brightness-110 shadow-orange-500/50 shadow-2xl' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                    >
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-60 scale-110 pointer-events-none" 
                            style={{ backgroundImage: `url(${selectedMedia.url})` }} 
                        />

                        {selectedMedia.type === 'video' ? (
                            <video src={selectedMedia.url} controls autoPlay className="relative z-10 max-w-full max-h-[85vh] shadow-2xl rounded-lg" onError={(e) => e.preventDefault()} />
                        ) : (
                            <img 
                                src={selectedMedia.url} 
                                className={`relative z-10 max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg select-none ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`} 
                                alt="Gallery"
                                onError={(e) => e.preventDefault()}
                            />
                        )}
                        
                        <div className="absolute bottom-4 right-4 text-white/50 pointer-events-none z-20">
                             {isZoomed ? <ZoomOut size={24}/> : <ZoomIn size={24} />}
                        </div>
                    </div>

                    {!isZoomed && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm p-2 rounded-full border border-white/20">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowReactions(showReactions === selectedMedia.id ? null : selectedMedia.id); }} 
                                className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 font-bold ${getMyReaction(selectedMedia.id) ? 'bg-white text-red-500' : 'bg-transparent text-white hover:bg-white/20'} ${animatingHeart === selectedMedia.id ? 'scale-125 bg-red-100 text-red-600' : ''}`}
                            >
                                <Heart size={20} className={`${getMyReaction(selectedMedia.id) ? "fill-red-500" : ""} ${animatingHeart === selectedMedia.id ? "fill-red-600 animate-bounce" : ""}`} />
                                {getReactionCount(selectedMedia.id) > 0 && <span className="text-lg">{getReactionCount(selectedMedia.id)}</span>}
                            </button>
                            
                            {showReactions === selectedMedia.id && (
                                <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white p-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                    {reactions.map(r => (
                                        <button 
                                            key={r.label} 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                onReact(selectedMedia.id, r.emoji); 
                                                setShowReactions(null); 
                                                triggerHeartAnimation(selectedMedia.id);
                                            }} 
                                            className="hover:scale-125 transition-transform text-2xl"
                                        >
                                            {r.emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {isAdmin && !isZoomed && (
                        <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingCaption(selectedMedia.id);
                            setCaptionText(selectedMedia.caption || '');
                        }}
                        className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 z-20"
                        title="Editar Legenda"
                        >
                            <Type size={16} />
                        </button>
                    )}

                    {editingCaption === selectedMedia.id && (
                        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="w-full max-w-sm bg-transparent">
                                <textarea
                                autoFocus
                                className="w-full bg-transparent text-white text-center text-lg font-bold border-b border-white/50 focus:border-white focus:outline-none placeholder:text-white/50 resize-none"
                                rows={3}
                                placeholder="Digite uma frase..."
                                value={captionText}
                                onChange={(e) => setCaptionText(e.target.value)}
                                />
                                <div className="flex justify-center gap-2 mt-4">
                                    <button onClick={() => saveCaption(selectedMedia.pizzaId, selectedMedia.id)} className="bg-white text-black px-4 py-1.5 rounded-full font-bold text-sm">Salvar</button>
                                    <button onClick={() => setEditingCaption(null)} className="text-white px-4 py-1.5 text-sm">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {!isZoomed && (
                    <div className="w-full md:w-80 h-[30vh] md:h-[90vh] bg-white dark:bg-slate-900 rounded-t-xl md:rounded-xl p-4 shadow-2xl overflow-y-auto flex flex-col absolute bottom-0 md:relative md:bottom-auto z-[100] animate-in slide-in-from-bottom-10 md:slide-in-from-right-10 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Heart size={16} className="text-red-500" /> {t.comments}</h3>
                            <button onClick={() => setSelectedMediaId(null)} className="md:hidden text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 space-y-3 mb-4 overflow-y-auto custom-scrollbar">
                            {socialData.comments[selectedMedia.id]?.length > 0 ? socialData.comments[selectedMedia.id].map(c => (
                                <div key={c.id} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg text-sm relative group border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{c.user}</span>
                                        
                                        {(currentUser.nickname === c.user || isAdmin) && !editingComment && (
                                            <div className="relative comment-menu">
                                                <button 
                                                    onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Pencil size={10} />
                                                </button>
                                                
                                                {activeMenu === c.id && (
                                                    <div className="absolute right-0 top-5 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 z-30 min-w-[100px] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <button onClick={() => { setEditingComment({ id: c.id, text: c.text }); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Editar</button>
                                                        <button onClick={() => { if (window.confirm("Apagar comentário?")) onDeleteComment(selectedMedia.id, c.id); setActiveMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Apagar</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {editingComment?.id === c.id ? (
                                        <div className="flex items-center gap-2">
                                            <input autoFocus className="flex-1 text-xs bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded px-1 py-1 outline-none dark:text-white" value={editingComment.text} onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })} onKeyDown={(e) => { if(e.key === 'Enter') submitEdit(selectedMedia.id); if(e.key === 'Escape') setEditingComment(null); }} />
                                            <button onClick={() => submitEdit(selectedMedia.id)} className="text-indigo-600 dark:text-indigo-400"><Check size={14} /></button>
                                            <button onClick={() => setEditingComment(null)} className="text-slate-400"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 dark:text-slate-300 break-words leading-snug">{c.text}</p>
                                    )}
                                </div>
                            )) : <div className="text-center text-slate-400 text-xs py-10 flex flex-col items-center"><MessageCircle className="mb-2 opacity-50" />Seja o primeiro a comentar</div>}
                        </div>
                        
                        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <input 
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder={t.commentPlaceholder}
                                value={commentInput[selectedMedia.id] || ''}
                                onChange={(e) => setCommentInput(prev => ({ ...prev, [selectedMedia.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCommentAction(selectedMedia.id)}
                            />
                            <button onClick={() => handleAddCommentAction(selectedMedia.id)} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <button onClick={() => setSelectedMediaId(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-[120] bg-black/20 hover:bg-black/50 p-2 rounded-full transition-colors hidden md:block">
                <X size={24} />
            </button>
        </div>
      )}

      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg"><ImageIcon size={20} /></div>
                <div><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{t.album}</h2></div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button 
                        onClick={() => setFilterType('all')} 
                        className={`p-1.5 rounded transition-all ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Todos"
                    >
                        <Filter size={16} />
                    </button>
                    <button 
                        onClick={() => setFilterType('image')} 
                        className={`p-1.5 rounded transition-all ${filterType === 'image' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Fotos"
                    >
                        <ImageIcon size={16} />
                    </button>
                    <button 
                        onClick={() => setFilterType('video')} 
                        className={`p-1.5 rounded transition-all ${filterType === 'video' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Vídeos"
                    >
                        <Film size={16} />
                    </button>
                    
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <button 
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} 
                        className={`p-1.5 rounded transition-all text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700`}
                        title={sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
                    >
                        {sortOrder === 'desc' ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-sm">
                    <button 
                        onClick={() => setViewMode('standard')} 
                        className={`p-1.5 rounded transition-all ${viewMode === 'standard' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        title="Visualização Padrão"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('compact')} 
                        className={`p-1.5 rounded transition-all ${viewMode === 'compact' ? 'bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        title="Grade Compacta"
                    >
                        <Grip size={16} />
                    </button>
                </div>

                {filteredMedia.length > 0 && <button onClick={handleDownloadAll} disabled={isZipping} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">{isZipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} <span className="hidden sm:inline">{t.download}</span></button>}
            </div>
        </div>
        <div className="flex p-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg gap-1 overflow-x-auto">
            {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id as any)} className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${activeCategory === cat.id ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>{cat.icon} {cat.label}</button>
            ))}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/30">
        
        {isAdmin && (
            <div className="mb-6">
                <input type="file" accept="image/*,video/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 py-4 text-white bg-slate-900 dark:bg-slate-700 rounded-xl text-base font-bold shadow-lg hover:scale-[1.01] transition-all disabled:opacity-70">
                    {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />} {t.upload} (Admin)
                </button>
            </div>
        )}

        <div className="flex-1">
            {filteredMedia.length > 0 ? (
                <>
                    {viewMode === 'standard' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                            {filteredMedia.map((item, idx) => (
                                <div key={`${item.pizzaId}-${item.id}`} className="flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                                    <div 
                                        className={`relative aspect-square cursor-pointer overflow-hidden transition-all duration-300 ${animatingHeart === item.id ? 'ring-4 ring-orange-400 scale-[1.02] z-10' : ''}`} 
                                        onClick={() => setSelectedMediaId(item.id)}
                                    >
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110 pointer-events-none" 
                                            style={{ backgroundImage: `url(${item.url})` }} 
                                        />

                                        {item.type === 'video' ? <video src={item.url} className="relative z-10 w-full h-full object-contain bg-transparent pointer-events-none" onError={(e) => e.preventDefault()} /> : (
                                            <img 
                                                src={item.url} 
                                                className={`relative z-10 w-full h-full object-contain bg-transparent transition-transform duration-700 group-hover:scale-105 ${animatingHeart === item.id ? 'scale-110 brightness-110' : ''}`} 
                                                onError={(e) => e.preventDefault()}
                                            />
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none z-20"></div>

                                        {isAdmin && (
                                            <div className="absolute top-2 right-2 flex gap-1 z-30">
                                                <button 
                                                    onClick={(e) => { 
                                                        e.preventDefault(); 
                                                        e.stopPropagation(); 
                                                        if (window.confirm(t.deleteConfirm)) {
                                                            onDeleteMedia(item.pizzaId, item.id); 
                                                        }
                                                    }} 
                                                    className="p-1.5 bg-white/90 text-red-500 rounded-full shadow-md hover:bg-red-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between relative">
                                        <div className="relative">
                                            <button 
                                                onClick={() => setShowReactions(showReactions === item.id ? null : item.id)} 
                                                className={`flex items-center gap-1.5 transition-all duration-300 ${getMyReaction(item.id) ? 'text-red-500 font-bold' : 'text-slate-600 dark:text-slate-400 group-hover:text-red-500'} ${animatingHeart === item.id ? 'scale-150 text-red-600' : ''}`}
                                            >
                                                <Heart size={16} className={`${getMyReaction(item.id) ? "fill-red-500 text-red-500" : ""} ${animatingHeart === item.id ? "fill-red-600 animate-bounce" : ""}`} />
                                                {getReactionCount(item.id) > 0 && <span className="text-xs">{getReactionCount(item.id)}</span>}
                                            </button>

                                            {showReactions === item.id && (
                                                <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in-95">
                                                    {reactions.map(r => (
                                                        <button 
                                                            key={r.label} 
                                                            onClick={() => { 
                                                                onReact(item.id, r.emoji); 
                                                                setShowReactions(null); 
                                                                triggerHeartAnimation(item.id);
                                                            }} 
                                                            className="hover:scale-125 transition-transform text-lg"
                                                        >
                                                            {r.emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1"><MessageCircle size={14} /> {socialData.comments[item.id]?.length || 0}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {viewMode === 'compact' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 animate-in fade-in duration-300">
                             {filteredMedia.map((item, idx) => (
                                <div 
                                    key={`${item.pizzaId}-${item.id}`} 
                                    className="relative aspect-square cursor-pointer overflow-hidden rounded bg-slate-900 group"
                                    onClick={() => setSelectedMediaId(item.id)}
                                >
                                    <div 
                                        className="absolute inset-0 bg-cover bg-center blur-md opacity-60 scale-110 pointer-events-none" 
                                        style={{ backgroundImage: `url(${item.url})` }} 
                                    />

                                    {item.type === 'video' ? (
                                        <>
                                            <video src={item.url} className="relative z-10 w-full h-full object-cover pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity bg-transparent" onError={(e) => e.preventDefault()} />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors z-20">
                                                <Video size={20} className="text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : (
                                        <img 
                                            src={item.url} 
                                            className="relative z-10 w-full h-full object-contain bg-transparent transition-transform duration-300 group-hover:scale-110" 
                                            loading="lazy"
                                            onError={(e) => e.preventDefault()}
                                        />
                                    )}
                                    
                                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {getMyReaction(item.id) && <Heart size={10} className="text-white fill-red-500" />}
                                        {socialData.comments[item.id]?.length > 0 && <MessageCircle size={10} className="text-white fill-white" />}
                                    </div>
                                    
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-400 transition-colors pointer-events-none rounded z-30"></div>
                                </div>
                             ))}
                        </div>
                    )}
                </>
            ) : <div className="text-center py-12 text-slate-300 dark:text-slate-600">{t.noMedia}</div>}
        </div>
      </div>
    </div>
  );
};
