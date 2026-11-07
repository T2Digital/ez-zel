export type HumanVoicePersonaId =
    | 'charon_sovereign'
    | 'puck_egyptian'
    | 'fenrir_commander'
    | 'kore_layla'
    | 'zephyr_calm';

export type HumanVoiceStyle =
    | 'natural'
    | 'warm'
    | 'wise'
    | 'energetic'
    | 'cinematic';

export interface HumanVoicePersonaDefinition {
    id: HumanVoicePersonaId;
    name: string;
    shortBadge: string;
    subtitle: string;
    gender: 'male' | 'female';
    geminiVoice: 'Charon' | 'Puck' | 'Fenrir' | 'Kore' | 'Zephyr';
    edgeVoice: string;
    edgeRate: string;
    edgePitch: string;
    baseStylePrompt: string;
    sampleGreeting: string;
}

export interface HumanVoiceConfig {
    personaId: HumanVoicePersonaId;
    style: HumanVoiceStyle;
    pace: number;
}

const STORAGE_KEY = 'shadow_human_voice_config_v1';

export const HUMAN_VOICE_PERSONAS: HumanVoicePersonaDefinition[] = [
    {
        id: 'charon_sovereign',
        name: 'الظل السيادي (نبرة بشرية نقية)',
        shortBadge: 'الظل البشري • وقور وطبيعي',
        subtitle: 'نبرة بشرية مصرية حقيقية 100% بنَفَس استوديو طبيعي فائق النقاء وبدون أي تعديل إلكتروني',
        gender: 'male',
        geminiVoice: 'Charon',
        edgeVoice: 'ar-EG-ShakirNeural',
        edgeRate: '+0%',
        edgePitch: '+0Hz',
        baseStylePrompt: 'Deep, warm, authentic natural human Egyptian Arabic male voice, pristine studio delivery without digital artifacts or robotic pitch shifts',
        sampleGreeting: 'يا ريس، أنا ظلك الرقمي بنبرتي البشرية الحقيقية.. عقلك التاني اللي فاهمك وسابق معاك بخطوة.'
    },
    {
        id: 'puck_egyptian',
        name: 'المايسترو المصري (تلقائي وحيوي)',
        shortBadge: 'المايسترو • بشري حي',
        subtitle: 'صوت بشري مصري طبيعي قريب للقلب، سريع البديهة وحميمي كصديق حقيقي',
        gender: 'male',
        geminiVoice: 'Puck',
        edgeVoice: 'ar-EG-ShakirNeural',
        edgeRate: '+0%',
        edgePitch: '+0Hz',
        baseStylePrompt: 'Natural, expressive, street-smart friendly Egyptian human male voice with warm conversational rhythm and authentic emotion',
        sampleGreeting: 'أهلاً يا هندسة! أنا معاك على الخط بنبرة بشرية طبيعية مية في المية، قولّي نبدأ بإيه دلوقتي؟'
    },
    {
        id: 'fenrir_commander',
        name: 'الحارس الحازم (قوي وواثق)',
        shortBadge: 'الحارس • بشري حازم',
        subtitle: 'نبرة بشرية قوية وحاسمة لغرفة العمليات والتنفيذ السريع للمهام',
        gender: 'male',
        geminiVoice: 'Fenrir',
        edgeVoice: 'ar-SA-HamedNeural',
        edgeRate: '+0%',
        edgePitch: '+0Hz',
        baseStylePrompt: 'Strong, clear, authoritative human male voice with natural warmth, crisp articulation, and decisive pacing',
        sampleGreeting: 'غرفة عمليات الظل جاهزة بالكامل. جميع الأنظمة تحت سيطرتك ومستعد للتنفيذ الفوري.'
    },
    {
        id: 'kore_layla',
        name: 'ليلى — الظل الأنثوي (دافئة وطبيعية)',
        shortBadge: 'ليلى • بشرية دافئة',
        subtitle: 'نبرة بشرية أنثوية ناعمة، دافئة ومعبّرة بإحساس بشري صادق وواضح',
        gender: 'female',
        geminiVoice: 'Kore',
        edgeVoice: 'ar-EG-SalmaNeural',
        edgeRate: '+0%',
        edgePitch: '+0Hz',
        baseStylePrompt: 'Warm, expressive, natural human Egyptian Arabic female voice, empathetic, smooth, and conversational',
        sampleGreeting: 'أهلاً بيك.. أنا ظلك الرقمي بنبرة بشرية هادية ودافية، معاك في كل تفصيلة تحب نرتبها سوا.'
    },
    {
        id: 'zephyr_calm',
        name: 'طيف زفير (هادئ وصافٍ)',
        shortBadge: 'زفير • بشري هادئ',
        subtitle: 'صوت بشري صافٍ ومريح للأعصاب بنقاء استوديو مثالي للقراءة الطويلة والتأمل',
        gender: 'female',
        geminiVoice: 'Zephyr',
        edgeVoice: 'ar-EG-SalmaNeural',
        edgeRate: '+0%',
        edgePitch: '+0Hz',
        baseStylePrompt: 'Calm, soothing, crystal-clear natural human voice with gentle pacing and soft natural breath',
        sampleGreeting: 'مساء الهدوء والتركيز.. كل أفكارك ومهامك في أمان، خد نفس عميق وخليني أرتبلك كل حاجة.'
    }
];

