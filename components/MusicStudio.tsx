import React, { useState, useRef, useEffect } from 'react';
import { MusicGeneratorService } from '../services/musicGeneratorService';
import { Play, Pause, Download, Save, Loader2, Music, Share2, Copy, Sparkles, Mic, Sliders, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAppStore } from '../services/store';

export const MusicStudio: React.FC = () => {
    const { user: currentUser } = useAppStore();
    const [genre, setGenre] = useState('Pop');
    const [mood, setMood] = useState('Happy');
    const [tempo, setTempo] = useState('Medium');
    const [singer, setSinger] = useState('default');
    const [trackLength, setTrackLength] = useState<'clip' | 'pro' | 'full'>('pro');
    const [prompt, setPrompt] = useState('');
    const [customLyrics, setCustomLyrics] = useState('');
    const [isWritingLyrics, setIsWritingLyrics] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [track, setTrack] = useState<{ audioBase64?: string, mimeType?: string, lyrics?: string, modelUsed?: string } | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDataArray, setAudioDataArray] = useState<Uint8Array | null>(null);
    const [copied, setCopied] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const hasCustomPromptRef = useRef(false);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const reqFrameRef = useRef<number | null>(null);
    
    const genreOptions = [
        { id: 'Pop', name: 'بوب عربي / مصري (Pop)' },
        { id: 'Shaabi (Mahraganat)', name: 'مهرجانات شعبي (Shaabi)' },
        { id: 'Hip Hop', name: 'راب / هيب هوب (Rap & Trap)' },
        { id: 'Rock', name: 'روك كلاسيكي (Rock)' },
        { id: 'Cyberpunk', name: 'سايبر بانك / ترانس (Techno)' },
        { id: 'Ambient', name: 'طربي هادئ (Classical Chill)' }
    ];

    const moodOptions = [
        { id: 'Happy', name: 'مبهج وفرحان' },
        { id: 'Energetic', name: 'حماسي ورقص' },
        { id: 'Sad', name: 'شجن وحزين' },
        { id: 'Romantic', name: 'رومانسي وعاطفي' },
        { id: 'Epic', name: 'ملحمي وفخم' },
        { id: 'Chill', name: 'رايق وهادئ' }
    ];

    const tempoOptions = [
        { id: 'Slow', name: 'ريتم بطيء (Ballad)' },
        { id: 'Medium', name: 'ريتم متوسط (Groove)' },
        { id: 'Fast', name: 'ريتم سريع (High BPM)' }
    ];
    
    const singerOptions = [
        { id: 'default', name: 'بصمة الظل الذكية (Default AI Singer)' },
        { id: 'amr_diab', name: 'عمرو دياب (الهضبة - رومانسي دافئ)' },
        { id: 'essam_sasa', name: 'عصام صاصا (كروان المهرجانات الشعبي)' },
        { id: 'wegz', name: 'ويجز (فلو راب وتراپ سريع)' },
        { id: 'tamer_hosny', name: 'تامر حسني (نجم الجيل - مشاعر وحماس)' },
        { id: 'sherine', name: 'شيرين عبد الوهاب (طرب وإحساس عالي)' },
        { id: 'umm_kulthum', name: 'أم كلثوم (كوكب الشرق - طرب أصيل)' },
        { id: 'instrumental', name: 'موسيقى فقط (توزيع بدون صوت بشري)' }
    ];
    
    useEffect(() => {
        if (!hasCustomPromptRef.current) {
            const selectedSingerObj = singerOptions.find(s => s.id === singer);
            const singerPart = singer === 'instrumental' ? ' (توزيع موسيقي فقط بدون غناء)' : (singer !== 'default' && selectedSingerObj ? ` بصوت وبصمة ${selectedSingerObj.name.split('(')[0].trim()}` : '');
            const selectedGenre = genreOptions.find(g => g.id === genre)?.name.split('(')[0].trim() || genre;
            setPrompt(`أغنية ${selectedGenre} بريتم ${tempo === 'Fast' ? 'سريع' : tempo === 'Slow' ? 'هادئ' : 'متوسط'} وطابع ${moodOptions.find(m => m.id === mood)?.name || mood}${singerPart}`);
        }
    }, [genre, mood, tempo, singer]);

    useEffect(() => {
        if (audioRef.current && track?.audioBase64) {
            audioRef.current.load();
        }
    }, [track]);
    
    // Step 1: Write Song Lyrics (يكتب أغنية)
    const handleWriteLyrics = async () => {
        setIsWritingLyrics(true);
        try {
            const lyrics = await MusicGeneratorService.writeLyrics(prompt, singer, genre);
            setCustomLyrics(lyrics);
            showToast("✍️ تم كتابة وتأليف كلمات الأغنية بقافية ووزن شعري متناسق!");
        } catch (e: any) {
            showToast("فشل كتابة الكلمات: " + e.message);
        } finally {
            setIsWritingLyrics(false);
        }
    };

    // Step 2 & 3: Produce, Arrange, and Sing (يوزع موسيقى ويغنيها)
    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await MusicGeneratorService.generateMusic(
                prompt, 
                trackLength, 
                singer,
                customLyrics || undefined
            );
            
            if (result.error) {
                showToast("خطأ: " + result.error);
                return;
            }
            
            setTrack(result);
            if (!customLyrics && result.lyrics) {
                setCustomLyrics(result.lyrics);
            }
            showToast("🎵 تم إنتاج الأغنية كاملة وتوزيع الموسيقى والغناء بنجاح!");
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsPlaying(false);
        } catch (e: any) {
            showToast("فشل الإنتاج: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSave = async () => {
        if (!track?.audioBase64) return;
        const metadata = {
            title: `${genre} - ${mood}`,
            prompt: prompt,
            timestamp: Date.now(),
            lyrics: customLyrics || track.lyrics,
        };
        try {
            await MusicGeneratorService.saveTrack(metadata, track.audioBase64);
            showToast("✓ تم حفظ الأغنية بنجاح في خزنة الموسيقى والألبوم الخاص بك!");
        } catch (e) {
            showToast("فشل حفظ التراك في الخزنة.");
            console.error(e);
        }
    };

    const handleShare = () => {
        const text = `استمع لهذه الأغنية التي تم تأليفها وتوزيعها وغناؤها بالذكاء الاصطناعي مع الظل!\nالنوع: ${genre}\nالأجواء: ${mood}\n🚀`;
        navigator.clipboard.writeText(text);
        showToast("✓ تم نسخ بيانات المشاركة إلى الحافظة!");
    };
    
    const handleCopyLyrics = () => {
        const textToCopy = customLyrics || track?.lyrics;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast("✓ تم نسخ كلمات الأغنية!");
    };
    
    const togglePlayback = () => {
        if (audioRef.current) {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContextClass) return;
                
                audioCtxRef.current = new AudioContextClass();
                analyserRef.current = audioCtxRef.current.createAnalyser();
                analyserRef.current.fftSize = 64; 
                
                try {
                    sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
                    sourceRef.current.connect(analyserRef.current);
                    analyserRef.current.connect(audioCtxRef.current.destination);
                } catch (e) {
                    console.warn("Audio source already connected or blocked", e);
                }
            }

            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                if (reqFrameRef.current) cancelAnimationFrame(reqFrameRef.current);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    updateWaveform();
                }).catch(err => {
                    console.error("Audio playback error:", err);
                    showToast("يرجى النقر لتشغيل الصوت");
                });
            }
        }
    };

    const updateWaveform = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioDataArray(dataArray);
        reqFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    useEffect(() => {
        return () => {
            if (reqFrameRef.current) cancelAnimationFrame(reqFrameRef.current);
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close().catch(() => {});
            }
        };
    }, []);

    const waveformBars = new Array(32).fill(0);

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4 md:p-6 bg-[#080d19] border border-cyan-500/20 rounded-3xl text-white shadow-2xl relative" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl shadow-lg shadow-purple-500/20">
                        <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white">استوديو الظل لصناعة الأغاني 🎵</h2>
                        <p className="text-xs text-cyan-300/70 font-mono">تأليف الكلمات • التوزيع الموسيقي المتطور • الغناء بالأوتوتيون والذكاء الاصطناعي</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                        Lyria 3 Pro & Neural TTS
                    </span>
                </div>
            </div>

            {/* Workflow 3-Steps Navigation Pill */}
            <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 text-center text-xs font-bold">
                <div className="py-2 rounded-xl bg-purple-600/30 text-purple-200 border border-purple-500/40 flex items-center justify-center gap-1.5">
                    <span>1. تأليف الكلمات</span>
                    <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="py-2 rounded-xl bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 flex items-center justify-center gap-1.5">
                    <span>2. التوزيع الموسيقي</span>
                    <Sliders className="w-3.5 h-3.5" />
                </div>
                <div className="py-2 rounded-xl bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 flex items-center justify-center gap-1.5">
                    <span>3. الغناء والماستر</span>
                    <Mic className="w-3.5 h-3.5" />
                </div>
            </div>

            {/* Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Genre Selector */}
                <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-gray-300">النوع الموسيقي (Genre):</label>
                    <select 
                        value={genre} 
                        onChange={(e) => setGenre(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    >
                        {genreOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Singer Selector */}
                <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-gray-300">المطرب / بصمة الصوت (Singer):</label>
                    <select 
                        value={singer} 
                        onChange={(e) => setSinger(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    >
                        {singerOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Mood Selector */}
                <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-gray-300">الطابع والأجواء (Mood):</label>
                    <select 
                        value={mood} 
                        onChange={(e) => setMood(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    >
                        {moodOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Tempo Selector */}
                <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-gray-300">سرعة الإيقاع (Tempo):</label>
                    <select 
                        value={tempo} 
                        onChange={(e) => setTempo(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                    >
                        {tempoOptions.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Track Length Mode */}
            <div className="flex flex-col gap-1.5 text-right">
                <label className="text-xs font-bold text-gray-300">مدة التراك ونموذج الإنتاج:</label>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        type="button"
                        onClick={() => setTrackLength('clip')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${trackLength === 'clip' ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200 shadow-md' : 'bg-black/40 border-white/10 text-white/50 hover:text-white'}`}
                    >
                        <span>مقطع سريع (Lyria Clip)</span>
                        <span className="block text-[10px] opacity-70">20 - 30 ثانية</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setTrackLength('pro')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${trackLength === 'pro' ? 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-md' : 'bg-black/40 border-white/10 text-white/50 hover:text-white'}`}
                    >
                        <span>تراك ستوديو كامل (Lyria Pro)</span>
                        <span className="block text-[10px] opacity-70">60 ثانية متكاملة</span>
                    </button>
                    <button 
                        type="button"
                        onClick={() => setTrackLength('full')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${trackLength === 'full' ? 'bg-pink-600/30 border-pink-400 text-pink-200 shadow-md' : 'bg-black/40 border-white/10 text-white/50 hover:text-white'}`}
                    >
                        <span>تراك ممتد مع كورال شعبي</span>
                        <span className="block text-[10px] opacity-70">90 ثانية مع توزيع كامل</span>
                    </button>
                </div>
            </div>
            
            {/* Prompt Description */}
            <div className="flex flex-col gap-1.5 text-right">
                <label className="text-xs font-bold text-gray-300">موضوع وفكرة الأغنية:</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => {
                        hasCustomPromptRef.current = true;
                        setPrompt(e.target.value);
                    }}
                    className="bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400 min-h-[70px] text-right"
                    placeholder="مثال: مهرجان شعبي حماسي سريع عن الجدعنة والصحاب الجدعان في الشارع المصري..."
                />
            </div>

            {/* STEP 1: SONGWRITING & LYRICS ACCORDION */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleWriteLyrics}
                        disabled={isWritingLyrics || !prompt}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-all"
                    >
                        {isWritingLyrics ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isWritingLyrics ? 'جاري تأليف الكلمات...' : '1. تأليف وكتابة الكلمات بالذكاء الاصطناعي ✍️'}</span>
                    </button>

                    <label className="text-xs font-bold text-purple-300">كلمات الأغنية (يمكنك تعديلها بحرية):</label>
                </div>

                <textarea 
                    value={customLyrics}
                    onChange={(e) => setCustomLyrics(e.target.value)}
                    className="bg-black/80 border border-purple-500/30 rounded-xl p-3 text-xs md:text-sm text-white/90 outline-none focus:border-purple-400 min-h-[140px] text-right font-sans leading-relaxed"
                    placeholder="ستظهر كلمات الأغنية هنا مقفاة ومقسمة إلى (المقدمة، المذهب، اللازمة، الكوبليه، القفلة)، أو اكتب كلماتك الخاصة ليتم غناؤها وتلحينها فوراً..."
                />
            </div>
            
            {/* STEP 2 & 3: PRODUCE, ARRANGE & SING BUTTON */}
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-purple-600/25 text-sm md:text-base cursor-pointer"
            >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                <span>{isGenerating ? 'جاري التوزيع الموسيقي وتوليد الصوت والغناء...' : '2 & 3. توزيع الموسيقى وغناء الأغنية الآن 🎤'}</span>
            </button>
            
            {/* OUTPUT TRACK & PLAYER */}
            {track?.audioBase64 && (
                <div className="bg-[#0c1424] p-5 rounded-2xl border border-cyan-500/40 flex flex-col gap-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="text-base font-black text-white">الأغنية جاهزة (Master Output Track)</h3>
                        </div>
                        {track.modelUsed && (
                            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                                {track.modelUsed}
                            </span>
                        )}
                    </div>
                    
                    {/* Audio Player and Waveform */}
                    <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-white/5">
                        <button 
                            onClick={togglePlayback}
                            className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cyan-500/30 shrink-0"
                            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                        >
                            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-0.5" />}
                        </button>
                        
                        <div className="flex-1 h-14 flex items-end gap-[3px] bg-black/80 rounded-xl p-2.5 overflow-hidden items-center border border-white/5">
                            {/* Real-time Frequency Waveform */}
                            {waveformBars.map((_, i) => {
                                let val = 15;
                                if (audioDataArray && audioDataArray[i]) {
                                    val = 15 + (audioDataArray[i] / 255) * 85;
                                } else if (isPlaying) {
                                     val = 25 + Math.random() * 50;
                                }
                                return (
                                    <div 
                                        key={i} 
                                        className="w-full bg-gradient-to-t from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-75"
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

                    {/* Action Buttons: Save, Download, Share, Copy */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>حفظ في الخزنة</span>
                            </button>

                            <a
                                href={`data:${track.mimeType || 'audio/wav'};base64,${track.audioBase64}`}
                                download={`shadow_song_${Date.now()}.wav`}
                                className="px-3.5 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل الأغنية</span>
                            </a>

                            <button
                                onClick={handleShare}
                                className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>مشاركة</span>
                            </button>
                        </div>

                        {(customLyrics || track.lyrics) && (
                            <button
                                onClick={handleCopyLyrics}
                                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>{copied ? 'تم النسخ ✓' : 'نسخ الكلمات'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Toast Message */}
            {toastMessage && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-[#0a1224] border border-cyan-500/40 text-cyan-200 text-xs font-bold shadow-[0_0_25px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
};

export default MusicStudio;
