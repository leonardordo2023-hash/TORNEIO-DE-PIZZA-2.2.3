
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { X, Loader2, Play, Sparkles, AlertCircle, Key, CheckCircle2 } from 'lucide-react';

interface VideoSimulationProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VideoSimulation: React.FC<VideoSimulationProps> = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState<'idle' | 'checking_key' | 'loading' | 'ready' | 'error'>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const loadingMessages = [
        "Preparando o forno...",
        "Amassando a massa digital...",
        "Adicionando o molho de pixels...",
        "Colocando o manjericão de IA...",
        "Gratinando o vídeo...",
        "Quase pronto para servir!"
    ];

    useEffect(() => {
        let interval: any;
        if (status === 'loading') {
            let i = 0;
            setLoadingMessage(loadingMessages[0]);
            interval = setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleGenerateVideo = async () => {
        try {
            setStatus('checking_key');
            
            // Verificação obrigatória de chave de API conforme regras do Veo
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
                // Após o trigger, prosseguimos assumindo sucesso conforme instrução (race condition mitigation)
            }

            setStatus('loading');
            // Create a new instance right before the call to ensure the latest key is used
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                A professional high-quality 3D animation tutorial for a pizza app. 
                Step 1: A user clicks on a 'Salgada' button. 
                Step 2: On Pizza #7, the user enters 9.5 for Appearance and 10.0 for Taste. 
                Step 3: A yellow star button is clicked and pulses, adding +1 bonus point. 
                Step 4: The user types in an 'Anonymous Critic' field saying the sauce is perfect. 
                Sleek UI/UX design, floating information bubbles explaining each step, 
                warm lighting, delicious pizza visuals in the background. Portuguese text overlays.
            `.trim();

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: '9:16'
                }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const blob = await response.blob();
                setVideoUrl(URL.createObjectURL(blob));
                setStatus('ready');
            } else {
                throw new Error("Não foi possível obter o link do vídeo.");
            }

        } catch (error: any) {
            console.error("Video Generation Error:", error);
            
            // Check for the specific error that indicates an invalid/missing paid key
            const errorStr = error?.message || JSON.stringify(error) || "";
            if (errorStr.includes("Requested entity was not found") || errorStr.includes("NOT_FOUND")) {
                // If the request fails with this specific message, reset and prompt as per rules
                await window.aistudio.openSelectKey();
                setStatus('idle');
                return;
            }

            setErrorMessage("Erro ao gerar vídeo. Certifique-se de usar uma chave de API válida vinculada a um projeto pago.");
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[700] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden border border-slate-700 shadow-2xl flex flex-col relative aspect-[9/16]">
                
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    {status === 'idle' && (
                        <div className="animate-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl">
                                <Play size={48} className="text-white fill-white ml-2" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Simulação por IA</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                Vamos gerar um vídeo único usando inteligência artificial para mostrar exatamente como votar na Pizza #7.
                            </p>
                            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl mb-8 flex items-start gap-3 text-left">
                                <Key className="text-indigo-400 shrink-0" size={18} />
                                <p className="text-[10px] text-indigo-300 font-bold leading-normal">
                                    Esta funcionalidade requer uma chave de API paga do Google AI Studio (modelo Veo). 
                                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline ml-1">Saiba mais sobre faturamento.</a>
                                </p>
                            </div>
                            <button 
                                onClick={handleGenerateVideo}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95"
                            >
                                <Sparkles size={20} /> GERAR VÍDEO AGORA
                            </button>
                        </div>
                    )}

                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-8">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto text-orange-500 animate-pulse" size={32} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-black text-xl uppercase tracking-widest animate-pulse">{loadingMessage}</p>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">A IA está desenhando a simulação...</p>
                            </div>
                            <p className="text-[10px] text-slate-600 italic">Isso pode levar de 1 a 2 minutos.</p>
                        </div>
                    )}

                    {status === 'ready' && videoUrl && (
                        <div className="absolute inset-0 animate-in fade-in duration-700 bg-black">
                            <video 
                                src={videoUrl} 
                                className="w-full h-full object-cover" 
                                controls 
                                autoPlay 
                                loop 
                            />
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-lg z-50">
                                <CheckCircle2 size={12} /> Simulação Gerada
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="animate-in slide-in-from-bottom-4">
                            <AlertCircle size={64} className="text-red-500 mb-6 mx-auto" />
                            <h3 className="text-white font-black text-xl uppercase mb-2">Ops! Falha na Geração</h3>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">{errorMessage}</p>
                            <button 
                                onClick={() => setStatus('idle')}
                                className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl"
                            >
                                Tentar Novamente
                            </button>
                        </div>
                    )}

                    {status === 'checking_key' && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-indigo-500" size={48} />
                            <p className="text-indigo-400 font-bold text-sm">Validando Credenciais de IA...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