export const HUMAN_VOICE_STYLES: { id: HumanVoiceStyle; label: string; desc: string; promptAddon: string }[] = [
    {
        id: 'natural',
        label: 'تلقائي بشري طبيعي',
        desc: 'إلقاء بشري متوازن بنَفَس ووقفات طبيعية تماماً',
        promptAddon: 'natural conversational human cadence, authentic pauses, never robotic'
    },
    {
        id: 'warm',
        label: 'دافئ وقريب للقلب',
        desc: 'نبرة حنونة وداعمة مليئة بالدفء الإنساني',
        promptAddon: 'warm, empathetic, intimate friendly human tone'
    },
    {
        id: 'wise',
        label: 'حكيم وهادئ رزين',
        desc: 'وقور، عميق، ومتأنٍ كالمستشار الخبير',
        promptAddon: 'wise, composed, thoughtful, calm measured human delivery'
    },
    {
        id: 'energetic',
        label: 'حماسي ومتدفق',
        desc: 'طاقة عالية وحيوية محفزة للإنجاز السريع',
        promptAddon: 'energetic, engaging, upbeat dynamic human delivery'
    },
    {
        id: 'cinematic',
        label: 'سينمائي غامض',
        desc: 'نبرة عميقة آسرة بأجواء الظل السيادية',
        promptAddon: 'cinematic, low-key mysterious, velvet human voice with subtle breath'
    }
];

const DEFAULT_CONFIG: HumanVoiceConfig = {
    personaId: 'charon_sovereign',
    style: 'natural',
    pace: 1.0
};

export function getHumanVoiceConfig(fallbackGender?: 'male' | 'female'): HumanVoiceConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const exists = HUMAN_VOICE_PERSONAS.some(p => p.id === parsed.personaId);
            if (exists) {
                return {
                    personaId: parsed.personaId,
                    style: parsed.style || 'natural',
                    pace: typeof parsed.pace === 'number' ? Math.min(1.25, Math.max(0.85, parsed.pace)) : 1.0
                };
            }
        }
    } catch {}

    if (fallbackGender === 'female') {
        return { ...DEFAULT_CONFIG, personaId: 'kore_layla' };
    }
    return DEFAULT_CONFIG;
}

export function saveHumanVoiceConfig(config: HumanVoiceConfig): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        window.dispatchEvent(new CustomEvent('shadow_voice_persona_changed', { detail: config }));
    } catch {}
}

export function resolveVoicePersona(voiceArg?: string): {
    persona: HumanVoicePersonaDefinition;
    config: HumanVoiceConfig;
    styleInstruction: string;
} {
    const config = getHumanVoiceConfig(voiceArg === 'female' ? 'female' : 'male');

    // If caller explicitly passed a persona ID, honor it directly (e.g., previewing a card in the modal)
    const explicitPersona = HUMAN_VOICE_PERSONAS.find(p => p.id === voiceArg);
    let persona = explicitPersona || HUMAN_VOICE_PERSONAS.find(p => p.id === config.personaId) || HUMAN_VOICE_PERSONAS[0];

    // If user hasn't explicitly saved a custom config yet and voiceArg requests female, match gender
    if (!explicitPersona && typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY) && voiceArg === 'female') {
        persona = HUMAN_VOICE_PERSONAS.find(p => p.id === 'kore_layla') || persona;
    }

    const styleObj = HUMAN_VOICE_STYLES.find(s => s.id === config.style) || HUMAN_VOICE_STYLES[0];
    const styleInstruction = `${persona.baseStylePrompt}; ${styleObj.promptAddon}`;

    return { persona, config, styleInstruction };
}
