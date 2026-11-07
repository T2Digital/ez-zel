import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface SynthesizeOptions {
    text: string;
    voice?: string;
    rate?: string;
    pitch?: string;
    outputFormat?: string;
    strictNeural?: boolean;
}

/**
 * Synthesizes speech using node-edge-tts (Exact Tito Agent production engine).
 * 100% human studio Egyptian voice (ar-EG-ShakirNeural / ar-EG-SalmaNeural).
 * Pure Node.js, zero python dependency, zero 403 blocks.
 */
export async function synthesizeEdgeSpeech(options: SynthesizeOptions): Promise<Buffer> {
    const text = options.text || '';
    const voice = options.voice || 'ar-EG-ShakirNeural';

    const cleanText = text
        .replace(/[*_#\-`~>]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\{.*?\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleanText) {
        throw new Error("Empty text after sanitization");
    }

    const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tmpMp3Path = path.join(os.tmpdir(), `node_edge_${uniqueId}.mp3`);

    try {
        const tts = new EdgeTTS({
            voice: voice,
            outputFormat: options.outputFormat || 'audio-24khz-48kbitrate-mono-mp3'
        });

        await Promise.race([
            tts.ttsPromise(cleanText, tmpMp3Path),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TTS_TIMEOUT')), 12000))
        ]);

        if (fs.existsSync(tmpMp3Path)) {
            const buf = fs.readFileSync(tmpMp3Path);
            try { fs.unlinkSync(tmpMp3Path); } catch {}
            return buf;
        }

        throw new Error("Edge TTS generated audio file not found");
    } catch (err: any) {
        try { if (fs.existsSync(tmpMp3Path)) fs.unlinkSync(tmpMp3Path); } catch {}
        console.error("[node-edge-tts synthesis error]:", err?.message);
        throw err;
    }
}
