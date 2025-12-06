
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CharItem, GameConfig, GameEntity, GameScore } from '../types';
import { Settings, Play, Pause, RotateCcw, Trophy, Zap, Clock, AlertTriangle } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface GameModeProps {
  charList: CharItem[];
  initialConfig?: GameConfig;
}

export const GameMode: React.FC<GameModeProps> = ({ charList, initialConfig }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [fallenEntities, setFallenEntities] = useState<GameEntity[]>([]); // Words that hit the ground
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  
  // Game loop config state (modified during play for difficulty)
  const [config, setConfig] = useState<GameConfig>(initialConfig || {
    dropSpeed: 1.5,
    spawnInterval: 2000,
    maxMissed: 10,
    gameDuration: 120
  });

  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update config if props change and game is not running
  useEffect(() => {
    if (!isPlaying && !gameOver && initialConfig) {
      setConfig(initialConfig);
      setTimeLeft(initialConfig.gameDuration || 120);
    }
  }, [initialConfig, isPlaying, gameOver]);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<GameScore[]>(() => {
    const saved = localStorage.getItem('gameLeaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  // Game Loop
  const animate = useCallback((time: number) => {
    if (!isPlaying || gameOver) return;
    
    // Initialize start time for delta calc
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }
    const deltaTime = time - lastTimeRef.current;
    
    // Update timer approx every second based on accumulated frames, 
    // but simpler to just use Date.now() or check delta accumulation.
    // Here we just check real time difference in effect or decrement manually.
    // To stay synced with animation loop, we can just use a separate interval or check time here.
    // Let's use a separate useEffect for the 1s countdown to avoid state spam in animation loop, 
    // BUT checking precise end time is better.
    
    setEntities(prevEntities => {
      const containerHeight = containerRef.current?.clientHeight || 600;
      const nextEntities = [...prevEntities];
      const newlyFallen: GameEntity[] = [];

      // Move entities
      for (let i = 0; i < nextEntities.length; i++) {
        const ent = nextEntities[i];
        if (!ent.isDead && !ent.isFallen) {
          ent.y += config.dropSpeed;
          
          // Check collision with ground
          if (ent.y > containerHeight - 50) {
            ent.isFallen = true;
            ent.y = containerHeight - 40 - (Math.random() * 20); // Pile up varied heights
            ent.rotation = Math.random() * 60 - 30; // Random tilt
            newlyFallen.push(ent);
            setMissedCount(c => c + 1);
            audioManager.playError();
          }
        }
      }

      // If any fell, move them to fallen list to keep main loop clean
      if (newlyFallen.length > 0) {
        setFallenEntities(prev => [...prev.slice(-20), ...newlyFallen]); // Keep last 20 fallen to avoid clutter
      }

      // Filter out fallen/dead from active list
      return nextEntities.filter(e => !e.isDead && !e.isFallen);
    });

    // Spawn new
    if (time - lastSpawnTime.current > config.spawnInterval) {
      spawnEntity();
      lastSpawnTime.current = time;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, gameOver, config]);

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (isPlaying && !gameOver && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameOver]);

  const spawnEntity = () => {
    if (charList.length === 0 || !containerRef.current) return;
    const charObj = charList[Math.floor(Math.random() * charList.length)];
    const width = containerRef.current.clientWidth;
    
    // Ensure padding from edges
    const x = Math.random() * (width - 100) + 50; 

    const newEntity: GameEntity = {
      id: Math.random().toString(36).substr(2, 9),
      char: charObj.char,
      pinyin: charObj.pinyin.toLowerCase().replace(/[^a-z]/g, ''),
      displayPinyin: charObj.displayPinyin,
      x,
      y: -50,
      isDead: false,
      rotation: 0,
      isFallen: false
    };

    setEntities(prev => [...prev, newEntity]);
    
    // Slowly increase difficulty (Spawn rate mainly, speed governed by user accuracy now)
    setConfig(prev => ({
        ...prev,
        // Very slight natural speed increase to prevent stagnation, but let user error drive the main speed
        dropSpeed: Math.min(prev.dropSpeed + 0.005, 15), 
        spawnInterval: Math.max(prev.spawnInterval - 10, 400) // Cap spawn rate
    }));
  };

  useEffect(() => {
    if (isPlaying && !gameOver) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver, animate]);

  useEffect(() => {
    if (missedCount >= config.maxMissed) {
      handleGameOver();
    }
  }, [missedCount, config.maxMissed]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsPlaying(false);
    
    const newEntry: GameScore = { score, date: new Date().toLocaleDateString() };
    const newLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(newLeaderboard);
    localStorage.setItem('gameLeaderboard', JSON.stringify(newLeaderboard));
  };

  const handleStart = () => {
    setIsPlaying(true);
    setGameOver(false);
    setScore(0);
    setMissedCount(0);
    setEntities([]);
    setFallenEntities([]);
    setCurrentInput('');
    // Reset to initial user config or defaults
    const startConfig = initialConfig || { dropSpeed: 1.5, spawnInterval: 2000, maxMissed: 10, gameDuration: 120 };
    setConfig(startConfig);
    setTimeLeft(startConfig.gameDuration || 120);
    
    lastSpawnTime.current = performance.now();
    lastTimeRef.current = performance.now();

    // Ensure focus is grabbed after state update
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentInput('');
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
    const isBackspace = val.length < currentInput.length;
    setCurrentInput(val);

    // Check if any active entity matches completely
    const matches = entities.filter(ent => ent.pinyin === val);
    
    if (matches.length > 0) {
      // Find closest to ground
      matches.sort((a, b) => b.y - a.y);
      const target = matches[0];

      // Destroy it
      explodeEntity(target.id);
      setCurrentInput('');
      setScore(s => s + 10);
      audioManager.playExplosion();

      // REWARD: Decelerate on success (but not below initial setting)
      setConfig(prev => ({
        ...prev,
        dropSpeed: Math.max(prev.dropSpeed - 0.2, initialConfig?.dropSpeed ?? 0.1)
      }));

    } else {
        // Strict prefix checking
        const isPrefix = entities.some(ent => ent.pinyin.startsWith(val));
        
        if (!isPrefix && val.length > 0 && !isBackspace) {
            // PENALTY: Accelerate on error (only on new characters, not backspace)
            audioManager.playError();
            
            // Limit acceleration: Max speed on error is capped at Initial + 0.4
            const maxErrorSpeed = (initialConfig?.dropSpeed || 1.5) + 0.4;
            
            setConfig(prev => ({
                ...prev,
                // Small penalty increment, hard cap at initial + 0.4 for error-induced speed
                dropSpeed: Math.min(prev.dropSpeed + 0.1, maxErrorSpeed)
            }));
        }
    }
  };

  const explodeEntity = (id: string) => {
    setEntities(prev => prev.map(ent => {
        if (ent.id === id) {
            return { ...ent, isDead: true };
        }
        return ent;
    }));
  };

  const keepFocus = () => {
    // Only focus if clicking the container background, not buttons
    if (isPlaying && !gameOver) {
      inputRef.current?.focus();
    }
  };

  const getEncouragement = (score: number) => {
    if (score < 60) return "加油！熟能生巧，再试一次！";
    if (score < 150) return "不错哦！手速越来越快了，继续努力！";
    if (score < 300) return "太棒了！你简直是拼音高手！";
    return "神一般的存在！膜拜打字机！";
  };

  return (
    <div className="flex flex-col h-[85vh] w-[90%] mx-auto relative" onClick={keepFocus}>
       {/* Game Header */}
       <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mb-4 z-10 shrink-0">
         <div className="flex items-center gap-4 md:gap-8">
            <div className="text-center">
                <div className="text-xs text-gray-400 uppercase">Score</div>
                <div className="text-2xl font-bold text-neon-blue">{score}</div>
            </div>
            <div className="text-center">
                <div className="text-xs text-gray-400 uppercase">Time</div>
                <div className={`flex items-center gap-1 text-2xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    <Clock size={18} />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
            </div>
            <div className="text-center hidden sm:block">
                <div className="text-xs text-gray-400 uppercase">Speed</div>
                <div className="flex items-center gap-1 text-2xl font-bold text-yellow-400">
                    <Zap size={18} className={config.dropSpeed > 5 ? "animate-pulse" : ""} />
                    {config.dropSpeed.toFixed(1)}
                </div>
            </div>
            <div className="text-center hidden md:block">
                <div className="text-xs text-gray-400 uppercase">Lives</div>
                <div className="flex gap-1">
                    {Array.from({length: Math.max(0, config.maxMissed - missedCount)}).map((_, i) => (
                        <div key={i} className="w-2 h-6 bg-green-500 rounded-sm" />
                    ))}
                    {Array.from({length: Math.min(config.maxMissed, missedCount)}).map((_, i) => (
                        <div key={`missed-${i}`} className="w-2 h-6 bg-red-900/50 rounded-sm" />
                    ))}
                </div>
            </div>
         </div>
         
         <div className="flex gap-3">
            {!isPlaying && !gameOver && (
                <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="flex items-center gap-2 px-6 py-2 bg-neon-green text-black font-bold rounded-full hover:bg-green-400 transition-colors">
                    <Play size={20} /> Start Game
                </button>
            )}
            {isPlaying && (
                <button onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }} className="p-2 rounded-full bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40">
                    <Pause size={24} />
                </button>
            )}
            {gameOver && (
                <button onClick={(e) => { e.stopPropagation(); handleStart(); }} className="flex items-center gap-2 px-6 py-2 bg-neon-blue text-black font-bold rounded-full">
                    <RotateCcw size={20} /> Retry
                </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setShowLeaderboard(!showLeaderboard); }} className="p-2 text-gray-400 hover:text-white">
                <Trophy size={24} />
            </button>
         </div>
       </div>

       {/* Game Canvas Area */}
       <div ref={containerRef} className="relative flex-1 bg-gradient-to-b from-black/40 to-black/80 border-x border-b border-gray-800 rounded-b-xl overflow-hidden shadow-inner w-full">
            
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
            </div>

            {/* Entities */}
            {entities.map(ent => (
                <div 
                    key={ent.id}
                    className="absolute transform -translate-x-1/2 transition-transform will-change-transform"
                    style={{ left: ent.x, top: ent.y }}
                >
                    <div className="flex flex-col items-center">
                        <div className="bg-black/60 px-2 py-0.5 rounded text-xs text-neon-pink font-mono mb-1">{ent.displayPinyin}</div>
                        <div className="text-4xl text-white font-display text-shadow-lg">{ent.char}</div>
                    </div>
                </div>
            ))}

            {/* Fallen Pile */}
            {fallenEntities.map(ent => (
                 <div 
                    key={ent.id}
                    className="absolute transform -translate-x-1/2 opacity-40 grayscale"
                    style={{ 
                        left: ent.x, 
                        top: ent.y,
                        transform: `rotate(${ent.rotation}deg)` 
                    }}
                >
                    <div className="text-4xl text-gray-500 font-display">{ent.char}</div>
                </div>
            ))}

            {/* Input Field Overlay - Hidden but active */}
            <input 
                ref={inputRef}
                type="text" 
                value={currentInput}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                className="opacity-0 absolute inset-0 cursor-default"
                autoFocus={isPlaying}
                autoComplete="off"
            />
            
            {/* Input Display */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm">
                <div className={`bg-black/80 border transition-colors duration-300 rounded-lg p-2 text-center shadow-[0_0_15px_rgba(0,0,255,0.2)] ${currentInput.length > 0 && !entities.some(e => e.pinyin.startsWith(currentInput)) ? 'border-red-500' : 'border-neon-blue/50'}`}>
                    <span className="text-2xl font-mono text-neon-blue tracking-widest h-8 block">
                        {currentInput}
                        <span className="animate-pulse">_</span>
                    </span>
                </div>
                <p className="text-center text-gray-500 text-xs mt-1">回车可清空输入</p>
            </div>

            {/* Overlays */}
            {gameOver && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                    {/* Low Score Tip */}
                    {score < 60 && (
                      <div className="absolute top-8 right-8 max-w-xs bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg animate-pulse">
                        <div className="flex gap-2 items-start text-yellow-400 mb-1">
                          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                          <h4 className="font-bold text-sm">游戏提示 (Tip)</h4>
                        </div>
                        <p className="text-xs text-yellow-200/80 leading-relaxed">
                          觉得太快了吗？您可以点击右上角设置图标，降低<span className="text-white font-bold">下落速度</span>或增加<span className="text-white font-bold">生成间距</span>哦！
                        </p>
                      </div>
                    )}

                    <h2 className="text-5xl font-bold text-red-500 mb-2 font-display tracking-widest">GAME OVER</h2>
                    
                    <div className="text-center mb-8">
                       <div className="text-4xl text-white font-bold mb-2">{score} 分</div>
                       <p className="text-neon-blue text-lg italic">{getEncouragement(score)}</p>
                    </div>

                    <button onClick={handleStart} className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                        <RotateCcw size={20} /> 再来一局 (Try Again)
                    </button>
                </div>
            )}
            
            {showLeaderboard && (
                <div className="absolute inset-0 bg-black/90 z-40 p-8 overflow-auto">
                    <div className="max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-6">
                             <h3 className="text-2xl font-bold text-neon-pink"><Trophy className="inline mr-2"/> 排行榜 (Leaderboard)</h3>
                             <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white">Close</button>
                        </div>
                        <div className="space-y-2">
                            {leaderboard.map((entry, idx) => (
                                <div key={idx} className="flex justify-between p-3 bg-white/5 rounded border border-white/10">
                                    <span className="text-gray-400">#{idx + 1}</span>
                                    <span className="text-white font-mono">{entry.score}</span>
                                    <span className="text-gray-500 text-sm">{entry.date}</span>
                                </div>
                            ))}
                            {leaderboard.length === 0 && <div className="text-center text-gray-500 py-8">No records yet.</div>}
                        </div>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};
