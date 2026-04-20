export class WakeWordEngine {
    private recognition: any;
    private isListening: boolean = false;
    private onWakeWordDetected: () => void;
    private wakeWords = ['يا ظل', 'يا شادو', 'ظل', 'shadow'];

    constructor(onWakeWordDetected: () => void) {
        this.onWakeWordDetected = onWakeWordDetected;
        this.init();
    }

    private init() {
        if (!('webkitSpeechRecognition' in window)) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }

        // @ts-ignore
        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'ar-EG';

        this.recognition.onresult = (event: any) => {
            const lastResultIndex = event.results.length - 1;
            const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
            
            console.log("Wake Word Engine heard:", transcript);

            for (const word of this.wakeWords) {
                if (transcript.includes(word)) {
                    console.log("WAKE WORD DETECTED:", word);
                    this.stop(); // Stop continuous listening to allow main interaction
                    this.onWakeWordDetected();
                    break;
                }
            }
        };

        this.recognition.onerror = (event: any) => {
            console.warn("Wake Word Engine Error:", event.error);
            // Auto-restart on error unless it's not allowed
            if (event.error !== 'not-allowed' && this.isListening) {
                setTimeout(() => this.start(), 1000);
            }
        };

        this.recognition.onend = () => {
            // Keep it alive if it's supposed to be listening
            if (this.isListening) {
                this.recognition.start();
            }
        };
    }

    public start() {
        if (!this.recognition || this.isListening) return;
        this.isListening = true;
        try {
            this.recognition.start();
            console.log("Wake Word Engine Started.");
        } catch (e) {
            console.warn("Wake Word Engine start failed:", e);
        }
    }

    public stop() {
        if (!this.recognition || !this.isListening) return;
        this.isListening = false;
        try {
            this.recognition.stop();
            console.log("Wake Word Engine Stopped.");
        } catch (e) {}
    }
}
