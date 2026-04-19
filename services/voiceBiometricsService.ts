export class VoiceBiometrics {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private signature: number[] | null = null;

    constructor() {
        this.loadSignature();
    }

    private loadSignature() {
        const saved = localStorage.getItem('voice_signature');
        if (saved) {
            try {
                this.signature = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to parse voice signature", e);
            }
        }
    }

    public hasSignature(): boolean {
        return this.signature !== null;
    }

    public async enroll(stream: MediaStream, durationMs: number = 3000): Promise<boolean> {
        return new Promise((resolve) => {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const accumulatedData = new Float32Array(bufferLength);
            let frames = 0;

            const interval = setInterval(() => {
                this.analyser!.getByteFrequencyData(dataArray);
                for (let i = 0; i < bufferLength; i++) {
                    accumulatedData[i] += dataArray[i];
                }
                frames++;
            }, 50);

            setTimeout(() => {
                clearInterval(interval);
                // Average the data to create a frequency profile
                const signature = Array.from(accumulatedData).map(val => val / frames);
                this.signature = signature;
                localStorage.setItem('voice_signature', JSON.stringify(signature));
                
                source.disconnect();
                if (this.audioContext?.state !== 'closed') {
                    this.audioContext?.close();
                }
                resolve(true);
            }, durationMs);
        });
    }

    public async verify(stream: MediaStream, durationMs: number = 2000): Promise<number> {
        if (!this.signature) return 1; // If no signature is set, allow by default

        return new Promise((resolve) => {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            const accumulatedData = new Float32Array(bufferLength);
            let frames = 0;

            const interval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);
                for (let i = 0; i < bufferLength; i++) {
                    accumulatedData[i] += dataArray[i];
                }
                frames++;
            }, 50);

            setTimeout(() => {
                clearInterval(interval);
                const currentSignature = Array.from(accumulatedData).map(val => val / frames);
                
                // Calculate Cosine Similarity between enrolled signature and current signature
                const similarity = this.cosineSimilarity(this.signature!, currentSignature);
                
                source.disconnect();
                if (ctx.state !== 'closed') {
                    ctx.close();
                }
                resolve(similarity);
            }, durationMs);
        });
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    
    public clearSignature() {
        this.signature = null;
        localStorage.removeItem('voice_signature');
    }
}

export const voiceBiometrics = new VoiceBiometrics();
