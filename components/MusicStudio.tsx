import React, { useState, useRef, useEffect } from 'react';
import { MusicGeneratorService } from '../services/musicGeneratorService';
import { Play, Pause, Download, Save, Loader2, Music, Share2 } from 'lucide-react';
import { useAppStore } from '../services/store';

export const MusicStudio: React.FC = () => {
    const { user: currentUser } = useAppStore();
    const [genre, setGenre] = useState('Pop');
    const [mood, setMood] = useState('Happy');
    const [tempo, setTempo] = useState('Medium');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [track, setTrack] = useState<{ audioBase64?: string, mimeType?: string, lyrics?: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDataArray, setAudioDataArray] = useState<Uint8Array | null>(null);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const reqFrameRef = useRef<number | null>(null);
    
    const genreOptions = ['Pop', 'Shaabi (Mahraganat)', 'Hip Hop', 'Rock', 'Cyberpunk', 'Ambient'];
    const moodOptions = ['Energetic', 'Happy', 'Sad', 'Dark', 'Chill', 'Romantic', 'Epic'];
    const tempoOptions = ['Slow', 'Medium', 'Fast'];
    
    useEffect(() => {
        setPrompt(`A ${tempo} tempo ${mood} ${genre} song`);
    }, [genre, mood, tempo]);

    useEffect(() => {
        if (audioRef.current && track?.audioBase64) {
            audioRef.current.load();
        }
    }, [track]);
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        const result = await MusicGeneratorService.generateMusic(prompt, 'clip');
        setIsGenerating(false);
        if (result.error) {
            alert("Error: " + result.error);
            return;
        }
        setTrack(result);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
    };
    
    const handleSave = async () => {
        if (!track?.audioBase64) return;
        const metadata = {
            title: `${mood} ${genre} Tune`,
            prompt: prompt,
            timestamp: Date.now(),
            lyrics: track.lyrics,
        };
        try {
            await MusicGeneratorService.saveTrack(metadata, track.audioBase64);
            alert("Track saved securely to Vault!");
        } catch (e) {
            alert("Failed to save track.");
            console.error(e);
        }
    };

    const handleShare = () => {
        const url = window.location.href; // In a real app we'd generate a deep link with the ID
        const text = encodeURIComponent(`Listen to this AI-generated track I just made with Ez-Zel Digital Shadow!\nGenre: ${genre}\nMood: ${mood}\n🚀`);
        const whatsappUrl = `https://wa.me/?text=${text}`;
        window.open(whatsappUrl, '_blank');
    };
    
    const togglePlayback = () => {
        if (audioRef.current) {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) return;
                
                audioCtxRef.current = new AudioContextClass();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 64; 
                
                sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                sourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioCtxRef.current.destination);
            }
            
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                if (reqFrameRef.current) cancelAnimationFrame(reqFrameRef.current);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
                drawWaveform();
            }
        }
    };

    const drawWaveform = () => {
        if (!analyserRef.current || !isPlaying) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioDataArray(dataArray);
        reqFrameRef.current = requestAnimationFrame(drawWaveform);
    };

    useEffect(() => {
        return () => {
            if (reqFrameRef.current) cancelAnimationFrame(reqFrameRef.current);
        };
    }, []);

    const waveformBars = Array.from({ length: 32 });

    return (
        <div className="bg-black text-white p-6 rounded-2xl w-full max-w-4xl mx-auto flex flex-col gap-6 border border-gray-800">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Music Studio</h2>
                    <p className="text-sm text-gray-400">Generate studio-quality tracks with Lyria</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Genre</label>
                    <select 
                        value={genre} 
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-purple-500"
                    >
                        {genreOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Mood</label>
                    <select 
                        value={mood} 
                        onChange={(e) => setMood(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-purple-500"
                    >
                        {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-400">Tempo</label>
                    <select 
                        value={tempo} 
                        onChange={(e) => setTempo(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-purple-500"
                    >
                        {tempoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Custom Prompt (optional)</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 min-h-[80px]"
                    placeholder="Describe the song, e.g. A fast paced electronic dance track about space exploration..."
                />
            </div>
            
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
                {isGenerating ? 'Generating Track...' : 'Generate AI Music'}
            </button>
            
            {track?.audioBase64 && (
                <div className="mt-8 bg-gray-900 p-6 rounded-2xl border border-gray-800 flex flex-col gap-6">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Play className="w-4 h-4 text-purple-400" /> Output Track
                    </h3>
                    
                    {/* Audio Player and Waveform simulation */}
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={togglePlayback}
                            className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-1" />}
                        </button>
                        
                        <div className="flex-1 h-12 flex items-end gap-[3px] bg-black/40 rounded-xl p-2 overflow-hidden items-center">
                            {/* Real-time Frequency Waveform */}
                            {waveformBars.map((_, i) => {
                                let val = 10;
                                if (audioDataArray && audioDataArray[i]) {
                                    val = 10 + (audioDataArray[i] / 255) * 90;
                                } else if (isPlaying) {
                                     val = 20 + Math.random() * 30;
                                }
                                return (
                                    <div 
                                        key={i} 
                                        className="w-full bg-gradient-to-t from-purple-600 to-cyan-400 rounded-full transition-all duration-75"
                                        style={{ height: `${val}%` }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    
                    <audio 
                        key={track.audioBase64}
                        ref={audioRef}
                        crossOrigin="anonymous"
                        src={`data:${track.mimeType || 'audio/wav'};base64,${track.audioBase64}`}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                    />
                    
                    {track.lyrics && (
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 max-h-48 overflow-y-auto mt-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Generated Lyrics</h4>
                            <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                                {track.lyrics}
                            </p>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSave}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" /> Save to Vault
                        </button>
                        <button 
                            onClick={handleShare}
                            className="flex-1 bg-gray-800 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Share2 className="w-4 h-4" /> Share to WhatsApp
                        </button>
                        <a 
                            href={`data:${track.mimeType || 'audio/wav'};base64,${track.audioBase64}`}
                            download={`AI_Track_${Date.now()}.${track.mimeType?.split('/')[1] || 'wav'}`}
                            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center justify-center text-white transition-colors"
                        >
                            <Download className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};
