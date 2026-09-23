'use client';

import React from 'react';
import Link from 'next/link';
import { Mic2, Film, HelpCircle } from 'lucide-react';

interface HeaderProps {
  projectName?: string;
  targetLanguage?: string;
  saveStatus?: string;
  onOpenShortcuts?: () => void;
  onOpenRender?: () => void;
  recordedCount?: number;
  totalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  targetLanguage,
  saveStatus,
  onOpenShortcuts,
  onOpenRender,
  recordedCount = 0,
  totalCount = 0,
}) => {
  return (
    <header className="h-16 border-b border-studio-border bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:bg-indigo-700 transition">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">Dubbing Studio</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Light Studio
              </span>
            </div>
            {projectName ? (
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                {projectName} {targetLanguage && <span className="text-indigo-600 font-semibold">• {targetLanguage} Dub</span>}
              </p>
            ) : (
              <p className="text-xs text-slate-400">Universal Video Dubbing Workstation</p>
            )}
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {saveStatus && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{saveStatus}</span>
          </div>
        )}

        {totalCount > 0 && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-indigo-50/60 border border-indigo-100 px-3 py-1.5 rounded-lg">
            <span className="font-semibold text-indigo-700">{recordedCount} / {totalCount}</span>
            <span>Recorded</span>
          </div>
        )}

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>
        )}

        {onOpenRender && (
          <button
            type="button"
            onClick={onOpenRender}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm shadow-indigo-200 transition"
          >
            <Film className="w-4 h-4" />
            <span>Render Video</span>
          </button>
        )}
      </div>
    </header>
  );
};
