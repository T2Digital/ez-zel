import React, { useState, useEffect } from 'react';
import { X, Volume2, Play, Square, Check, Sparkles, Waves, Gauge, UserCheck, Loader2 } from 'lucide-react';
import {
    HUMAN_VOICE_PERSONAS,
    HUMAN_VOICE_STYLES,
    HumanVoicePersonaId,
    HumanVoiceStyle,
    getHumanVoiceConfig,
    saveHumanVoiceConfig
} from '../../services/voicePersonaService';
import { playShadowVoice, stopVoice, audioCache, resumeAudioContext } from '../../services/speechService';
import { shadowDB, UserProfile } from '../../services/dbService';

interface HumanVoiceToneModalProps {
    onClose: () => void;
    user?: UserProfile | null;
    onProfileUpdated?: (updated: UserProfile) => void;
}

const PACE_OPTIONS = [
    { value: 0.92, label: 'هادئ ورزين (0.92x)' },
    { value: 1.0, label: 'طبيعي بشري (1.0x)' },
    { value: 1.08, label: 'متدفق حيوي (1.08x)' },
    { value: 1.15, label: 'سريع خاطف (1.15x)' }
];

export const HumanVoiceToneModal: React.FC<HumanVoiceToneModalProps> = ({ onClose, user, onProfileUpdated }) => {
    const initial = getHumanVoiceConfig(user?.voicePreference);
    const [selectedPersonaId, setSelectedPersonaId] = useState<HumanVoicePersonaId>(initial.personaId);
    const [selectedStyle, setSelectedStyle] = useState<HumanVoiceStyle>(initial.style);
    const [selectedPace, setSelectedPace] = useState<number>(initial.pace);
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [isSynthesizing, setIsSynthesizing] = useState<string | null>(null);
    const [savedNotice, setSavedNotice] = useState(false);

    useEffect(() => {
        const handleEnded = () => {
            setPreviewingId(null);
            setIsSynthesizing(null);
        };
        window.addEventListener('shadow_voice_ended', handleEnded);
        return () => {
            window.removeEventListener('shadow_voice_ended', handleEnded);
            stopVoice();
        };
    }, []);

    const applyConfig = async (
        nextPersonaId: HumanVoicePersonaId,
        nextStyle: HumanVoiceStyle,
        nextPace: number,
        showFeedback = false
    ) => {
        saveHumanVoiceConfig({
            personaId: nextPersonaId,
            style: nextStyle,
            pace: nextPace
        });
        audioCache.clear();

        const persona = HUMAN_VOICE_PERSONAS.find(p => p.id === nextPersonaId);
        if (user && persona && user.email && user.email !== 'GUEST') {
            const updated: UserProfile = {
                ...user,
                voicePreference: persona.gender
            };
            shadowDB.saveProfile(updated).catch(() => {});
            onProfileUpdated?.(updated);
        }

        if (showFeedback) {
            setSavedNotice(true);
            setTimeout(() => setSavedNotice(false), 2500);
        }
    };

    const handleSelectPersona = (id: HumanVoicePersonaId) => {
        setSelectedPersonaId(id);
        applyConfig(id, selectedStyle, selectedPace, true);
    };

    const handleSelectStyle = (style: HumanVoiceStyle) => {
        setSelectedStyle(style);
        applyConfig(selectedPersonaId, style, selectedPace, true);
    };

    const handleSelectPace = (pace: number) => {
        setSelectedPace(pace);
        applyConfig(selectedPersonaId, selectedStyle, pace, true);
    };

    const handlePreviewVoice = async (personaId: HumanVoicePersonaId, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (previewingId === personaId) {
            stopVoice();
            setPreviewingId(null);
            setIsSynthesizing(null);
            return;
        }

        stopVoice();
        resumeAudioContext();

        // Persist temporarily so style + pace apply accurately during preview
        saveHumanVoiceConfig({
            personaId,
            style: selectedStyle,
            pace: selectedPace
        });
        setSelectedPersonaId(personaId);

        const persona = HUMAN_VOICE_PERSONAS.find(p => p.id === personaId) || HUMAN_VOICE_PERSONAS[0];
        setIsSynthesizing(personaId);
        setPreviewingId(personaId);

        await playShadowVoice(
            persona.sampleGreeting,
            persona.id,
            undefined,
            () => {
                setPreviewingId(null);
                setIsSynthesizing(null);
            },
            () => {
                setIsSynthesizing(null);
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-[750] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 animate-in fade-in font-['Cairo']"
            dir="rtl"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-[#090d16] border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-gradient-to-l from-cyan-950/60 via-purple-950/40 to-[#090d16] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                            <Waves className="w-6 h-6 text-cyan-300" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg md:text-xl font-black text-white">نبرة صوت الظل البشري</h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
                                    Human Neural Voice
                                </span>
                            </div>
                            <p className="text-xs text-white/60 mt-0.5">
                                اختر البصمة الصوتية البشرية، الإحساس، وسرعة الإلقاء ليتحدث الظل بصوت طبيعي حقيقي غير آلي
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-300 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-hide">
                    {/* 1. Human Voice Personas */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-black text-cyan-300 flex items-center gap-2">
                                <UserCheck className="w-4 h-4" />
                                1. اختر شخصية ونبرة الصوت البشري
                            </h3>
                            {savedNotice && (
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
                                    <Check className="w-3.5 h-3.5" /> تم التفعيل فوراً
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                            {HUMAN_VOICE_PERSONAS.map((persona) => {
                                const isSelected = selectedPersonaId === persona.id;
                                const isPlayingThis = previewingId === persona.id;
                                const isLoadingThis = isSynthesizing === persona.id;

                                return (
                                    <div
                                        key={persona.id}
                                        onClick={() => handleSelectPersona(persona.id)}
                                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-gradient-to-l from-cyan-500/20 via-purple-500/15 to-white/5 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                                : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                                                    isSelected
                                                        ? 'bg-cyan-500/25 border-cyan-300 text-cyan-200'
                                                        : 'bg-white/5 border-white/10 text-white/50'
                                                }`}
                                            >
                                                <Volume2 className={`w-5 h-5 ${isPlayingThis ? 'animate-bounce text-cyan-300' : ''}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-black text-sm text-white">{persona.name}</span>
                                                    <span
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                            persona.gender === 'male'
                                                                ? 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                                                                : 'bg-pink-500/10 border-pink-400/30 text-pink-300'
                                                        }`}
                                                    >
                                                        {persona.gender === 'male' ? 'صوت رجالي بشري' : 'صوت نسائي بشري'}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="text-[10px] font-black text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md">
                                                            مُفعّل الآن ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-white/60 mt-1 leading-relaxed">{persona.subtitle}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handlePreviewVoice(persona.id, e)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 border transition-all ${
                                                isPlayingThis
                                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                                    : 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-200'
                                            }`}
                                        >
                                            {isLoadingThis ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>تحضير...</span>
                                                </>
                                            ) : isPlayingThis ? (
                                                <>
                                                    <Square className="w-3.5 h-3.5 fill-current" />
                                                    <span>إيقاف</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-3.5 h-3.5 fill-current" />
                                                    <span>اسمع النبرة</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Emotional Expression Style */}
                    <div>
                        <h3 className="text-sm font-black text-purple-300 flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4" />
                            2. الإحساس وأسلوب الأداء البشري
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {HUMAN_VOICE_STYLES.map((st) => {
                                const active = selectedStyle === st.id;
                                return (
                                    <button
                                        key={st.id}
                                        type="button"
                                        onClick={() => handleSelectStyle(st.id)}
                                        className={`p-3 rounded-xl border text-right transition-all ${
                                            active
                                                ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-white/70'
                                        }`}
                                    >
                                        <div className="font-bold text-xs flex items-center justify-between">
                                            <span>{st.label}</span>
                                            {active && <Check className="w-3.5 h-3.5 text-purple-300" />}
                                        </div>
                                        <p className="text-[11px] text-white/50 mt-1">{st.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Speaking Pace */}
                    <div>
                        <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2 mb-3">
                            <Gauge className="w-4 h-4" />
                            3. سرعة التحدث وتدفق الكلام
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PACE_OPTIONS.map((opt) => {
                                const active = Math.abs(selectedPace - opt.value) < 0.02;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleSelectPace(opt.value)}
                                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                            active
                                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 text-white/60'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#060911] flex items-center justify-between gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={() => handlePreviewVoice(selectedPersonaId)}
                        className="px-4 py-3 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-xs md:text-sm font-black flex items-center gap-2 transition-all"
                    >
                        <Volume2 className="w-4 h-4" />
                        <span>{previewingId === selectedPersonaId ? 'إيقاف التجربة الصوتية' : 'تجربة النبرة المختارة الآن 🔊'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            applyConfig(selectedPersonaId, selectedStyle, selectedPace, false);
                            onClose();
                        }}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-xs md:text-sm shadow-lg shadow-cyan-500/20 transition-all"
                    >
                        اعتماد النبرة البشرية
                    </button>
                </div>
            </div>
        </div>
    );
};
