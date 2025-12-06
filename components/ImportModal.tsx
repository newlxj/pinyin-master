import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  currentText: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSave, currentText }) => {
  const [text, setText] = useState(currentText);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neon-surface border border-neon-blue/30 rounded-lg w-full max-w-2xl p-6 shadow-2xl shadow-neon-blue/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neon-blue font-display tracking-wider">录入字库 (Import Text)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">请输入多行汉字，非汉字字符将被自动过滤。</p>
          <textarea
            className="w-full h-64 bg-black/40 border border-gray-700 rounded-md p-4 text-white focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all resize-none font-sans"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此输入想要练习的汉字..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onSave(text);
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2 rounded-md bg-neon-blue text-black font-bold hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all"
          >
            <Save size={18} />
            保存字库
          </button>
        </div>
      </div>
    </div>
  );
};