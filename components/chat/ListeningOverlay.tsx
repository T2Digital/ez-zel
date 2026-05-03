import React from 'react';
import { X, Square } from 'lucide-react';

interface ListeningOverlayProps {
    liveTranscript: string;
    visualLevels: number[];
    cancelRecording: () => void;
    stopListeningAndSend: () => void;
}

export const ListeningOverlay: React.FC<ListeningOverlayProps> = ({ liveTranscript, visualLevels, cancelRecording, stopListeningAndSend }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="absolute top-10 left-10"><button onClick={cancelRecording} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><X className="w-8 h-8" /></button></div>
            <div className="text-center mb-10"><h2 className="text-3xl font-black text-white mb-2 animate-pulse">جاري الاستماع...</h2><p className="text-white/50 text-lg font-medium">{liveTranscript || "سامعك يا ريس..."}</p></div>
            <div className="flex items-end gap-1.5 h-32 mb-12">{visualLevels.map((level, i) => (<div key={i} className="w-3 bg-gradient-to-t from-cyan-600 to-purple-500 rounded-full transition-all duration-75" style={{ height: `${Math.max(10, level / 2)}%`, opacity: Math.max(0.3, level / 255) }}></div>))}</div>
            <button onClick={stopListeningAndSend} className="p-6 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform"><Square className="w-8 h-8 fill-current" /></button>
        </div>
    );
};
