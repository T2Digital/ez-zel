import { create } from 'zustand';

interface ChatState {
  input: string;
  setInput: (input: string) => void;
  appStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
  setAppStatus: (status: 'idle' | 'listening' | 'thinking' | 'speaking') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSentinelMode: boolean;
  setIsSentinelMode: (mode: boolean) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  input: '',
  setInput: (input) => set({ input }),
  appStatus: 'idle',
  setAppStatus: (appStatus) => set({ appStatus }),
  isMuted: false,
  setIsMuted: (isMuted) => set({ isMuted }),
  isSentinelMode: false,
  setIsSentinelMode: (isSentinelMode) => set({ isSentinelMode }),
  isSearchActive: false,
  setIsSearchActive: (isSearchActive) => set({ isSearchActive }),
}));
