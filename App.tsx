import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { MusicStudio } from './components/MusicStudio';
import { ChatInterface } from './components/ChatInterface';
import { ActiveView } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ActiveView>('dashboard');

  const handleVoiceCommandTrigger = () => {
    // Quick voice command handler
    console.log('Voice Command Triggered');
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 font-cairo antialiased selection:bg-cyan-500 selection:text-black">
      {currentView === 'dashboard' && (
        <Dashboard
          onNavigate={(view) => setCurrentView(view)}
          onVoiceCommand={handleVoiceCommandTrigger}
        />
      )}

      {currentView === 'music' && (
        <MusicStudio
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'chat' && (
        <ChatInterface
          onBack={() => setCurrentView('dashboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}
    </div>
  );
};

export default App;
