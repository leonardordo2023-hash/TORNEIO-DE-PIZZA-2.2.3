
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PizzaData, SocialData, MediaItem, UserAccount, Comment, Reply } from '../types';
import { Info, Heart, MessageCircle, Trash2, X, Check, Image as ImageIcon, Loader2, Send, ShieldCheck, Megaphone, Newspaper, Plus, ListFilter, Camera, Clock, PlusCircle, MinusCircle, Sparkles, Pencil, CornerDownRight, Mic, FileText, Music, Play, Pause, Video, Download, Save, RefreshCw, ChevronRight, Maximize2 } from 'lucide-react';
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
  onEditReply: (mediaId: string, commentId: string, replyId: string, newText: string) => void;
  onDeleteReply: (mediaId: string, commentId: string, replyId: string) => void;
  onReplyReact: (mediaId: string, commentId: string, replyId: string, emoji: string) => void;
  onPollVote: (pizzaId: number | string, mediaId: string, selectedOptions: string[]) => void;
  onUpdateCaption: (id: number | string, mediaId: string, caption: string) => void;
  language: Language;
  currentUser: UserAccount;
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

const AudioPlayer: React.FC<{ url: string }> = ({ url }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="ml-0.5" fill="currentColor" />}
            </button>
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                <div className={`h-full bg-indigo-500 ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: '100%', opacity: 0.3 }}></div>
            </div>
            <audio ref={audioRef} src={url} onEnded={() => setIsPlaying(false)} className="hidden" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gravação</span>
        </div>
    );
};

export const NewsFeed: React.FC<NewsFeedProps> = ({ 
    pizzas, userId, onAddPhoto, onDeletePhoto,
    socialData, onAddComment, onEditComment, onDeleteComment, onReact, onCommentReact, language, currentUser, onPollVote, onUpdateCaption,
    onReplyToComment, onEditReply, onDeleteReply, onReplyReact,
    mode = 'news', uiScale = 1
}) => {
  const t = translations[language];
  const isAdmin = userId.toLowerCase() === '@leonardo';
  const isMaxScale = uiScale >= 1.3;

  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [replyToId, setReplyToId] = useState<{mediaId: string, commentId: string} | null>(null);
  const [replyInput, setReplyInput] = useState('');
  
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostCaption, setEditPostCaption] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<{mediaId: string, commentId: string} | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<{mediaId: string, commentId: string, replyId: string} | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  // Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postType, setPostType] = useState<'news' | 'poll' | 'audio'>('news');
  const [postCaption, setPostCaption] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [stagedDocument, setStagedDocument] = useState<File | null>(null);
  const [previews, setPreviews] = useState<{url: string, type: string}[]>([]);
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<any>(null);

  const feedItems = useMemo(() => {
      return pizzas.flatMap(p => (p.media || [])
        .filter(item => !item.hiddenFromFeed)
        .filter(item => {
            if (mode === 'news') return item.type !== 'poll' && item.type !== 'file';
            if (mode === 'avisos') return item.type === 'poll' || item.type === 'audio' || item.type === 'file' || (item.type === 'image' && (item.caption?.length || 0) > 50); 
            return true;
        })
        .map(item => ({ pizzaId: p.id, item: item }))
      ).sort((a, b) => (b.item.date || 0) - (a.item.date || 0));
  }, [pizzas, mode]);

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const reader = new FileReader();
              reader.onloadend = () => setRecordedAudio(reader.result as string);
              reader.readAsDataURL(blob);
              stream.getTracks().forEach(track => track.stop());
          };
          recorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
      } catch (err) { alert("Não foi possível acessar o microfone."); }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files: File[] = Array.from(e.target.files || []);
      // Permitir até 10 fotos/vídeos
      const images = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, 10);
      const doc = files.find(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'));
      if (images.length > 0) {
          setStagedFiles(images);
          setPreviews(images.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video/') ? 'video' : 'image' })));
      }
      if (doc) setStagedDocument(doc);
  };

  const handlePostSubmit = async () => {
      const targetId = pizzas[0]?.id;
      if (!targetId || !postCaption.trim()) return;
      setIsUploading(true);
      setUploadProgress(0);
      try {
          const timestamp = Date.now();
          if (stagedFiles.length > 0) {
              const totalItems = stagedFiles.length + (stagedDocument ? 1 : 0);
              for (let i = 0; i < stagedFiles.length; i++) {
                  const res = await processMediaFile(stagedFiles[i], 1024, (p) => {
                      const currentProgress = Math.round(((i / totalItems) * 100) + (p / totalItems));
                      setUploadProgress(currentProgress);
                  });
                  onAddPhoto(targetId, { 
                      id: Math.random().toString(36).substring(2, 15), 
                      url: res.url, 
                      type: res.type as any, 
                      category: 'pizza', 
                      date: timestamp + i, 
                      caption: i === 0 ? postCaption : "" 
                  });
              }
          }
          if (stagedDocument) {
              const res = await processMediaFile(stagedDocument, 1024, (p) => setUploadProgress(90 + (p * 0.1)));
              onAddPhoto(targetId, { id: Math.random().toString(36).substring(2, 15), url: res.url, type: 'file', category: 'pizza', date: timestamp + 11, caption: stagedFiles.length === 0 ? postCaption : "Documento anexo", fileName: stagedDocument.name });
          }
          if (postType === 'audio' && recordedAudio) {
              onAddPhoto(targetId, { id: Math.random().toString(36).substring(2, 15), url: recordedAudio, type: 'audio', category: 'pizza', date: timestamp, caption: postCaption });
          }
          if (postType === 'poll') {
              onAddPhoto(targetId, { id: Math.random().toString(36).substring(2, 15), url: '', type: 'poll', category: 'pizza', date: timestamp, caption: postCaption, poll: { question: postCaption, options: pollOptions.filter(o => o.trim() !== '').map((o, idx) => ({ id: `opt-${idx}`, text: o })), votes: {}, allowMultiple: false } });
          }
          resetModal();
      } catch (err) { alert("Erro ao postar."); } finally { setIsUploading(false); }
  };

  const resetModal = () => {
      setIsPostModalOpen(false);
      setPostCaption(''); setStagedFiles([]); setStagedDocument(null); setPreviews([]); setRecordedAudio(null); setPollOptions(['', '']); setPostType('news'); setUploadProgress(0); setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSendReply = (mediaId: string, commentId: string) => {
      if (!replyInput.trim()) return;
      onReplyToComment(mediaId, commentId, replyInput);
      setReplyInput(''); setReplyToId(null);
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
                      <button key={opt.id} onClick={() => onPollVote(pizzaId, item.id, [opt.id])} className={`w-full relative h-10 rounded-xl overflow-hidden border-0 transition-all duration-500 ${isSelected ? 'bg-indigo-50/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                          <div className={`absolute inset-0 transition-all duration-1000 ease-out ${isSelected ? 'bg-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ width: `${percentage}%`, opacity: 0.4 }} />
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

  const formatTime = (s: number) => {
      const min = Math.floor(s / 60); const sec = s % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 animate-fade-in-up">
      {fullImage && (
          <div className="fixed inset-0 z-[600] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={() => setFullImage(null)}>
              <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[610]"><X size={32} /></button>
              <img src={fullImage} className="max-w-full max-h-full object-contain shadow-2xl animate-in zoom-in-95 duration-300" />
          </div>
      )}

      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${mode === 'news' ? 'bg-indigo-600' : 'bg-orange-500'} text-white rotate-2`}>{mode === 'news' ? <Newspaper size={20} /> : <Megaphone size={20} />}</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">{mode === 'news' ? 'Feed Social' : 'Avisos News'}</h2>
        </div>
        {isAdmin && <button onClick={() => setIsPostModalOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all"><Plus size={20} strokeWidth={3} /></button>}
      </div>

      <div className="space-y-6">
          {feedItems.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 bg-white/60 dark:bg-slate-900/40 rounded-[3rem] border-0"><Sparkles size={40} className="text-slate-300 animate-pulse" /><p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nada postado ainda</p></div>
          ) : (
              feedItems.map(({ pizzaId, item }) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border-0 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all group relative">
                      {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2 z-20">
                              <button onClick={() => { setEditingPostId(item.id); setEditPostCaption(item.caption || ''); }} className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white shadow-md"><Pencil size={16} /></button>
                              <button onClick={() => confirm("Apagar publicação?") && onDeletePhoto(pizzaId, item.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-md"><Trash2 size={16} /></button>
                          </div>
                      )}
                      <div className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'poll' ? 'bg-orange-100 text-orange-600' : item.type === 'audio' ? 'bg-pink-100 text-pink-600' : item.type === 'file' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>{item.type === 'poll' ? <ListFilter size={18} /> : item.type === 'audio' ? <Music size={18} /> : item.type === 'file' ? <FileText size={18} /> : <ShieldCheck size={18} />}</div>
                          <div><span className="block font-black text-slate-800 dark:text-white text-[13px] uppercase tracking-tighter">{item.type === 'poll' ? 'Votação Aberta' : item.type === 'file' ? 'Arquivo Anexo' : 'Leonardo Admin'}</span><span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock size={8}/> {getRelativeTime(item.date)}</span></div>
                      </div>
                      <div className="px-5 pb-5">
                          {editingPostId === item.id ? (
                              <div className="mb-4 space-y-2">
                                  <textarea className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[13px] font-bold outline-none border-2 border-indigo-500" value={editPostCaption} onChange={(e) => setEditPostCaption(e.target.value)} rows={3}/>
                                  <div className="flex gap-2"><button onClick={() => setEditingPostId(null)} className="flex-1 py-2 bg-slate-100 rounded-lg font-black text-[9px] uppercase">Cancelar</button><button onClick={() => { onUpdateCaption(pizzaId, item.id, editPostCaption); setEditingPostId(null); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase">Salvar</button></div>
                              </div>
                          ) : (item.caption && <p className="text-slate-800 dark:text-slate-100 font-bold mb-4 text-[15px] max-w-full overflow-hidden text-ellipsis whitespace-pre-wrap">{item.caption}</p>)}
                          {item.type === 'poll' ? renderPoll(pizzaId, item) : item.type === 'audio' ? <AudioPlayer url={item.url} /> : item.type === 'file' ? (<a href={item.url} download={item.fileName || 'arquivo'} className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500 text-white rounded-lg"><Download size={20}/></div><div className="min-w-0 flex-1"><span className="block font-black text-[10px] uppercase text-slate-500 tracking-widest">Baixar Arquivo</span><span className="block font-bold text-xs truncate max-w-[200px] text-slate-800 dark:text-white">{item.fileName || 'documento'}</span></div></div><ChevronRight size={16} className="text-slate-400" /></a>) : (item.url && (<div className="rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-black/20 shadow-inner border border-slate-100 dark:border-slate-800/50 group/img relative cursor-pointer" onClick={() => item.type === 'image' && setFullImage(item.url)}>{item.type === 'video' ? (<video src={item.url} controls className="w-full h-auto max-h-[500px] object-contain" />) : (<div className="relative w-full"><img src={item.url} className="w-full h-auto max-h-[500px] object-contain transition-transform duration-700 group-hover/img:scale-[1.02]" loading="lazy" /><div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"><Maximize2 size={16} className="text-white" /></div></div>)}</div>))}
                      </div>
                      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-transparent flex items-center justify-between">
                        <div className="flex gap-4">
                            <button onClick={() => onReact(item.id, '❤️')} className={`flex items-center gap-1.5 transition-all active:scale-125 ${socialData.likes[item.id]?.[currentUser.nickname] ? 'text-red-500' : 'text-slate-400'}`}><Heart size={20} className={socialData.likes[item.id]?.[currentUser.nickname] ? 'fill-current' : ''} /><span className="text-[11px] font-black">{Object.keys(socialData.likes[item.id] || {}).length}</span></button>
                            <button onClick={() => setExpandedComments(prev => ({...prev, [item.id]: !prev[item.id]}))} className={`flex items-center gap-1.5 text-slate-400 transition-all hover:text-indigo-500`}><MessageCircle size={20} /><span className="text-[11px] font-black">{socialData.comments[item.id]?.length || 0}</span></button>
                        </div>
                      </div>
                      {(expandedComments[item.id] || isMaxScale) && (
                        <div className="bg-white dark:bg-slate-900 p-5 border-t border-transparent animate-in slide-in-from-top-2">
                             <div className={`space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2 ${isMaxScale ? '' : 'max-h-60'}`}>
                                {socialData.comments[item.id]?.length === 0 ? (<p className="text-[9px] text-slate-400 uppercase font-black text-center py-4">Nenhum comentário ainda</p>) : (
                                    socialData.comments[item.id]?.map(c => {
                                        const isAuthor = c.user === currentUser.nickname;
                                        const canModify = isAuthor || isAdmin;
                                        const hasLikedComment = c.reactions?.[currentUser.nickname] === '❤️';
                                        return (
                                            <div key={c.id} className="space-y-2">
                                                <div className="group/comment flex flex-col gap-1 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl relative">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2"><span className="font-black text-[9px] uppercase text-indigo-500">{c.user}</span><button onClick={() => onCommentReact(item.id, c.id, '❤️')} className={`p-1 transition-all ${hasLikedComment ? 'text-red-500 scale-110' : 'text-slate-300 hover:text-red-400'}`}><Heart size={10} fill={hasLikedComment ? "currentColor" : "none"} /></button>{Object.keys(c.reactions || {}).length > 0 && <span className="text-[8px] font-black text-slate-400">{Object.keys(c.reactions || {}).length}</span>}</div>
                                                        {canModify && (<div className="flex gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity"><button onClick={() => { setEditingCommentId({mediaId: item.id, commentId: c.id}); setEditCommentText(c.text); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={12}/></button><button onClick={() => confirm("Apagar comentário?") && onDeleteComment(item.id, c.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={12}/></button></div>)}
                                                    </div>
                                                    {editingCommentId?.commentId === c.id ? (
                                                        <div className="space-y-1 mt-1"><input className="w-full bg-white dark:bg-slate-800 p-2 rounded-lg text-[11px] font-bold outline-none border border-indigo-400" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus /><div className="flex gap-2"><button onClick={() => setEditingCommentId(null)} className="text-[8px] font-black text-slate-400">CANCELAR</button><button onClick={() => { onEditComment(item.id, c.id, editCommentText); setEditingCommentId(null); }} className="text-[8px] font-black text-indigo-600">SALVAR</button></div></div>
                                                    ) : (<><p className="font-bold text-[11px] text-slate-700 dark:text-slate-300 leading-tight">{c.text}</p><button onClick={() => setReplyToId({mediaId: item.id, commentId: c.id})} className="text-[8px] font-black text-slate-400 uppercase mt-1 hover:text-indigo-500 w-fit">Responder</button></>)}
                                                </div>
                                                {c.replies && c.replies.length > 0 && (
                                                    <div className="ml-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                                                        {c.replies.map(r => {
                                                            const hasLikedReply = r.reactions?.[currentUser.nickname] === '❤️';
                                                            const isReplyAuthor = r.user === currentUser.nickname;
                                                            const canModifyReply = isReplyAuthor || isAdmin;
                                                            return (
                                                                <div key={r.id} className="bg-slate-50/50 dark:bg-slate-800/20 p-2 rounded-xl flex flex-col gap-1 group/reply relative">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-black text-[8px] uppercase text-indigo-400">{r.user}</span>
                                                                            <button onClick={() => onReplyReact(item.id, c.id, r.id, '❤️')} className={`p-1 transition-all ${hasLikedReply ? 'text-red-500 scale-110' : 'text-slate-300 hover:text-red-400'}`}><Heart size={8} fill={hasLikedReply ? "currentColor" : "none"} /></button>
                                                                            {Object.keys(r.reactions || {}).length > 0 && <span className="text-[7px] font-black text-slate-400">{Object.keys(r.reactions || {}).length}</span>}
                                                                        </div>
                                                                        {canModifyReply && (
                                                                            <div className="flex gap-2 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                                                <button onClick={() => { setEditingReplyId({mediaId: item.id, commentId: c.id, replyId: r.id}); setEditReplyText(r.text); }} className="text-slate-400 hover:text-indigo-600"><Pencil size={10}/></button>
                                                                                <button onClick={() => confirm("Apagar resposta?") && onDeleteReply(item.id, c.id, r.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={10}/></button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {editingReplyId?.replyId === r.id ? (
                                                                        <div className="space-y-1 mt-1">
                                                                            <input className="w-full bg-white dark:bg-slate-800 p-1.5 rounded-lg text-[10px] font-bold outline-none border border-indigo-400" value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} autoFocus />
                                                                            <div className="flex gap-2"><button onClick={() => setEditingReplyId(null)} className="text-[7px] font-black text-slate-400">CANCELAR</button><button onClick={() => { onEditReply(item.id, c.id, r.id, editReplyText); setEditingReplyId(null); }} className="text-[7px] font-black text-indigo-600">SALVAR</button></div>
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
                                                        <input className="flex-1 bg-slate-50 dark:bg-slate-800 border border-indigo-200 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none" placeholder={`Respondendo ${c.user}...`} value={replyInput} onChange={e => setReplyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply(item.id, c.id)} autoFocus />
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

      {isPostModalOpen && (
          <div className="fixed inset-0 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-2 animate-in fade-in" onClick={resetModal}>
              <div className="bg-white dark:bg-slate-800 w-full max-w-[340px] rounded-[2rem] shadow-2xl border-0 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[80vh] relative" onClick={e => e.stopPropagation()}>
                  <div className="p-3 border-b border-transparent flex justify-between items-center bg-white dark:bg-slate-800 shrink-0">
                      <div className="flex items-center gap-2"><div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg rotate-3"><Plus size={14} strokeWidth={3} /></div><h3 className="text-sm font-black uppercase tracking-tighter text-slate-800 dark:text-white">Criar Postagem</h3></div>
                      <button onClick={resetModal} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-all text-slate-500 dark:text-slate-300"><X size={14}/></button>
                  </div>
                  <div className="flex p-1 gap-1 bg-slate-100 dark:bg-slate-900 mx-3 my-2 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
                      <button onClick={() => setPostType('news')} className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${postType === 'news' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}><Camera size={10} /> Mídia</button>
                      <button onClick={() => setPostType('poll')} className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${postType === 'poll' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}><ListFilter size={10} /> Enquete</button>
                      <button onClick={() => setPostType('audio')} className={`flex-1 min-w-[80px] py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${postType === 'audio' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-400'}`}><Mic size={10} /> Áudio</button>
                  </div>
                  <div className="px-4 pb-3 space-y-3 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                      <div className="space-y-1"><label className="text-[7px] font-black uppercase text-indigo-500 ml-1 tracking-[0.1em]">Descrição</label><textarea value={postCaption} onChange={e => setPostCaption(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-0 rounded-xl outline-none font-bold text-xs h-16 transition-all shadow-inner text-slate-800 dark:text-white resize-none" placeholder={postType === 'poll' ? "Pergunta da enquete?" : "Escreva os detalhes..."} /></div>
                      {postType === 'news' && (<div className="space-y-3"><div className="space-y-1"><label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Fotos/Vídeos (Máx. 10)</label><label className="w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-all bg-slate-50 dark:bg-slate-900 text-center px-3 overflow-hidden"><input type="file" multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />{previews.length > 0 ? (<div className="grid grid-cols-5 gap-1 w-full p-1">{previews.map((p, i) => (<div key={i} className="aspect-square bg-slate-200 rounded-lg overflow-hidden border border-white/20">{p.type === 'video' ? <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white"><Video size={8}/></div> : <img src={p.url} className="w-full h-full object-cover" />}</div>))}</div>) : (<><div className="p-2 bg-white dark:bg-slate-700 rounded-full shadow-md"><Plus size={16} className="text-indigo-500" /></div><span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Selecionar Mídias</span></>)}</label></div><div className="space-y-1"><label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Documento (Opcional)</label><label className="w-full py-2 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-blue-50/20 dark:bg-blue-900/10 hover:bg-blue-100/40 transition-all px-3"><input type="file" className="hidden" accept="*" onChange={e => { const f = e.target.files?.[0]; if (f) setStagedDocument(f); }} /><FileText size={16} className={stagedDocument ? "text-green-500" : "text-blue-500"} /><span className={`text-[8px] font-black uppercase truncate max-w-[200px] ${stagedDocument ? "text-green-600" : "text-slate-400"}`}>{stagedDocument ? stagedDocument.name : "Anexar arquivo"}</span></label></div></div>)}
                      {postType === 'audio' && (<div className="space-y-3 animate-in zoom-in-95"><label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Gravar Áudio</label><div className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3">{isRecording ? (<div className="flex flex-col items-center gap-2"><div className="flex items-center gap-2 text-red-500 animate-pulse"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="font-black text-sm font-mono">{formatTime(recordingTime)}</span></div><button onClick={stopRecording} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/30 animate-pulse"><X size={20} /></button><span className="text-[7px] font-black uppercase text-slate-400">Gravando...</span></div>) : recordedAudio ? (<div className="w-full flex flex-col items-center gap-3"><div className="p-2 bg-green-50 text-green-600 rounded-full"><Music size={20}/></div><AudioPlayer url={recordedAudio} /><button onClick={() => {setRecordedAudio(null); startRecording();}} className="flex items-center gap-1 text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full"><RefreshCw size={10}/> Recomeçar</button></div>) : (<button onClick={startRecording} className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"><Mic size={24} /></button>)}{!isRecording && !recordedAudio && <span className="text-[7px] font-black uppercase text-slate-400">Tocar para gravar</span>}</div></div>)}
                      {postType === 'poll' && (<div className="space-y-2 animate-in slide-in-from-top-4 duration-500"><label className="text-[7px] font-black uppercase text-slate-400 ml-1 tracking-[0.1em]">Opções</label><div className="grid gap-1.5">{pollOptions.map((opt, idx) => (<div key={idx} className="flex gap-1.5 group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 80}ms` }}><input className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border-0 rounded-lg text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-white" placeholder={`Opção ${idx + 1}`} value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} />{pollOptions.length > 2 && <button onClick={() => { const n = [...pollOptions]; n.splice(idx,1); setPollOptions(n); }} className="p-1 text-red-400 hover:text-red-600 transition-all"><MinusCircle size={16}/></button>}</div>))}</div>{pollOptions.length < 5 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="w-full py-2 border-0 rounded-lg flex items-center justify-center gap-1 text-indigo-500 bg-indigo-50 dark:bg-slate-900 transition-all hover:bg-indigo-100"><PlusCircle size={14} /><span className="text-[7px] font-black uppercase tracking-widest">Nova Opção</span></button>}</div>)}
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 border-t border-transparent shrink-0">
                      {isUploading && (<div className="mb-2 space-y-1"><div className="flex justify-between text-[7px] font-black uppercase text-indigo-500"><span className="flex items-center gap-1"><Loader2 size={6} className="animate-spin" /> Publicando...</span><span>{uploadProgress}%</span></div><div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div></div>)}
                      <button onClick={handlePostSubmit} disabled={isUploading || isRecording || !postCaption.trim() || (postType === 'news' && stagedFiles.length === 0 && !stagedDocument) || (postType === 'audio' && !recordedAudio) || (postType === 'poll' && pollOptions.filter(o => o.trim() !== '').length < 2)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl active:scale-[0.97] disabled:opacity-30 transition-all flex items-center justify-center gap-2">{isUploading ? <Loader2 className="animate-spin" size={14}/> : <><Send size={14}/> PUBLICAR</>}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
