
import { MediaItem, MediaType } from "../types";

/**
 * Compresses images and validates videos.
 */
export const processMediaFile = (
  file: File, 
  maxVideoSizeMB: number = 50,
  onProgress?: (percent: number) => void
): Promise<{ url: string, type: MediaType }> => {
  return new Promise((resolve, reject) => {
    // Handle Video
    if (file.type.startsWith('video/')) {
        if (file.size > maxVideoSizeMB * 1024 * 1024) {
            reject(new Error(`Vídeo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: ${maxVideoSizeMB}MB`));
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
            resolve({
                url: e.target?.result as string,
                type: 'video'
            });
        };
        
        reader.onerror = (err) => reject(new Error("Erro ao ler o arquivo de vídeo."));
        reader.readAsDataURL(file);
        return;
    }

    // Handle Image (Compression with Memory Optimization)
    const isHighQuality = maxVideoSizeMB > 50;
    const maxWidth = isHighQuality ? 1920 : 1080; 
    const maxHeight = isHighQuality ? 1920 : 1080;
    const quality = isHighQuality ? 0.9 : 0.8;

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.src = objectUrl;

    img.onload = () => {
        if (onProgress) onProgress(50); // Simulação de progresso para imagens
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not get canvas context"));
            return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        URL.revokeObjectURL(objectUrl);
        if (onProgress) onProgress(100);
        
        resolve({
            url: dataUrl,
            type: 'image'
        });
    };

    img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Erro ao carregar a imagem. O arquivo pode estar corrompido."));
    };
  });
};

// Legacy support
export const compressImage = async (file: File): Promise<string> => {
    const res = await processMediaFile(file);
    return res.url;
};
