import { Track } from '../types';

// Scale frequencies in Hz
const SCALES: Record<string, number[]> = {
  // Egyptian Shaabi / Rast (C Rast: C, D, E half flat / Eb, F, G, A, Bb, C)
  shaabi: [261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25],
  // Hijaz (C, Db, E, F, G, Ab, Bb, C)
  hijaz: [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 466.16, 523.25],
  // Kurd (C, Db, Eb, F, G, Ab, Bb, C)
  kurd: [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
  // Minor Pop / Melodic (A minor / C major: C, D, Eb, F, G, Ab, Bb, C)
  pop: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
  // Trap / HipHop Minor
  trap: [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08, 261.63],
  // Rock Pentatonic
  rock: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00]
};

// Generate AudioBuffer using Web Audio OfflineAudioContext
export async function synthesizeProceduralTrack(
  genre: string,
  bpm: number = 120,
  durationSeconds: number = 24,
  includeVocals: boolean = true
): Promise<{ audioUrl: string; duration: number }> {
  const sampleRate = 44100;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  const secondsPerBeat = 60 / bpm;
  const totalBeats = Math.floor(durationSeconds / secondsPerBeat);

  const scaleKey = genre.toLowerCase().includes('shaabi') || genre.toLowerCase().includes('شعبي') ? 'shaabi'
    : genre.toLowerCase().includes('hijaz') || genre.toLowerCase().includes('حجاز') ? 'hijaz'
    : genre.toLowerCase().includes('trap') || genre.toLowerCase().includes('راب') ? 'trap'
    : genre.toLowerCase().includes('rock') || genre.toLowerCase().includes('روك') ? 'rock'
    : 'pop';

  const scale = SCALES[scaleKey] || SCALES.pop;

  // Master Gain & Reverb Filter
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  masterGain.connect(offlineCtx.destination);

  // 1. Bass & 808 Sub Kick
  for (let beat = 0; beat < totalBeats; beat++) {
    const time = beat * secondsPerBeat;
    if (time >= durationSeconds - 0.5) break;

    // Kick Drum (on beats 0, 2 or syncopated for shaabi)
    const isKick = (genre === 'shaabi' || genre === 'شعبي')
      ? (beat % 4 === 0 || beat % 4 === 3)
      : (beat % 2 === 0);

    if (isKick) {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.35);
    }

    // Snare / Clap / Oriental Snare
    const isSnare = (beat % 2 === 1);
    if (isSnare) {
      // Noise Burst Snare
      const bufferSize = sampleRate * 0.15;
      const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = offlineCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.6, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      whiteNoise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(masterGain);

      whiteNoise.start(time);
      whiteNoise.stop(time + 0.2);
    }

    // Hi-Hats (16th notes / 8th notes)
    for (let sub = 0; sub < 4; sub++) {
      const hatTime = time + (sub * secondsPerBeat) / 4;
      if (hatTime >= durationSeconds - 0.2) break;

      const hatNoise = offlineCtx.createBuffer(1, Math.floor(sampleRate * 0.04), sampleRate);
      const data = hatNoise.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const hatSource = offlineCtx.createBufferSource();
      hatSource.buffer = hatNoise;

      const hatFilter = offlineCtx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.value = 6500;

      const hatGain = offlineCtx.createGain();
      hatGain.gain.setValueAtTime(sub % 2 === 0 ? 0.25 : 0.15, hatTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.04);

      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(masterGain);

      hatSource.start(hatTime);
      hatSource.stop(hatTime + 0.05);
    }
  }

  // 2. Chords & Bass Harmony
  for (let bar = 0; bar < Math.floor(totalBeats / 4); bar++) {
    const barTime = bar * 4 * secondsPerBeat;
    if (barTime >= durationSeconds - 1) break;

    const rootFreq = scale[bar % scale.length];
    const thirdFreq = scale[(bar + 2) % scale.length];
    const fifthFreq = scale[(bar + 4) % scale.length];

    [rootFreq, thirdFreq, fifthFreq].forEach((freq, idx) => {
      const chordOsc = offlineCtx.createOscillator();
      const chordGain = offlineCtx.createGain();

      chordOsc.type = idx === 0 ? 'sawtooth' : 'triangle';
      chordOsc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), barTime);

      chordGain.gain.setValueAtTime(0.001, barTime);
      chordGain.gain.linearRampToValueAtTime(0.18, barTime + 0.2);
      chordGain.gain.setValueAtTime(0.15, barTime + (4 * secondsPerBeat) - 0.4);
      chordGain.gain.exponentialRampToValueAtTime(0.001, barTime + (4 * secondsPerBeat));

      chordOsc.connect(chordGain);
      chordGain.connect(masterGain);

      chordOsc.start(barTime);
      chordOsc.stop(barTime + 4 * secondsPerBeat);
    });
  }

  // 3. Melodic Lead / Vocoder Synth Lines
  for (let beat = 0; beat < totalBeats; beat++) {
    const leadTime = beat * secondsPerBeat;
    if (leadTime >= durationSeconds - 0.5) break;

    const noteIdx = (beat * 3 + Math.floor(beat / 2)) % scale.length;
    const noteFreq = scale[noteIdx] * (includeVocals ? 2 : 1.5);

    const leadOsc = offlineCtx.createOscillator();
    const leadGain = offlineCtx.createGain();

    leadOsc.type = includeVocals ? 'sawtooth' : 'sine';
    leadOsc.frequency.setValueAtTime(noteFreq, leadTime);
    // pitch bend / portamento
    leadOsc.frequency.exponentialRampToValueAtTime(noteFreq * 1.01, leadTime + 0.08);

    // Formant filter to simulate voice/vocal tract
    const formantFilter = offlineCtx.createBiquadFilter();
    formantFilter.type = 'bandpass';
    formantFilter.frequency.setValueAtTime(800 + (noteIdx * 150), leadTime);
    formantFilter.Q.value = 4.0;

    leadGain.gain.setValueAtTime(0.001, leadTime);
    leadGain.gain.linearRampToValueAtTime(0.22, leadTime + 0.05);
    leadGain.gain.exponentialRampToValueAtTime(0.001, leadTime + secondsPerBeat * 0.85);

    leadOsc.connect(formantFilter);
    formantFilter.connect(leadGain);
    leadGain.connect(masterGain);

    leadOsc.start(leadTime);
    leadOsc.stop(leadTime + secondsPerBeat * 0.9);
  }

  // Render audio
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    audioUrl,
    duration: durationSeconds
  };
}

