import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2, Volume2, Radio } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Props {
  onClose: () => void;
}

const LiveAssistant: React.FC<Props> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false); // Model is talking
  const [error, setError] = useState<string | null>(null);
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Buffer Scheduling
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Initialization
  useEffect(() => {
    connectToLiveAPI();
    return () => {
      disconnect();
    };
  }, []);

  const disconnect = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    // Note: The SDK doesn't expose a clean 'close()' method on the session object easily in the example 
    // but closing the stream and context effectively stops the client side.
    setIsConnected(false);
  };

  const connectToLiveAPI = async () => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key no configurada");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            
            // Setup Input Processing
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = floatTo16BitPCM(inputData);
              const base64Data = arrayBufferToBase64(pcmData);
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
               if (outputAudioContextRef.current) {
                 const audioCtx = outputAudioContextRef.current;
                 setIsTalking(true);
                 
                 // Decode
                 const audioData = base64ToArrayBuffer(base64Audio);
                 const audioBuffer = await decodeAudioData(audioData, audioCtx, 24000, 1);
                 
                 // Schedule
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                 
                 const source = audioCtx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNode);
                 
                 source.addEventListener('ended', () => {
                   sourcesRef.current.delete(source);
                   if (sourcesRef.current.size === 0) setIsTalking(false);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
               }
             }

             // Handle Interruption
             if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(src => src.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsTalking(false);
             }
          },
          onclose: () => {
            setIsConnected(false);
          },
          onerror: (e) => {
            console.error(e);
            setError("Error de conexión con IA");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "Eres un asistente experto en agronomía del café. Responde de forma concisa, amable y técnica a preguntas sobre plagas, fertilización y manejo del cultivo. Habla en español."
        }
      });

    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar el asistente de voz. Verifica permisos o internet.");
    }
  };

  // --- Helpers ---
  
  const floatTo16BitPCM = (input: Float32Array) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return output.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const decodeAudioData = async (data: ArrayBuffer, ctx: AudioContext, sampleRate: number, numChannels: number) => {
      // Raw PCM decoding manually because Web Audio API decodeAudioData expects headers (wav/mp3)
      const dataInt16 = new Int16Array(data);
      const frameCount = dataInt16.length / numChannels;
      const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
          channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
      }
      return buffer;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-xs flex flex-col items-center shadow-2xl border border-gray-700 relative overflow-hidden">
        
        {/* Visualizer Background Effect */}
        <div className={`absolute inset-0 bg-green-500/10 transition-opacity duration-500 ${isTalking ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
          <X size={24} />
        </button>

        <div className="mb-6 relative z-10">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-green-600 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-gray-700'}`}>
            {isConnected ? (
              <div className="relative">
                 {isTalking && <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-75"></span>}
                 <Radio size={40} className="text-white relative z-10" />
              </div>
            ) : (
              <Loader2 size={40} className="text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 z-10 text-center">Asistente Agrónomo</h3>
        
        {error ? (
          <p className="text-red-400 text-sm text-center z-10 px-4">{error}</p>
        ) : (
          <p className="text-gray-400 text-sm text-center z-10">
            {isConnected 
              ? (isTalking ? "IA Hablando..." : "Escuchando... Pregunta lo que necesites.") 
              : "Conectando con Satélite..."}
          </p>
        )}

        <div className="mt-8 flex gap-4 z-10">
           <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full border border-green-800">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             Live API Activa
           </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;