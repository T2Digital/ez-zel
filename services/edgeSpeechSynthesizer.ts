import WebSocket from 'ws';
import crypto from 'crypto';

export interface SynthesizeOptions {
    text: string;
    voice?: string;
    rate?: string; // e.g. "+0%" or "+10%" or "+20%"
    pitch?: string; // e.g. "+0Hz"
    outputFormat?: string; // e.g. "raw-24khz-16bit-mono-pcm" or "audio-24khz-96kbps-mp3"
}

/**
 * Synthesizes speech using the Microsoft Edge TTS WebSocket service.
 * Returns a Promise that resolves to a Buffer containing the audio data.
 */
export function synthesizeEdgeSpeech(options: SynthesizeOptions): Promise<Buffer> {
    const text = options.text;
    const voice = options.voice || 'ar-EG-ShakirNeural';
    const rate = options.rate || '+0%';
    const pitch = options.pitch || '+0Hz';
    const format = options.outputFormat || 'raw-24khz-16bit-mono-pcm';

    return new Promise((resolve, reject) => {
        const requestId = crypto.randomUUID().replace(/-/g, '');
        const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/3ped/v1?TrustedClientToken=6A5AA1D4EAFF4E9B87E7D3D61D95D31D`;
        
        const headers = {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.34',
            'Origin': 'chrome-extension://jdiccldmhcocfhbflbcoocgdocdgkoap'
        };

        const ws = new WebSocket(wsUrl, { headers });
        const audioChunks: Buffer[] = [];
        let timer: NodeJS.Timeout;

        const cleanup = () => {
            clearTimeout(timer);
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };

        // Set safety timeout of 15 seconds
        timer = setTimeout(() => {
            cleanup();
            reject(new Error("Edge TTS request timed out"));
        }, 15000);

        ws.on('open', () => {
            // Send config message to setup Edge TTS format
            const configPayload = JSON.stringify({
                context: {
                    system: {
                        name: "Edge",
                        version: "112.0.1722.34",
                        build: "3ped",
                        lang: "ar-EG"
                    }
                },
                audio: {
                    outputFormat: format
                }
            });

            const configMsg = `X-Timestamp:${new Date().toISOString()}\r\n` +
                              `Content-Type:application/json; charset=utf-8\r\n` +
                              `Path:speech.config\r\n\r\n` +
                              configPayload;

            ws.send(configMsg, (err) => {
                if (err) {
                    cleanup();
                    return reject(err);
                }

                // Send SSML payload with voice, rate, and pitch settings
                const ssmlPayload = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ar-EG'>` +
                                    `<voice name='${voice}'>` +
                                    `<rate speed='${rate}' pitch='${pitch}'>${text}</rate>` +
                                    `</voice>` +
                                    `</speak>`;

                const ssmlMsg = `X-RequestId:${requestId}\r\n` +
                                `Content-Type:application/ssml+xml\r\n` +
                                `Path:ssml\r\n\r\n` +
                                ssmlPayload;

                ws.send(ssmlMsg, (ssmlErr) => {
                    if (ssmlErr) {
                        cleanup();
                        return reject(ssmlErr);
                    }
                });
            });
        });

        ws.on('message', (data: WebSocket.Data, isBinary: boolean) => {
            if (isBinary) {
                const buffer = data as Buffer;
                if (buffer.length < 2) return;
                
                // Parse 2-byte header length
                const headerLen = buffer.readUInt16BE(0);
                if (buffer.length < 2 + headerLen) return;

                const header = buffer.toString('utf8', 2, 2 + headerLen);
                if (header.includes('Path:audio')) {
                    // Extract raw audio data
                    const audioChunk = buffer.subarray(2 + headerLen);
                    audioChunks.push(audioChunk);
                }
            } else {
                const textMessage = data.toString();
                if (textMessage.includes('Path:turn.end')) {
                    cleanup();
                    resolve(Buffer.concat(audioChunks));
                }
            }
        });

        ws.on('error', (err) => {
            cleanup();
            reject(err);
        });

        ws.on('close', () => {
            cleanup();
            if (audioChunks.length > 0) {
                resolve(Buffer.concat(audioChunks));
            } else {
                reject(new Error("Edge TTS connection closed without audio data"));
            }
        });
    });
}
