
import React, { useRef, useState } from 'react';
import { PizzaData } from '../types';
import { processMediaFile } from '../services/imageService';
import { Camera, Image as ImageIcon, Loader2, Share2, Film } from 'lucide-react';

interface PizzaAlbumProps {
  data: PizzaData;
  onAddPhoto: (id: number | string, mediaUrl: string) => void;
}

export const PizzaAlbum: React.FC<PizzaAlbumProps> = ({ data, onAddPhoto }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
        const { url } = await processMediaFile(file, 50, (percent) => {
            setUploadProgress(percent);
        });
        onAddPhoto(data.id, url);
    } catch (err) {
        console.error("Failed to process media", err);
        alert(err instanceof Error ? err.message : "Erro ao processar mídia.");
    } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isVideo = (url: string) => url.startsWith('data:video/') || url.includes('.mp4');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
        <h3 className="font-bold text-slate-700">Pizza #{data.id}</h3>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 px-2 py-1 rounded-full">
            {data.photos?.length || 0} itens
        </span>
        <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
           <Film size={16} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {data.photos && data.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
                {data.photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-black group">
                        {isVideo(url) ? (
                            <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                            <img src={url} alt={`Pizza ${data.id}`} className="w-full h-full object-contain" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                        <a 
                            href={url} 
                            download={`pizza-${data.id}-${idx}.${isVideo(url) ? 'mp4' : 'jpg'}`}
                            className="absolute bottom-1 right-1 p-1 bg-white/90 text-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            target="_blank"
                            title="Baixar"
                        >
                            <Share2 size={12} />
                        </a>
                        {isVideo(url) && (
                            <div className="absolute top-1 left-1 bg-black/50 text-white p-0.5 rounded text-[8px] font-bold">VIDEO</div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-lg mb-4 min-h-[150px]">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-xs">Sem mídia</span>
            </div>
        )}

        <input 
            type="file" 
            accept="image/*,video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
        />
        
        <div className="space-y-2 mt-auto">
            {isUploading && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-orange-500 transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            )}
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-70"
            >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                {isUploading ? `Processando ${uploadProgress}%...` : 'Adicionar Foto/Vídeo'}
            </button>
        </div>
      </div>
    </div>
  );
};