// Convert AudioBuffer to standard WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // format chunk identifier
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // format chunk length
  setUint16(1); // sample format (raw)
  setUint16(numOfChan); // channel count
  setUint32(buffer.sampleRate); // sample rate
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data chunk identifier
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // data chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

// Generate creative AI lyrics
export async function generateLyricsFromAI(
  prompt: string,
  genre: string,
  mood: string
): Promise<{ title: string; lyrics: string }> {
  // If prompt is empty, provide a creative theme
  const finalPrompt = prompt.trim() || 'عن الشجاعة، الطموح، وقوة الظل الرقمي';

  const defaultTitles: Record<string, string> = {
    'شعبي': 'ملوك الجدعنة والظل',
    'بوب': 'همسات في ليل القاهرة',
    'راب': 'شفرة الصمت والسيادة',
    'روك': 'صوت الرعد الحر',
    'طربي': 'سكون الروح والأمل'
  };

  const sampleLyrics: Record<string, string> = {
    'شعبي': `(المذهب)
يا صاحب السكة العفي.. هنا الرجولة بتكتمل
في ظهرك الظل الوفي.. وعمر ما همك احتمل
ساعة اللقا صوتنا هادر.. والجدع دايماً يقف
بالذكاء والسر قادر.. والزمن لينا اعترف!

(الكوبليه الأول)
دق الدفوف واشعل النار.. ملوك على أرض القرار
لا بننكسر ولا بنلين.. إحنا الأصول والثابتين
الظل ماشي في أمان.. واثق في خطوة الزمان!`,

    'بوب': `(Verse 1)
في عتمة الليل الطويل.. بلقى شعاع من نور أمل
صوتك معي يمحي المستحيل.. ويداوي كل اللي انكسر
مع كل نبضة وكل لحن.. بنرسم سماء مليانة حلم

(Chorus)
طير في الفضاء واسبق مداك
الظل دايم في حماك
ولا يوم تغيب عن العيون
حبك حياة وسحر وجنون`,

    'راب': `(Intro - Beat Drops)
Yo.. فك الشفرة.. افتح الباب
أنا الظل الرقمي.. سيد الحساب
داتا وسرعة.. ضربة في الصميم
علم وثبات.. من غير تدليس وقديم

(Verse)
طالع في الرادار.. كاشف الخريطة
ما فيش عائق يقف.. الخطوة بسيطة
ذكاء مصري عبقري.. من غير حدود
هنا القوة والأصل.. إثبات الوجود!`,

    'روك': `(Guitar Solo Riff)
صرخة تهز جبال السكون!
ما بنرضى بالصمت والركود!
نكسر قيود المستحيل
ونمشي في الدرب الطويل!
قوة وعزم مالوش حدود!`,

    'طربي': `(موال)
يا ليل يا عين.. على اللي سهر صابر
يحمي الحبايب في الزمان الغادر
يا ظل يا وافي في الليالي عون
أنت الأمان والسر في هذا الكون..`
  };

  const matchedGenre = Object.keys(sampleLyrics).find(g => genre.includes(g)) || 'شعبي';
  const title = defaultTitles[matchedGenre] || `تراك ${genre} - ${finalPrompt.slice(0, 18)}`;
  const lyrics = sampleLyrics[matchedGenre];

  return { title, lyrics };
}
