'use client';

import React from 'react';
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Check,
  X,
  Volume2,
  Clock,
  Radio,
  Loader2,
} from 'lucide-react';
import { useRecordingStore } from '../../stores/recordingStore';
import { useProjectStore } from '../../stores/projectStore';

export const RecordingControls: React.FC = () => {
  const {
    workflowState,
    countdown,
    micLevel,
    recordedDuration,
    previewAudioUrl,
    mode,
    preRollSeconds,
    isSaving,
    error,
    setMode,
    setPreRollSeconds,
    startGuidedRecording,
    stopRecording,
    cancelRecording,
    acceptRecording,
    discardRecording,
  } = useRecordingStore();

  const activeSegment = useProjectStore((s) => s.getActiveSegment());

  const handlePlayPreview = () => {
    if (!previewAudioUrl) return;
    const audio = new Audio(previewAudioUrl);
    audio.play().catch(() => {});
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      {/* Countdown Overlay */}
      {workflowState === 'countdown' && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-rose-600 text-4xl font-extrabold shadow-lg animate-pulse mb-3">
            {countdown}
          </div>
          <p className="text-xs font-semibold text-slate-700">Get Ready to Speak Punjabi...</p>
          <button
            type="button"
            onClick={cancelRecording}
            className="mt-3 text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Cancel (Esc)
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={discardRecording} className="text-rose-500 hover:text-rose-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content depending on workflowState */}
      {workflowState === 'recording' ? (
        <div className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 tracking-wider uppercase">Recording Voice</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Speak your Punjabi line now... (Auto-stops at segment end)
              </p>
            </div>
          </div>

          {/* VU Meter */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 font-mono">Mic Level</span>
              <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 transition-all duration-75"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 transition"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop (Esc)</span>
            </button>
          </div>
        </div>
      ) : workflowState === 'preview' ? (
        /* Preview State */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700">Recording Preview</span>
                <span className="text-[11px] font-mono text-slate-500">({recordedDuration}s)</span>
              </div>
              <p className="text-xs text-slate-500">Listen back to your dubbing delivery</p>
            </div>
            <button
              type="button"
              onClick={handlePlayPreview}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition ml-2"
              title="Listen preview"
            >
              <Play className="w-4 h-4 fill-current" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={discardRecording}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={startGuidedRecording}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-record (R)</span>
            </button>
            <button
              type="button"
              onClick={acceptRecording}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Accept (Enter)</span>
            </button>
          </div>
        </div>
      ) : (
        /* Idle State */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Recording Station</span>
                {activeSegment && (
                  <span className="text-xs text-indigo-600 font-semibold font-mono">
                    Segment #{activeSegment.index}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {activeSegment
                  ? `Ready to record (${(activeSegment.end - activeSegment.start).toFixed(1)}s window)`
                  : 'Select a segment to record'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Pre-roll setting */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Countdown:</span>
              <select
                value={preRollSeconds}
                onChange={(e) => setPreRollSeconds(Number.parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="0">0s</option>
                <option value="1">1s</option>
                <option value="2">2s</option>
                <option value="3">3s</option>
              </select>
            </div>

            {/* Mode selector */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="guided">Guided (Auto-stop)</option>
              <option value="free">Free Recording</option>
            </select>

            {/* Big Record Button */}
            <button
              type="button"
              disabled={!activeSegment}
              onClick={startGuidedRecording}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-200 disabled:opacity-40 transition"
              title="Start recording (Shortcut: R)"
            >
              <Mic className="w-4 h-4" />
              <span>Record Line (R)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
