
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCcw, Eye, EyeOff, Keyboard, PlayCircle, PauseCircle, Timer, AlertCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { CharItem, PracticeStats } from '../types';
import { audioManager } from '../utils/audio';

interface PracticeModeProps {
  charList: CharItem[];
  showPinyin: boolean;
  togglePinyin: () => void;
  enableTTS: boolean;
  toggleTTS: () => void;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ charList, showPinyin, togglePinyin, enableTTS, toggleTTS }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [isActive, setIsActive] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<PracticeStats>(() => {
    const saved = localStorage.getItem('practiceStats');
    return saved ? JSON.parse(saved) : {
      totalChars: 0,
      errors: 0,
      startTime: Date.now(),
      wpm: 0,
      lastSession: new Date().toISOString()
    };
  });

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Focus trap for typing
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // On mount, if we have saved stats, we don't necessarily want to continue the timer 
    // from where we left off visually, but for calculation we keep the data.
    if (!isActive) setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        setElapsedSeconds(s => {
          const newTime = s + 1;
          // Update WPM
          setStats(prev => {
             const minutes = newTime / 60;
             const wpm = minutes > 0 ? Math.round(prev.totalChars / minutes) : 0;
             const newStats = { ...prev, wpm };
             localStorage.setItem('practiceStats', JSON.stringify(newStats));
             return newStats;
          });
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const speakCharacter = (char: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any previous
      const utterance = new SpeechSynthesisUtterance(char);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    }
  };

  // Pre-emptive TTS: Read when index changes OR when we start, if TTS is enabled
  useEffect(() => {
    if (isActive && enableTTS && charList.length > 0) {
      const char = charList[currentIndex].char;
      speakCharacter(char);
    }
  }, [currentIndex, isActive, enableTTS, charList]);

  const handleStart = () => {
    setIsActive(true);
    // Focus invisible input
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePause = () => {
    setIsActive(false);
    window.speechSynthesis.cancel();
  };

  const handleReset = () => {
    setIsActive(false);
    window.speechSynthesis.cancel();
    setElapsedSeconds(0);
    setCurrentIndex(0);
    setCurrentInput('');
    setStats({
      totalChars: 0,
      errors: 0,
      startTime: Date.now(),
      wpm: 0,
      lastSession: new Date().toISOString()
    });
    localStorage.removeItem('practiceStats');
  };

  const resetInput = () => {
    setCurrentInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      resetInput();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) return;
    
    // Only allow letters, convert to lowercase
    const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    setCurrentInput(value);

    const targetChar = charList[currentIndex];
    const targetPinyin = targetChar.pinyin.toLowerCase().replace(/[^a-z]/g, '');

    // Check strict match
    if (value === targetPinyin) {
      // Correct!
      // Audio feedback (ding) always plays regardless of TTS setting
      audioManager.playSuccess();

      // Update stats
      setStats(prev => {
        const newStats = { ...prev, totalChars: prev.totalChars + 1 };
        localStorage.setItem('practiceStats', JSON.stringify(newStats));
        return newStats;
      });

      // Move next - this will trigger the useEffect to speak the next char
      setCurrentInput('');
      setCurrentIndex(prev => (prev + 1) % charList.length);
    } else if (!targetPinyin.startsWith(value)) {
       // Wrong prefix - error immediately
       audioManager.playError();
       setStats(prev => {
         const newStats = { ...prev, errors: prev.errors + 1 };
         localStorage.setItem('practiceStats', JSON.stringify(newStats));
         return newStats;
       });
    }
  };

  // Keep focus
  const keepFocus = () => {
    if (isActive) inputRef.current?.focus();
  };

  // Calculate visible window of characters
  const getVisibleItems = () => {
    const items = [];
    const total = charList.length;
    if (total === 0) return [];

    // range: -4 to +5 relative to current
    for (let i = -4; i <= 5; i++) {
      const idx = (currentIndex + i + total) % total; // Handle negative wrap
      items.push({ ...charList[idx], offset: i, keyIdx: idx });
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  return (
    <div className="flex flex-col h-[85vh] w-[90%] mx-auto" onClick={keepFocus}>
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between bg-white/5 rounded-xl p-4 mb-4 border border-white/10 shadow-lg shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={isActive ? handlePause : handleStart}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all min-w-[140px] justify-center ${
              isActive 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                : 'bg-neon-green/20 text-neon-green border border-neon-green/50 hover:bg-neon-green/30'
            }`}
          >
            {isActive ? <><PauseCircle size={20} /> 暂停</> : <><PlayCircle size={20} /> 开始练字</>}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white transition-all"
            title="重新开始 (Reset)"
          >
            <RotateCcw size={18} />
            <span className="hidden sm:inline">重置</span>
          </button>
          
          <div className="flex items-center gap-2 text-gray-300 ml-2">
            <Timer size={18} className="text-neon-blue" />
            <span className="font-mono text-xl">{Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm md:text-base ml-auto">
          <div className="flex flex-col items-center">
             <span className="text-gray-400 text-xs uppercase tracking-wider">速度 (WPM)</span>
             <span className="font-bold text-neon-blue text-xl">{stats.wpm}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-gray-400 text-xs uppercase tracking-wider">已练 (Count)</span>
             <span className="font-bold text-white text-xl">{stats.totalChars}</span>
          </div>
           <div className="flex flex-col items-center">
             <span className="text-gray-400 text-xs uppercase tracking-wider">错误 (Errors)</span>
             <span className="font-bold text-red-400 text-xl">{stats.errors}</span>
          </div>
          
          <div className="flex gap-4 border-l border-white/10 pl-4 ml-4">
            <button 
              onClick={toggleTTS}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
              title="发音开关"
            >
              <span className="text-gray-400 text-xs uppercase tracking-wider">发音</span>
              {enableTTS ? <Volume2 size={24} className="text-neon-pink" /> : <VolumeX size={24} className="text-gray-500" />}
            </button>

            <button 
              onClick={togglePinyin}
              className="flex flex-col items-center hover:opacity-80 transition-opacity"
              title="拼音显示开关"
            >
               <span className="text-gray-400 text-xs uppercase tracking-wider">拼音</span>
               {showPinyin ? <Eye size={24} className="text-neon-blue" /> : <EyeOff size={24} className="text-gray-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Practice Area */}
      <div className="relative flex-1 flex flex-col justify-center items-center w-full bg-black/20 rounded-xl border border-white/5 overflow-hidden">
        {/* Hidden Input for Typing */}
        <input 
          ref={inputRef}
          type="text" 
          value={currentInput}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={() => {
             // Force focus back if active to prevent "input deletion" feeling
             if (isActive) {
               // Small delay to allow other interactions (like clicking buttons) to register first
               setTimeout(() => inputRef.current?.focus(), 100);
             }
          }}
          className="opacity-0 absolute top-0 left-0 w-full h-full cursor-default"
          autoComplete="off"
          autoFocus={isActive}
        />

        {/* Carousel Container */}
        <div className="relative w-full flex-1 flex justify-center items-center overflow-hidden mask-linear-fade">
          <div className="relative w-full h-full flex justify-center items-center">
            {visibleItems.map((item, index) => {
              const isCenter = item.offset === 0;
              const xOffset = item.offset * 140; 
              const scale = isCenter ? 6.0 : Math.max(1.2, 2.0 - Math.abs(item.offset) * 0.3);
              const opacity = isCenter ? 1 : Math.max(0.2, 1 - Math.abs(item.offset) * 0.15);
              const zIndex = isCenter ? 50 : 10 - Math.abs(item.offset);
              const blur = isCenter ? 0 : Math.abs(item.offset) * 0.5;

              // Only the current character (center) should hide pinyin when toggled off.
              // Neighboring characters should always show pinyin for preview.
              const pinyinVisibility = isCenter 
                ? (showPinyin ? 'opacity-100' : 'opacity-0')
                : 'opacity-100';

              return (
                <div
                  key={`${item.keyIdx}-${item.offset}`} 
                  className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center transition-all duration-500 ease-out"
                  style={{
                    transform: `translate(calc(-50% + ${xOffset}px), -50%) scale(${scale})`,
                    opacity,
                    zIndex,
                    filter: `blur(${blur}px)`,
                  }}
                >
                  <div className={`text-[10px] sm:text-xs mb-1 font-mono font-bold tracking-widest text-neon-blue transition-opacity duration-300 ${pinyinVisibility}`}>
                    {item.displayPinyin}
                  </div>
                  {/* Using SimSun font as requested */}
                  <div 
                    className={`font-display text-white leading-none ${isCenter ? 'text-shadow-neon' : ''}`}
                    style={{ fontFamily: '"SimSun", "STSong", "Songti SC", serif' }}
                  >
                    {item.char}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Input Feedback Display */}
        <div className="w-full max-w-md mx-auto text-center pb-8 z-20">
           <div className="relative">
             <div className="h-16 bg-black/60 backdrop-blur border-b-2 border-neon-blue flex items-center justify-center text-3xl font-mono text-white tracking-widest rounded-t-lg">
               {currentInput || <span className="text-white/10 animate-pulse text-lg">Type pinyin...</span>}
             </div>
             {currentInput && (
               <button 
                onClick={resetInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-2"
                title="Clear"
               >
                 <RefreshCcw size={16} />
               </button>
             )}
           </div>
           <p className="mt-2 text-gray-500 text-sm">输入上方汉字对应的拼音, 回车清空</p>
        </div>

        {!isActive && stats.totalChars === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
            <div className="text-center">
              <Keyboard size={64} className="mx-auto text-neon-blue mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-white mb-2">准备好了吗？</h2>
              <p className="text-gray-400 mb-6">点击顶部 "开始练字" 按钮开始练习</p>
              <button 
                onClick={handleStart}
                className="px-8 py-3 bg-neon-blue text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] transition-all"
              >
                立即开始
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
