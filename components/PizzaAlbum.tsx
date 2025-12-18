
import React, { useRef, useState } from 'react';
import { PizzaData } from '../types';
import { compressImage } from '../services/imageService';
import { Camera, Image as ImageIcon, Loader2, Share2 } from 'lucide-react';

interface PizzaAlbumProps {
  data: PizzaData;
  onAddPhoto: (id: number | string, photo: string) => void;
}

export const PizzaAlbum: React.FC<PizzaAlbumProps> = ({ data, onAddPhoto }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const compressedBase64 = await compressImage(file);
        onAddPhoto(data.id, compressedBase64);
    } catch (err) {
        console.error("Failed to process image", err);
        alert("Erro ao processar imagem. Tente uma menor.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
        <h3 className="font-bold text-slate-700">Pizza #{data.id}</h3>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 px-2 py-1 rounded-full">
            {data.photos?.length || 0} fotos
        </span>
        <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
           <ImageIcon size={16} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {data.photos && data.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
                {data.photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-black group">
                        <img src={photo} alt={`Pizza ${data.id}`} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                        <a 
                            href={photo} 
                            download={`pizza-${data.id}-${idx}.jpg`}
                            className="absolute bottom-1 right-1 p-1 bg-white/90 text-slate-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            target="_blank"
                            title="Baixar"
                        >
                            <Share2 size={12} />
                        </a>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-300 border-2 border-dashed border-slate-100 rounded-lg mb-4 min-h-[150px]">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-xs">Sem fotos</span>
            </div>
        )}

        <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-70"
        >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            {isUploading ? 'Enviando...' : 'Adicionar Foto'}
        </button>
      </div>
    </div>
  );
};
