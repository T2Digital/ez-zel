import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Music2, Sparkles, RefreshCw, Volume2, ArrowRight, Disc3, Mic, Layers, Save, Trash2, Sliders } from 'lucide-react';
import { Track } from '../types';
import { synthesizeProceduralTrack, generateLyricsFromAI } from '../services/musicGeneratorService';

interface MusicStudioProps {
  onBack: () => void;
}

export const MusicStudio: React.FC<MusicStudioProps> = ({ onBack }) => {
  const [genre, setGenre] = useState<string>('شعبي');
  const [mood, setMood] = useState<string>('حماسي ومبهج');
  const [prompt, setPrompt] = useState<string>('');
  const [bpm, setBpm] = useState<number>(128);
  const [duration, setDuration] = useState<number>(24);
  const [voicePersona, setVoicePersona] = useState<string>('الظل الرقمي (Ez-Zel Neural)');
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);

  // Saved Tracks (Local persistence)
  const [savedTracks, setSavedTracks] = useState<Track[]>(() => {
    try {
      const stored = localStorage.getItem('ez_zel_saved_music');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Available Presets
  const genres = [
    { id: 'شعبي', name: 'شعبي ومهرجانات', desc: 'إيقاعات مقسوم ودربكة حماسية مع بيز هادر' },
    { id: 'راب', name: 'راب وتراب (Trap)', desc: '808 Sub-bass قوي مع هاي هاتس سريعة' },
    { id: 'بوب', name: 'بوب وطربي حديث', desc: 'ألحان شجية وكوردات بيانو دافئة' },
    { id: 'روك', name: 'روك وسايبربانك', desc: 'سولوهات جيتار كهربائي وإيقاع ناري' },
    { id: 'طربي', name: 'مقام حجاز وطرب', desc: 'تقاسيم شرقية وأجواء هادئة وأصيلة' },
  ];

  const moods = ['حماسي ومبهج', 'طموح وانتصار', 'رومانسي وشاعري', 'غامض وحصين', 'حنين وفخر'];
  const voices = [
    'الظل الرقمي (Ez-Zel Neural)',
    'صوت شبابي ناري (Mahraganat Style)',
    'صوت أنثوي طربي (Melodic Vocals)',
    'صوت رابر عميق (Deep Baritone)',
    'آلات موسيقية فقط (Instrumental)',
  ];

  // Save tracks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ez_zel_saved_music', JSON.stringify(savedTracks));
    } catch (e) {
      console.error(e);
    }
  }, [savedTracks]);

  // Handle Track Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);

    try {
      // Step 1: Lyrics & Composition with Google AI Lyrics 3.5 Engine
      setGenerationStep('جارٍ تأليف الكلمات وضبط القوافي والمقامات (Google AI Lyrics 3.5)...');
      const { title, lyrics } = await generateLyricsFromAI(prompt, genre, mood);

      await new Promise(r => setTimeout(r, 600));

      // Step 2: Harmonic Arrangement & Synthesis
      setGenerationStep('جارٍ توليد الإيقاعات والهارموني والبيز (Procedural Audio Engine)...');
      const audioResult = await synthesizeProceduralTrack(genre, bpm, duration, !isInstrumental);

      await new Promise(r => setTimeout(r, 500));

      // Step 3: Mastering & Packaging
      setGenerationStep('جارٍ معالجة الصوت والمكس النهائي...');

      const newTrack: Track = {
        id: `track-${Date.now()}`,
        title: title || `تراك ${genre} الجديد`,
        genre,
        mood,
        bpm,
        lyrics: isInstrumental ? '(موسيقى تصويرية خالصة بدون كلمات)' : lyrics,
        audioUrl: audioResult.audioUrl,
        duration: audioResult.duration,
        createdAt: new Date().toLocaleDateString('ar-EG'),
        voicePersona,
        isInstrumental,
      };

      setCurrentTrack(newTrack);
      setSavedTracks(prev => [newTrack, ...prev]);

      // Auto-play new track
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = newTrack.audioUrl || '';
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 200);

    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Audio Time Update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const renderVisualizer = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 48;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = isPlaying
          ? Math.abs(Math.sin((frame + i * 4) * 0.08)) * (canvas.height * 0.8) + 8
          : 6;

        const x = i * barWidth;
        const y = (canvas.height - height) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + height);
        gradient.addColorStop(0, '#00f2fe');
        gradient.addColorStop(0.5, '#7928ca');
        gradient.addColorStop(1, '#ff0080');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1.5, y, barWidth - 3, height);
      }

      frame++;
      animationFrameRef.current = requestAnimationFrame(renderVisualizer);
    };

    renderVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative z-10 min-h-screen bg-[#05070d]/90 text-slate-100 p-4 md:p-8 backdrop-blur-md">
      {/* Top Bar Navigation */}
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800/80 pb-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
            <Music2 className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-cairo bg-gradient-to-r from-cyan-400 via-teal-200 to-purple-400 bg-clip-text text-transparent">
              استوديو الموسيقى والإنتاج الصوتي (Google AI Lyrics 3.5)
            </h1>
            <p className="text-xs text-slate-400">تأليف فوري لكلمات الأغاني وإنتاج تراكات موسيقية حقيقية بالكامل</p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-all shadow-md"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للوحة القيادة
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Track Creation Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Prompt & Theme */}
          <div className="p-6 rounded-2xl bg-[#0e1424]/90 border border-slate-800 shadow-xl space-y-4">
            <label className="block text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              موضوع الأغنية أو فكرة التراك
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="اكتب فكرة الأغنية أو الكلمات التي تريدها (مثال: أغنية شعبية حماسية عن النجاح والصبر وإثبات الذات...)"
              className="w-full h-24 p-3.5 rounded-xl bg-[#070a13] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none"
            />

            {/* Quick Genre Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2.5">
                اختر النمط الموسيقي (Genre):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGenre(g.id)}
                    className={`p-3 rounded-xl text-right transition-all border ${
                      genre === g.id
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-100">{g.name}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood & Voice Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الحالة المزاجية (Mood):</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  {moods.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                  البصمة الصوتية (Voice Persona):
                </label>
                <select
                  value={voicePersona}
                  onChange={(e) => {
                    setVoicePersona(e.target.value);
                    setIsInstrumental(e.target.value.includes('Instrumental'));
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 outline-none"
                >
                  {voices.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tempo (BPM) & Duration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-cyan-400" /> السرعة (BPM):</span>
                  <span className="font-mono text-cyan-400 font-bold">{bpm} BPM</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="160"
                  step="2"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>مدة التراك:</span>
                  <span className="font-mono text-purple-400 font-bold">{duration} ثانية</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="45"
                  step="4"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-xl font-bold font-cairo flex items-center justify-center gap-2.5 transition-all duration-200 ${
                isGenerating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-purple-600 text-black hover:opacity-95 shadow-lg shadow-cyan-500/25 active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  <span className="text-sm">{generationStep || 'جارٍ إنتاج التراك والموسيقى...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>توليد وإنتاج الأغنية الآن</span>
                </>
              )}
            </button>
          </div>

          {/* Saved Tracks Vault */}
          <div className="p-5 rounded-2xl bg-[#0e1424]/70 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-purple-400" />
              المكتبة والتراكات المحفوظة ({savedTracks.length})
            </h3>
            {savedTracks.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">لم تقم بإنتاج أي تراكات بعد. ابدأ الآن بالضغط على زر التوليد أعلاه!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedTracks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      currentTrack?.id === t.id
                        ? 'bg-cyan-950/40 border-cyan-500/50'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setCurrentTrack(t);
                        if (audioRef.current && t.audioUrl) {
                          audioRef.current.src = t.audioUrl;
                          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                        }
                      }}
                      className="cursor-pointer flex-1 truncate ml-2"
                    >
                      <div className="font-semibold text-slate-200 truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.genre} • {t.bpm} BPM • {t.duration}s
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.audioUrl && (
                        <a
                          href={t.audioUrl}
                          download={`${t.title}.wav`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-300"
                          title="تحميل"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setSavedTracks(prev => prev.filter(item => item.id !== t.id))}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-red-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Player & Lyrics (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Audio Visualizer & Player Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0e1424] to-[#080c16] border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                {currentTrack ? `${currentTrack.genre} • ${currentTrack.bpm} BPM` : 'مشغل الاستوديو'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentTrack ? `${Math.floor(currentTime)}s / ${currentTrack.duration}s` : '00:00'}
              </span>
            </div>

            {/* Visualizer Canvas */}
            <div className="relative h-28 bg-[#050811] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} width={380} height={110} className="w-full h-full" />
              {!currentTrack && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5 pointer-events-none">
                  <Music2 className="w-6 h-6 text-slate-600" />
                  <span>اضغط على زر التوليد لبدء الاستماع</span>
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center">
              <h2 className="font-bold text-base text-slate-100">
                {currentTrack?.title || 'جاهز للإنتاج والتأليف'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentTrack?.voicePersona || 'Google AI Lyrics 3.5 + Neural Synthesizer'}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlay}
                disabled={!currentTrack}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  currentTrack
                    ? 'bg-gradient-to-tr from-cyan-400 to-purple-600 text-black shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              </button>

              {currentTrack?.audioUrl && (
                <a
                  href={currentTrack.audioUrl}
                  download={`${currentTrack.title}.wav`}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 transition-all"
                  title="تحميل ملف التراك بصيغة WAV"
                >
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 pt-2 text-slate-400 text-xs">
              <Volume2 className="w-4 h-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  if (audioRef.current) audioRef.current.volume = val;
                }}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Lyrics Box */}
          <div className="p-6 rounded-2xl bg-[#0e1424]/90 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              كلمات الأغنية والشعر (Lyrics)
            </h3>
            <div className="p-4 rounded-xl bg-[#070a13] border border-slate-800/80 min-h-[160px] max-h-64 overflow-y-auto text-xs text-slate-200 leading-relaxed font-cairo whitespace-pre-line">
              {currentTrack?.lyrics || 'ستظهر هنا كلمات الأغنية الموزونة فور تأليفها وتوليد التراك...'}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};
