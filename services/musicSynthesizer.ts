/**
 * High-Fidelity Procedural Audio Synthesizer for "The Shadow" (الظل)
 * Generates custom 16-bit 44100Hz Mono PCM WAV tracks representing various genres.
 * Implements section-based structures, delay/echo effects, lush pads, and an Auto-Tuned vocal vocoder.
 */

function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 302473474, h3 = 3362453611, h4 = 502492259;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function sfc32(a: number, b: number, c: number, d: number) {
    return function() {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        let t = (a + b) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        d = (d + 1) | 0;
        t = (t + d) | 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    }
}

function resamplePCM16(
    inputBuffer: Buffer,
    fromRate: number,
    toRate: number
): Buffer {
    const numInputSamples = inputBuffer.length / 2;
    const ratio = toRate / fromRate;
    const numOutputSamples = Math.floor(numInputSamples * ratio);
    const outputBuffer = Buffer.alloc(numOutputSamples * 2);

    for (let i = 0; i < numOutputSamples; i++) {
        const inputIndex = i / ratio;
        const indexFloor = Math.floor(inputIndex);
        const indexCeil = Math.min(numInputSamples - 1, indexFloor + 1);
        const weight = inputIndex - indexFloor;

        if (indexFloor * 2 + 1 >= inputBuffer.length) break;

        const sampleFloor = inputBuffer.readInt16LE(indexFloor * 2);
        const sampleCeil = inputBuffer.readInt16LE(indexCeil * 2);

        // Linear interpolation
        const interpolatedSample = sampleFloor + (sampleCeil - sampleFloor) * weight;
        
        outputBuffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.floor(interpolatedSample))), i * 2);
    }

    return outputBuffer;
}

function detectPitch(buffer: Buffer, startIdx: number, sampleRate: number): number {
    const windowSize = 512;
    if (startIdx < 0 || startIdx + windowSize * 2 >= buffer.length) return 0;
    
    const samples = new Float32Array(windowSize);
    let isSilent = true;
    for (let i = 0; i < windowSize; i++) {
        const val = buffer.readInt16LE(startIdx + i * 2) / 32768;
        samples[i] = val;
        if (Math.abs(val) > 0.02) {
            isSilent = false;
        }
    }
    
    if (isSilent) return 0;
    
    let bestLag = -1;
    let bestR = -Infinity;
    
    const minLag = Math.floor(sampleRate / 600);
    const maxLag = Math.floor(sampleRate / 80);
    
    for (let lag = minLag; lag <= maxLag; lag++) {
        let r = 0;
        for (let i = 0; i < windowSize - lag; i++) {
            r += samples[i] * samples[i + lag];
        }
        if (r > bestR) {
            bestR = r;
            bestLag = lag;
        }
    }
    
    if (bestLag > 0) {
        return sampleRate / bestLag;
    }
    return 0;
}

function getClosestScaleNote(detectedFreq: number, scale: number[]): number {
    if (detectedFreq <= 0) return scale[0];
    let closest = scale[0];
    let minDiff = Math.abs(detectedFreq - scale[0]);
    
    const octaves = [0.25, 0.5, 1.0, 2.0, 4.0];
    for (const oct of octaves) {
        for (const freq of scale) {
            const targetFreq = freq * oct;
            const diff = Math.abs(detectedFreq - targetFreq);
            if (diff < minDiff) {
                minDiff = diff;
                closest = targetFreq;
            }
        }
    }
    return closest;
}

