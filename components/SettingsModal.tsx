
import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Clock } from 'lucide-react';
import { GameConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameConfig;
  onSave: (config: GameConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<GameConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof GameConfig, value: number) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neon-surface border border-neon-blue/30 rounded-lg w-full max-w-md p-6 shadow-2xl shadow-neon-blue/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-neon-blue font-display tracking-wider flex items-center gap-2">
            <Settings size={24} />
            游戏设置 (Settings)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Game Duration */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300 font-medium flex items-center gap-2">
                <Clock size={16} /> 游戏时长 (Duration)
              </label>
              <span className="text-neon-blue font-mono">{localConfig.gameDuration} 秒</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={localConfig.gameDuration || 120}
              onChange={(e) => handleChange('gameDuration', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />
            <p className="text-xs text-gray-500 mt-1">设置每一局游戏的倒计时时长。</p>
          </div>

          {/* Drop Speed */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300 font-medium">下落速度 (Drop Speed)</label>
              <span className="text-neon-blue font-mono">{localConfig.dropSpeed.toFixed(1)} px/frame</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={localConfig.dropSpeed}
              onChange={(e) => handleChange('dropSpeed', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
            <p className="text-xs text-gray-500 mt-1">控制文字下落的初始速度。</p>
          </div>

          {/* Spawn Interval */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-gray-300 font-medium">生成间距 (Spawn Interval)</label>
              <span className="text-neon-blue font-mono">{localConfig.spawnInterval} ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={localConfig.spawnInterval}
              onChange={(e) => handleChange('spawnInterval', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-pink"
            />
            <p className="text-xs text-gray-500 mt-1">控制新文字出现的时间间隔。</p>
          </div>

          {/* Max Missed */}
          <div>
             <div className="flex justify-between mb-2">
              <label className="text-gray-300 font-medium">结束阈值 (Max Missed)</label>
              <span className="text-neon-blue font-mono">{localConfig.maxMissed} 个</span>
            </div>
            <input
              type="number"
              min="1"
              max="50"
              value={localConfig.maxMissed}
              onChange={(e) => handleChange('maxMissed', parseInt(e.target.value))}
              className="w-full bg-black/40 border border-gray-700 rounded p-2 text-white focus:border-neon-blue focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">当落地文字达到此数量时游戏结束。</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(localConfig);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2 rounded-md bg-neon-blue text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all"
          >
            <Save size={18} />
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
