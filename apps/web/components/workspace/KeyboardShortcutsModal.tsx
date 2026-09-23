'use client';

import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause Video' },
    { key: 'R', desc: 'Start Voice Recording (or Re-record)' },
    { key: 'P', desc: 'Preview Current Recording' },
    { key: 'Enter', desc: 'Accept Recording & Auto-Advance' },
    { key: 'Esc', desc: 'Stop / Cancel Recording' },
    { key: '↑ / ←', desc: 'Previous Segment' },
    { key: '↓ / →', desc: 'Next Segment' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Command className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-slate-100 text-xs">
          {shortcuts.map((s) => (
            <div key={s.key} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 text-slate-800 font-mono font-semibold rounded-md shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          Shortcuts are safely disabled when you are typing inside the Punjabi script editor.
        </div>
      </div>
    </div>
  );
};
