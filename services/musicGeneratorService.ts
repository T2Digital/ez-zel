import { shadowDB } from './dbService';
import { useAppStore } from './store'; 

export class MusicGeneratorService {
    static async writeLyrics(prompt: string, singer: string = 'default', genre: string = 'pop'): Promise<string> {
        try {
            const res = await fetch('/api/services/generate-music', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: `اكتب كلمات أغنية تجارية أو هوية صوتية جذابة باللهجة المصرية الموزونة عن: ${prompt}. اللون: ${genre}، المؤدي: ${singer}`, mode: 'lyrics_only' })
            });
            const data = await res.json();
            if (data.lyrics) return data.lyrics;
            return `يا هلا بيك في عالمنا الجميل\nمعانا تلاقي الحل الأصيل\nخدمة وفخامة وجودة تدوم\nمعانا النجاح في كل يوم`;
        } catch {
            return `معانا تلاقي الحل الأكيد\nفي كل ثانية يوم جديد\nراحة وأمان وجودة عالية\nوأسعارنا في متناول الإيد`;
        }
    }

    static async generateMusic(
        prompt: string, 
        length: 'clip' | 'pro' | 'full' = 'clip', 
        singer: string = 'default',
        customLyrics?: string
    ): Promise<{ audioBase64?: string, mimeType?: string, lyrics?: string, error?: string }> {
        try {
            const res = await fetch('/api/services/generate-music', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt, length, singer, customLyrics })
            });
            const data = await res.json();
            if (data.success) {
                return { audioBase64: data.audioBase64, mimeType: data.mimeType, lyrics: data.lyrics || customLyrics };
            } else {
                return { error: data.error };
            }
        } catch (error: any) {
            console.error("MusicGen Error:", error);
            return { error: error.message };
        }
    }

    static async saveTrack(trackMetadata: { title: string, prompt: string, timestamp: number, lyrics?: string }, audioBase64: string): Promise<string> {
        const id = `music_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await shadowDB.saveAudioSegment(id, audioBase64);
        
        const trackRecord = {
            id,
            name: `${trackMetadata.title}.json`,
            type: 'audio' as const,
            l0_summary: `AI Generated track: ${trackMetadata.title}`,
            l1_metadata: JSON.stringify(trackMetadata),
            l2_content: trackMetadata.lyrics || '',
            createdAt: Date.now(),
            userId: useAppStore.getState().user?.email || 'GUEST',
            parentId: null
        };
        await shadowDB.saveFSItem(trackRecord);
        return id;
    }
}
