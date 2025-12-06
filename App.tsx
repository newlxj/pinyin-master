
import React, { useState, useEffect } from 'react';
import { BookOpen, Gamepad2, Settings, Download, Info } from 'lucide-react';
import { AppMode, CharItem, GameConfig } from './types';
import { PracticeMode } from './components/PracticeMode';
import { GameMode } from './components/GameMode';
import { ImportModal } from './components/ImportModal';
import { SettingsModal } from './components/SettingsModal';
import { getPinyin, getPinyinWithTone, splitTextToChars, DEFAULT_TEXT } from './utils/pinyinService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PRACTICE);
  const [showImport, setShowImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Preferences with Persistence
  const [showPinyin, setShowPinyin] = useState(() => {
    return localStorage.getItem('pref_showPinyin') !== 'false'; // Default true
  });
  
  const [enableTTS, setEnableTTS] = useState(() => {
    return localStorage.getItem('pref_enableTTS') !== 'false'; // Default true
  });
  
  // Data State
  const [rawText, setRawText] = useState(() => {
    return localStorage.getItem('userWordBank') || DEFAULT_TEXT;
  });

  const [charList, setCharList] = useState<CharItem[]>([]);

  // Game Settings State
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('userGameConfig');
    return saved ? JSON.parse(saved) : {
      dropSpeed: 1.5,
      spawnInterval: 2000,
      maxMissed: 10,
      gameDuration: 120
    };
  });

  // Persist Preferences
  useEffect(() => {
    localStorage.setItem('pref_showPinyin', String(showPinyin));
  }, [showPinyin]);

  useEffect(() => {
    localStorage.setItem('pref_enableTTS', String(enableTTS));
  }, [enableTTS]);

  // Parse text into CharItems (Char + Pinyin + DisplayPinyin)
  useEffect(() => {
    const chars = splitTextToChars(rawText);
    const items: CharItem[] = chars.map(c => ({
      char: c,
      pinyin: getPinyin(c),
      displayPinyin: getPinyinWithTone(c)
    }));
    setCharList(items);
  }, [rawText]);

  const handleSaveText = (newText: string) => {
    setRawText(newText);
    localStorage.setItem('userWordBank', newText);
  };

  const handleSaveSettings = (newConfig: GameConfig) => {
    setGameConfig(newConfig);
    localStorage.setItem('userGameConfig', JSON.stringify(newConfig));
  };

  return (
    <div className="h-screen overflow-hidden bg-neon-dark text-white selection:bg-neon-pink selection:text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="w-[90%] mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-neon-blue to-neon-pink flex items-center justify-center font-bold text-black font-display text-xl">
              刘
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent font-display">
              练字机
            </h1>
          </div>

          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
            <button 
              onClick={() => setMode(AppMode.PRACTICE)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.PRACTICE ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              <BookOpen size={16} />
              <span className="hidden md:inline">练字模式</span>
            </button>
            <button 
              onClick={() => setMode(AppMode.GAME)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === AppMode.GAME ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,0,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
            >
              <Gamepad2 size={16} />
              <span className="hidden md:inline">游戏模式</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowImport(true)}
              className="p-2 text-gray-400 hover:text-neon-blue transition-colors rounded-full hover:bg-white/5"
              title="导入字库"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4 pb-2">
        {mode === AppMode.PRACTICE ? (
          <PracticeMode 
            charList={charList} 
            showPinyin={showPinyin}
            togglePinyin={() => setShowPinyin(!showPinyin)}
            enableTTS={enableTTS}
            toggleTTS={() => setEnableTTS(!enableTTS)}
          />
        ) : (
          <GameMode 
            charList={charList} 
            initialConfig={gameConfig}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 py-2 text-center text-xs text-gray-600 shrink-0">
        <p>Liu Kaiyi Pinyin Master © 2024 • Built with React & Tailwind</p>
      </footer>

      {/* Modals */}
      <ImportModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onSave={handleSaveText}
        currentText={rawText}
      />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={gameConfig}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