export function synthesizeTrack(
    genre: 'shaabi' | 'cyberpunk' | 'pop' | 'hiphop' | 'rock' | 'ambient', 
    durationSeconds: number = 40,
    seedText: string = "",
    vocalPcmBuffer?: Buffer
): Buffer {
    const sampleRate = 44100; // Standard 44100Hz CD quality for perfect pitch & speed in browsers
    const numSamples = sampleRate * durationSeconds;
    const audioBuffer = Buffer.alloc(numSamples * 2); // 16-bit PCM = 2 bytes per sample

    // Initialize pseudo-random generator seeded by seedText or random value
    const seed = cyrb128(seedText || Math.random().toString());
    const rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

    // Music scales (frequencies in Hz)
    // Shaabi / Egyptian (Hijaz-like scale: D, Eb, F#, G, A, Bb, C)
    const hijazScale = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25];
    // Cyberpunk / Techno (Minor scale: A, B, C, D, E, F, G)
    const technoScale = [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00];
    // Pop (Major scale: C, D, E, F, G, A, B)
    const popScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
    // Hiphop / Rap (Dark Minor scale)
    const hiphopScale = [73.42, 82.41, 87.31, 98.00, 110.00, 116.54, 130.81];
    // Rock / Metal (Pentatonic Minor)
    const rockScale = [146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
    // Ambient / Cinematic (Soft pentatonic)
    const ambientScale = [220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88];

    let scale = popScale;
    let baseBpm = 120;
    
    if (genre === 'shaabi') {
        scale = hijazScale;
        baseBpm = 128;
    } else if (genre === 'cyberpunk') {
        scale = technoScale;
        baseBpm = 135;
    } else if (genre === 'hiphop') {
        scale = hiphopScale;
        baseBpm = 90;
    } else if (genre === 'rock') {
        scale = rockScale;
        baseBpm = 120;
    } else if (genre === 'ambient') {
        scale = ambientScale;
        baseBpm = 75;
    }

    // Vary the BPM slightly based on seed to make it organic and different (+/- 8 bpm)
    const bpm = baseBpm + Math.floor(rand() * 16) - 8;

    const beatsPerSecond = bpm / 60;
    const samplesPerBeat = Math.floor(sampleRate / beatsPerSecond);
    const samplesPerStep = Math.floor(samplesPerBeat / 4); // 16th notes

    // Delay line setup for lead melody and vocals
    const delaySamples = Math.floor(sampleRate * (0.25 + rand() * 0.2)); // varied delay length (250ms - 450ms)
    const delayBuffer = new Float32Array(delaySamples);
    let delayIndex = 0;
    const delayFeedback = 0.35 + rand() * 0.15; // 0.35 - 0.50
    const delayWet = 0.30 + rand() * 0.10; // 0.30 - 0.40

    // Generate a unique 16-step vocal melody sequence based on the seed
    const vocalMelody: number[] = [];
    let currentVocalNote = 0;
    for (let steps = 0; steps < 16; steps++) {
        const change = Math.floor(rand() * 3) - 1; // -1, 0, or 1
        currentVocalNote = currentVocalNote + change;
        if (currentVocalNote < 0) currentVocalNote = 1;
        if (currentVocalNote >= scale.length) currentVocalNote = scale.length - 2;
        vocalMelody.push(currentVocalNote);
    }

    // Generate a unique lead melody sequence based on the seed
    const leadMelodySeq: number[] = [];
    for (let steps = 0; steps < 16; steps++) {
        leadMelodySeq.push(Math.floor(rand() * scale.length));
    }

    // Seed-based Chord progression choices
    const chordProgressions = [
        [0, 3, 5, 4], // I - IV - VI - V
        [0, 4, 5, 3], // I - V - VI - IV
        [5, 3, 0, 4], // VI - IV - I - V
        [0, 3, 0, 4], // I - IV - I - V
        [0, 2, 3, 4]  // I - III - IV - V
    ];
    const bassRoots = chordProgressions[Math.floor(rand() * chordProgressions.length)];

    // Seed-based vocal parameters
    const vibratoFreq = 5.6 + rand() * 1.6; // 5.6Hz - 7.2Hz organic human vibrato range
    const vibratoDepth = 0.012 + rand() * 0.01; // 1.2% - 2.2% pitch modulation depth
    const formantSpeed = 0.45 + rand() * 0.3; // Speed of vowel sound sweeps

    // Pre-resample vocals for high-fidelity sample-accurate vocoding & autotuning
    let resampledVocals: Buffer | null = null;
    if (vocalPcmBuffer && vocalPcmBuffer.length > 0) {
        try {
            console.log(`[SYNTHESIZER] Pre-resampling ${vocalPcmBuffer.length} bytes of raw vocal PCM...`);
            resampledVocals = resamplePCM16(vocalPcmBuffer, 24000, 44100);
            console.log(`[SYNTHESIZER] Pre-resampling complete. Resampled buffer length: ${resampledVocals.length} bytes.`);
        } catch (err: any) {
            console.error("[SYNTHESIZER] Failed to pre-resample vocals:", err.message);
        }
    }

    let vocalEnvFollower = 0;
    let prevVoiceSample = 0;
    let vocalPlayhead = 0;
    let smoothedShiftRatio = 1.0;
    let detectedPitchVal = 0;
    let pitchCheckCounter = 0;
    const startOffsetSamples = Math.floor(5 * sampleRate); // 5 seconds intro

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const currentBeat = Math.floor(i / samplesPerBeat);
        const currentStep = Math.floor(i / samplesPerStep);
        const stepInMeasure = currentStep % 16;
        const sampleInStep = i % samplesPerStep;

        // Dynamic arrangement based on song sections
        // Section boundaries (out of 40s total)
        let isIntro = t < 5.0;
        let isVerse1 = t >= 5.0 && t < 15.0;
        let isChorus = t >= 15.0 && t < 28.0;
        let isVerse2 = t >= 28.0 && t < 35.0;
        let isOutro = t >= 35.0;

        let val = 0;

        // --- 1. DRUMS / PERCUSSION ---
        let drumSample = 0;
        if (!isIntro && !isOutro) {
            // Kick Drum
            let isKick = false;
            if (genre === 'shaabi') {
                // Shaabi Maqsum rhythm: Dum (0), Tak (4), Tak (10), Dum (12), Tak (14)
                isKick = (stepInMeasure === 0 || stepInMeasure === 8 || stepInMeasure === 12);
            } else if (genre === 'hiphop') {
                isKick = (stepInMeasure === 0 || stepInMeasure === 9 || stepInMeasure === 11);
            } else {
                // Four-on-the-floor
                isKick = (stepInMeasure % 4 === 0);
            }

            // Simplify drums on Verse 2 breakdown
            if (isVerse2 && stepInMeasure % 8 !== 0) {
                isKick = false;
            }

            if (isKick) {
                const kickT = sampleInStep / sampleRate;
                const kickFreq = (genre === 'hiphop' ? 130 : 160) * Math.exp(-65 * kickT);
                if (kickFreq > 30) {
                    drumSample += Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-20 * kickT) * 0.48;
                }
            }

            // Snare / Clap / Tak
            let isSnare = false;
            if (genre === 'shaabi') {
                isSnare = (stepInMeasure === 4 || stepInMeasure === 10 || stepInMeasure === 14);
            } else {
                isSnare = (stepInMeasure === 4 || stepInMeasure === 12);
            }

            if (isSnare && !isVerse2) {
                const snareT = sampleInStep / sampleRate;
                // High frequency metallic "Tak" sound
                const noise = (Math.sin(i * 15.6789) % 1);
                const snareTone = Math.sin(2 * Math.PI * 320 * snareT) * Math.exp(-40 * snareT);
                drumSample += (snareTone * 0.22 + noise * Math.exp(-32 * snareT) * 0.16) * 0.85;
            }

            // Hi-hats
            const isHat = (stepInMeasure % 2 === 1);
            if (isHat && !isVerse2) {
                const hatT = sampleInStep / sampleRate;
                const noise = (Math.sin(i * 123.4567) % 1);
                drumSample += noise * Math.exp(-110 * hatT) * 0.04;
            }

            // Traditional Darbuka (Tablah) Rolls & Stutters for Shaabi/Mahraganat
            if (genre === 'shaabi' && !isVerse2) {
                const isRollStep = (stepInMeasure === 6 || stepInMeasure === 7 || stepInMeasure === 14 || stepInMeasure === 15);
                if (isRollStep) {
                    // Quick triplets inside the 16th step (rolling snare & rim tone)
                    const subStep = Math.floor((i % samplesPerStep) / (samplesPerStep / 3));
                    const rollT = (i % (samplesPerStep / 3)) / sampleRate;
                    const slapNoise = (Math.sin(i * 88.1234) % 1) * Math.exp(-110 * rollT) * 0.12;
                    const rimTone = Math.sin(2 * Math.PI * 450 * rollT) * Math.exp(-80 * rollT) * 0.14;
                    drumSample += (slapNoise + rimTone) * 0.55;
                }
            }
        } else if (isOutro) {
            // Outro fading kick on beat 1
            if (stepInMeasure === 0 && t < 38.0) {
                const kickT = sampleInStep / sampleRate;
                const kickFreq = 150 * Math.exp(-70 * kickT);
                drumSample += Math.sin(2 * Math.PI * kickFreq * kickT) * Math.exp(-22 * kickT) * 0.3 * (1 - (t - 35) / 5);
            }
        }

        // --- 2. LUSH BACKGROUND CHORDS (PADS) ---
        // Basic chord progression changing every 4 beats
        const chordIndex = Math.floor(currentBeat / 4) % 4;
        const rootNoteIdx = bassRoots[chordIndex] % scale.length;
        
        const rootFreq = scale[rootNoteIdx];
        const thirdFreq = scale[(rootNoteIdx + 2) % scale.length];
        const fifthFreq = scale[(rootNoteIdx + 4) % scale.length];

        let chordSample = 0;
        if (genre !== 'hiphop') {
            const pad1 = Math.sin(2 * Math.PI * (rootFreq / 2) * t);
            const pad2 = Math.sin(2 * Math.PI * (thirdFreq / 2) * t);
            const pad3 = Math.sin(2 * Math.PI * (fifthFreq / 2) * t);
            
            chordSample = (pad1 + pad2 + pad3) / 3 * 0.12;
            
            // Apply volume fade-in/fade-out
            if (isIntro) chordSample *= (t / 5.0);
            if (isOutro) chordSample *= (1 - (t - 35) / 5);
        }

        // --- 3. BASSLINE ---
        let bassSample = 0;
        if (!isIntro) {
            const bassFreq = scale[rootNoteIdx] / 4; // 2 octaves down
            const bassEnv = Math.exp(-(genre === 'cyberpunk' ? 3 : 5) * (sampleInStep / samplesPerStep));
            
            // Sub-bass glide effect (portamento) towards next chord root
            const nextRootIdx = bassRoots[(chordIndex + 1) % 4] % scale.length;
            const nextBassFreq = scale[nextRootIdx] / 4;
            const stepRatio = sampleInStep / samplesPerStep;
            
            // Slide frequency smoothly in the last 25% of the step
            const slideFreq = stepRatio > 0.75 
                ? bassFreq + (nextBassFreq - bassFreq) * ((stepRatio - 0.75) / 0.25)
                : bassFreq;

            const bassPhase = (t * slideFreq) % 1;
            // Rounded triangle wave with soft clipping for rich sub-bass
            const triVal = bassPhase < 0.5 ? (4 * bassPhase - 1) : (3 - 4 * bassPhase);
            const softDistortedBass = Math.tanh(triVal * 2.2);
            bassSample = softDistortedBass * bassEnv * 0.22;
            
            if (isVerse2) bassSample *= 0.5; // duck during breakdown
            if (isOutro) bassSample *= (1 - (t - 35) / 5);
        }

        // --- 4. LEAD MELODY ---
        let leadSample = 0;
        if (!isVerse2) {
            const noteIdxInMeasure = leadMelodySeq[stepInMeasure % 16];
            const noteFreq = scale[(rootNoteIdx + noteIdxInMeasure) % scale.length];
            const melodyEnv = Math.exp(-5 * (sampleInStep / samplesPerStep));

            if (genre === 'ambient') {
                leadSample = Math.sin(2 * Math.PI * noteFreq * t) * melodyEnv * 0.12;
            } else if (genre === 'rock') {
                // High distortion simulation
                const melodyPhase = (t * noteFreq) % 1;
                const sqVal = melodyPhase < 0.5 ? 1 : -1;
                leadSample = sqVal * melodyEnv * 0.08;
            } else if (genre === 'shaabi') {
                // Brassy nasal Zurna/Mizmar lead with Egyptian micro-pitch sliding and trills
                const zurnaVibrato = 1 + 0.04 * Math.sin(2 * Math.PI * (8.0 + rand() * 2) * t);
                // Quick ornamentations (microtonal trills) at step starts
                let trillFreq = noteFreq;
                if (sampleInStep < sampleRate * 0.08) {
                    // Trill up by a half-step or fifth for traditional Zurna flutter
                    trillFreq = noteFreq * 1.06; 
                }
                const zurnaPhase = (t * trillFreq * zurnaVibrato) % 1;
                // Nasal wave: combine high harmonics
                const saw1 = 2 * zurnaPhase - 1;
                const saw2 = 2 * ((t * trillFreq * 2 * zurnaVibrato) % 1) - 1;
                leadSample = (saw1 * 0.6 + saw2 * 0.4) * melodyEnv * 0.12;
            } else {
                // Techno/Cyberpunk/Pop square melody
                const melodyPhase = (t * noteFreq) % 1;
                const sqVal = melodyPhase < 0.5 ? 0.7 : -0.7;
                leadSample = sqVal * melodyEnv * 0.05;
            }

            // Double volume/richness on chorus
            if (isChorus) leadSample *= 1.35;
            if (isOutro) leadSample *= (1 - (t - 35) / 5);
        }

        // --- 5. AUTO-TUNED SINGING VOCODER (VOCALIST) ---
        let vocalSample = 0;
        if (!isIntro) {
            // Get current and previous vocal note indices
            const currentVocalNoteIdx = vocalMelody[stepInMeasure % 16];
            const prevVocalNoteIdx = vocalMelody[(stepInMeasure - 1 + 16) % 16];

            const currentVocalFreq = scale[(rootNoteIdx + currentVocalNoteIdx) % scale.length];
            const prevVocalFreq = scale[(rootNoteIdx + prevVocalNoteIdx) % scale.length];

            // Auto-Tune sliding/snapping portamento
            const stepRatio = sampleInStep / samplesPerStep;
            let vocalFreq = currentVocalFreq;
            if (stepRatio < 0.15) { // Pitch slide first 15% of the note
                const t_slide = stepRatio / 0.15;
                vocalFreq = prevVocalFreq + (currentVocalFreq - prevVocalFreq) * t_slide;
            }

            // Singing vibrato
            const vocalVibrato = 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoFreq * t);
            const finalVocalFreq = vocalFreq * vocalVibrato;

            // Formant singing carrier wave (Sawtooth & pulse width modulation)
            const vc1 = Math.sin(2 * Math.PI * finalVocalFreq * t);
            const vc2 = Math.sin(2 * Math.PI * finalVocalFreq * 2 * t) * 0.45;
            const vc3 = Math.sin(2 * Math.PI * finalVocalFreq * 3 * t) * 0.25;
            const vc4 = Math.sin(2 * Math.PI * finalVocalFreq * 4 * t) * 0.10;
            let vocalCarrier = vc1 + vc2 + vc3 + vc4;

            // Vocal Formant sweep to simulate changing human vowels ("Ah", "Oh", "Eh")
            const vowelCycle = (t * formantSpeed) % 3;
            let formantResonance = 1.0;
            if (vowelCycle < 1.0) { // "Aaa" Formant resonance (750 Hz & 1200 Hz)
                formantResonance = 0.75 + 0.25 * Math.sin(2 * Math.PI * 750 * t) + 0.15 * Math.sin(2 * Math.PI * 1200 * t);
            } else if (vowelCycle < 2.0) { // "Eee" Formant resonance (300 Hz & 2200 Hz)
                formantResonance = 0.75 + 0.25 * Math.sin(2 * Math.PI * 300 * t) + 0.20 * Math.sin(2 * Math.PI * 2200 * t);
            } else { // "Ooo" Formant resonance (400 Hz & 800 Hz)
                formantResonance = 0.75 + 0.25 * Math.sin(2 * Math.PI * 400 * t) + 0.15 * Math.sin(2 * Math.PI * 800 * t);
            }
            vocalCarrier *= formantResonance;

            // Consonants (inject burst of rhythmic white noise at note starts to mimic syllables "D", "T", "S")
            let vocalConsonant = 0;
            if (sampleInStep < sampleRate * 0.035) { // First 35ms of the step
                const consonantEnv = Math.exp(-110 * (sampleInStep / sampleRate));
                const whiteNoise = (Math.sin(i * 1.5432) % 1);
                vocalConsonant = whiteNoise * consonantEnv * 0.15;
            }

            // Real-time vocoding / autotuning sample processing
            if (resampledVocals && i >= startOffsetSamples) {
                // Periodically update pitch detection (every 256 samples to keep it high performance)
                pitchCheckCounter++;
                if (pitchCheckCounter >= 256) {
                    pitchCheckCounter = 0;
                    const byteIdx = Math.floor(vocalPlayhead) * 2;
                    detectedPitchVal = detectPitch(resampledVocals, byteIdx, sampleRate);
                }

                let targetPitchFreq = finalVocalFreq;
                if (detectedPitchVal > 0) {
                    // Snap the detected pitch to the nearest active musical scale frequency
                    targetPitchFreq = getClosestScaleNote(detectedPitchVal, scale);
                }

                // Calculate the instantaneous pitch-shifter ratio
                const pitchShiftRatio = (detectedPitchVal > 0 && targetPitchFreq > 0) 
                    ? targetPitchFreq / detectedPitchVal 
                    : 1.0;

                // Smooth the ratio to eliminate any clicks or phase cancellations
                smoothedShiftRatio = smoothedShiftRatio * 0.94 + pitchShiftRatio * 0.06;

                // Clamp shift ratio to realistic bounds (0.4x to 2.5x pitch shift) to avoid extreme artifacts
                smoothedShiftRatio = Math.max(0.4, Math.min(2.5, smoothedShiftRatio));

                // Read vocal samples with linear interpolation around vocalPlayhead
                const readIdx = Math.floor(vocalPlayhead);
                const frac = vocalPlayhead - readIdx;
                let voiceSampleVal = 0;

                if (readIdx * 2 + 1 < resampledVocals.length) {
                    const s1 = resampledVocals.readInt16LE(readIdx * 2) / 32767;
                    const s2 = (readIdx * 2 + 3 < resampledVocals.length) 
                        ? resampledVocals.readInt16LE(readIdx * 2 + 2) / 32767 
                        : s1;
                    voiceSampleVal = s1 + (s2 - s1) * frac;
                }

                // Envelope follower for dynamics
                vocalEnvFollower = vocalEnvFollower * 0.998 + Math.abs(voiceSampleVal) * 0.002;

                // Advance playhead by the pitch-shift ratio
                vocalPlayhead += smoothedShiftRatio;

                // PLL (Phase Locked Loop) synchronization to prevent drift and lock vocal timing with tempo
                const targetPlayhead = i - startOffsetSamples;
                const drift = vocalPlayhead - targetPlayhead;
                if (Math.abs(drift) > 1000) {
                    // Gently sync playhead back to target
                    vocalPlayhead = vocalPlayhead * 0.95 + targetPlayhead * 0.05;
                }

                // High-fidelity Auto-Tune vocal production (blend of tuned vocal and formant richness)
                // 1. High frequency presence enhancement (crispy treble presence)
                const highPassPresence = (voiceSampleVal - prevVoiceSample) * 0.18;
                prevVoiceSample = voiceSampleVal;

                // 2. Class-A tube saturation and compression (full and warm like Essam Sasa studio quality)
                const autoTunedVocal = Math.tanh(voiceSampleVal * 2.2) * 0.82 + highPassPresence;

                // 3. Modulate with the synthetic carrier slightly (18%) for extreme modern autotune/vocoder sheen
                const sheenModulation = vocalCarrier * vocalEnvFollower * 0.18;

                vocalSample = (autoTunedVocal + sheenModulation) * 1.55;
            } else {
                // Backing vocal / melodic background chant if no human audio is active
                const vocalEnv = Math.exp(-4 * (sampleInStep / samplesPerStep)); // smoother vocal envelope
                vocalSample = (vocalCarrier * vocalEnv + vocalConsonant) * 0.12;
            }

            // Sectional dynamics for vocals
            if (isChorus) {
                // Double voice / stereo-octave harmony during chorus
                const harmonyFreq = finalVocalFreq * 1.5; // fifth harmony
                const harmonyCarrier = Math.sin(2 * Math.PI * harmonyFreq * t) + Math.sin(2 * Math.PI * harmonyFreq * 2 * t) * 0.3;
                vocalSample += harmonyCarrier * 0.08;
            }
            
            if (isVerse2) {
                vocalSample *= 0.8; // soft vocal chant in breakdown
            }
            if (isOutro) {
                vocalSample *= (1 - (t - 35) / 5);
            }
        }

        // --- 6. DELAY / ECHO EFFECT PIPELINE ---
        // Combine dry lead and vocal signals
        const dryProcessedSignals = leadSample * 0.28 + vocalSample * 0.36;

        // Fetch echo from delay line
        const echoSample = delayBuffer[delayIndex];

        // Write new signal + echo feedback back to delay buffer
        delayBuffer[delayIndex] = dryProcessedSignals + echoSample * delayFeedback;

        // Increment delay buffer head index
        delayIndex = (delayIndex + 1) % delaySamples;

        // Final wet mix
        const wetSignalMix = dryProcessedSignals + echoSample * delayWet;

        // --- 7. MASTER CLIPPING GUARD & MIX ---
        let masterSample = drumSample + chordSample + bassSample + wetSignalMix;

        // Soft clipper to prevent harsh distortion
        masterSample = Math.max(-0.95, Math.min(0.95, masterSample));

        // Write as signed 16-bit PCM short
        const pcmValue = Math.floor(masterSample * 32767);
        audioBuffer.writeInt16LE(pcmValue, i * 2);
    }

    // No post-loop dry mixing needed since the vocals are vocoded sample-accurately inside the main loop above.

    // Standard WAV Header
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + audioBuffer.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(1, 22); // Mono
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * 2, 28);
    header.writeUInt16LE(2, 32); // BlockAlign
    header.writeUInt16LE(16, 34); // BitsPerSample
    header.write("data", 36);
    header.writeUInt32LE(audioBuffer.length, 40);

    return Buffer.concat([header, audioBuffer]);
}
