import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

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
 * Features dual-layer fallback: node-edge-tts (5s fast timeout) -> python edge-tts CLI.
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

    const trySynthesizeNode = async (voiceName: string): Promise<Buffer> => {
        const uniqueId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const tmpMp3Path = path.join(os.tmpdir(), `node_edge_${uniqueId}.mp3`);
        try {
            const tts = new EdgeTTS({
                voice: voiceName,
                outputFormat: options.outputFormat || 'audio-24khz-48kbitrate-mono-mp3',
                timeout: 5000
            });

            await Promise.race([
                tts.ttsPromise(cleanText, tmpMp3Path),
                new Promise((_, reject) => setTimeout(() => reject(new Error('TTS_TIMEOUT')), 5500))
            ]);

            if (fs.existsSync(tmpMp3Path)) {
                const buf = fs.readFileSync(tmpMp3Path);
                try { fs.unlinkSync(tmpMp3Path); } catch {}
                if (buf && buf.length > 200) {
                    return buf;
                }
            }
            throw new Error("Edge TTS generated audio file not found or empty");
        } catch (err: any) {
            try { if (fs.existsSync(tmpMp3Path)) fs.unlinkSync(tmpMp3Path); } catch {}
            throw err;
        }
    };

    const trySynthesizeCli = (voiceName: string): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            const tmpFile = path.join(os.tmpdir(), `cli_edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.mp3`);
            const runCmd = (cmd: string, args: string[]) => {
                const child = spawn(cmd, args);
                let stderr = '';
                child.stderr.on('data', d => stderr += d.toString());
                const timer = setTimeout(() => {
                    try { child.kill(); } catch {}
                    reject(new Error('CLI_TIMEOUT'));
                }, 6000);

                child.on('close', code => {
                    clearTimeout(timer);
                    if (code === 0 && fs.existsSync(tmpFile)) {
                        const buf = fs.readFileSync(tmpFile);
                        try { fs.unlinkSync(tmpFile); } catch {}
                        resolve(buf);
                    } else {
                        if (cmd === 'edge-tts') {
                            runCmd('python3', ['-m', 'edge_tts', '--voice', voiceName, '--text', cleanText, '--write-media', tmpFile]);
                        } else if (cmd === 'python3') {
                            runCmd('python', ['-m', 'edge_tts', '--voice', voiceName, '--text', cleanText, '--write-media', tmpFile]);
                        } else {
                            try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
                            reject(new Error(`CLI edge-tts failed: ${stderr || code}`));
                        }
                    }
                });

                child.on('error', () => {
                    clearTimeout(timer);
                    if (cmd === 'edge-tts') {
                        runCmd('python3', ['-m', 'edge_tts', '--voice', voiceName, '--text', cleanText, '--write-media', tmpFile]);
                    } else if (cmd === 'python3') {
                        runCmd('python', ['-m', 'edge_tts', '--voice', voiceName, '--text', cleanText, '--write-media', tmpFile]);
                    } else {
                        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
                        reject(new Error('CLI edge-tts command not found'));
                    }
                });
            };

            runCmd('edge-tts', ['--voice', voiceName, '--text', cleanText, '--write-media', tmpFile]);
        });
    };

    // 1. Try Primary Egyptian Voice via fast node-edge-tts
    try {
        return await trySynthesizeNode(voice);
    } catch {
        // 2. Try CLI fallback
        try {
            return await trySynthesizeCli(voice);
        } catch {
            // 3. Fallback to alternate Egyptian voice (Salma <-> Shakir)
            const altVoice = voice.includes('Salma') ? 'ar-EG-ShakirNeural' : 'ar-EG-SalmaNeural';
            try {
                return await trySynthesizeNode(altVoice);
            } catch (altErr: any) {
                return await trySynthesizeCli(altVoice);
            }
        }
    }
}
