
import { MediaItem, MediaType } from "../types";

/**
 * Processa qualquer tipo de arquivo.
 * Se for imagem, REDIMENSIONA e COMPRIME para evitar travamento no P2P.
 */
export const processMediaFile = (
  file: File, 
  maxSizeMB: number = 1024, // Mantido para compatibilidade, mas o foco é compressão visual
  onProgress?: (percent: number) => void
): Promise<{ url: string, type: MediaType, fileName?: string }> => {
  return new Promise((resolve, reject) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');

    // Validação de tamanho bruto apenas para não travar o navegador
    if (file.size > 500 * 1024 * 1024) { // Limite hard de 500MB
        reject(new Error(`Arquivo muito grande. Máximo permitido: 500MB`));
        return;
    }

    const reader = new FileReader();
    
    reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 50); // 50% é leitura
            onProgress(percent);
        }
    };

    reader.onload = (e) => {
        const rawResult = e.target?.result as string;

        if (isImage) {
            // Processamento de Imagem (Compressão via Canvas)
            const img = new Image();
            img.src = rawResult;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Configuração de redimensionamento (Max 1280px - HD Leve)
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 1280;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Comprime para JPEG com qualidade 0.7 (bom balanço tamanho/qualidade)
                    // Isso reduz uma foto de 5MB para ~200KB, permitindo o envio P2P
                    const compressedUrl = canvas.toDataURL('image/jpeg', 0.7);
                    
                    if (onProgress) onProgress(100);
                    
                    resolve({
                        url: compressedUrl,
                        type: 'image',
                        fileName: file.name
                    });
                } else {
                    // Fallback se canvas falhar
                    if (onProgress) onProgress(100);
                    resolve({ url: rawResult, type: 'image', fileName: file.name });
                }
            };

            img.onerror = () => reject(new Error("Erro ao processar imagem."));

        } else {
            // Vídeos e Áudios não são comprimidos no front (complexo demais), passam direto
            if (onProgress) onProgress(100);
            
            let type: MediaType = 'file';
            if (isVideo) type = 'video';
            else if (isAudio) type = 'audio';

            resolve({
                url: rawResult,
                type,
                fileName: file.name
            });
        }
    };
    
    reader.onerror = (err) => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsDataURL(file);
  });
};

export const compressImage = async (file: File): Promise<string> => {
    const res = await processMediaFile(file);
    return res.url;
};
