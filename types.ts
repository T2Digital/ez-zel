export interface Track {
  id: string;
  title: string;
  genre: string;
  mood: string;
  bpm: number;
  lyrics: string;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  createdAt: string;
  duration: number; // in seconds
  voicePersona?: string;
  isInstrumental?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  audioUrl?: string;
}

export type ActiveView = 'dashboard' | 'music' | 'chat' | 'vault' | 'agents';
