
import { MediaItem, MediaType } from "../types";

/**
 * Processa qualquer tipo de arquivo, suportando até 1GB.
 * Identifica se é imagem, vídeo, áudio ou arquivo genérico.
 */
export const processMediaFile = (
  file: File, 
  maxSizeMB: number = 1024,
  onProgress?: (percent: number) => void
): Promise<{ url: string, type: MediaType, fileName?: string }> => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    if (file.size > maxSizeMB * 1024 * 1024) {
        reject(new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: ${maxSizeMB}MB`));
        return;
    }

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
        }
    };

    reader.onload = (e) => {
        if (onProgress) onProgress(100);
        let type: MediaType = 'file';
        if (isImage) type = 'image';
        else if (isVideo) type = 'video';
        else if (isAudio) type = 'audio';

        resolve({
            url: e.target?.result as string,
            type,
            fileName: file.name
        });
    };
    
    reader.onerror = (err) => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
};

export const compressImage = async (file: File): Promise<string> => {
    const res = await processMediaFile(file);
    return res.url;
};
