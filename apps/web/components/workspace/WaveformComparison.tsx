'use client';

import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Activity, Play, Volume2 } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { usePlayerStore } from '../../stores/playerStore';
import { ApiClient } from '../../lib/api';

export const WaveformComparison: React.FC = () => {
  const punjabiWaveRef = useRef<HTMLDivElement>(null);
  const punjabiSurfer = useRef<WaveSurfer | null>(null);

  const activeSegment = useProjectStore((s) => s.getActiveSegment());
  const targetLanguage = useProjectStore((s) => s.currentProject?.targetLanguage) || 'Dubbed';
  const currentTime = usePlayerStore((s) => s.currentTime);

  const activeRecording = activeSegment?.recordings?.find((r) => r.active || r.approved) || activeSegment?.recordings?.[0];
  const recordingUrl = activeRecording ? ApiClient.getMediaUrl(activeRecording.path) : null;

  useEffect(() => {
    // Clean up existing instance if any
    if (punjabiSurfer.current) {
      try {
        punjabiSurfer.current.unAll();
        punjabiSurfer.current.destroy();
      } catch {}
      punjabiSurfer.current = null;
    }

    if (!punjabiWaveRef.current || !recordingUrl) {
      return;
    }

    let ws: WaveSurfer | null = null;
    try {
      ws = WaveSurfer.create({
        container: punjabiWaveRef.current,
        waveColor: '#818cf8',      // indigo-400
        progressColor: '#4f46e5',  // indigo-600
        cursorColor: '#312e81',    // indigo-900
        cursorWidth: 2,
        height: 48,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
      });

      // Ignore abort errors emitted by wavesurfer
      ws.on('error', (err: unknown) => {
        const error = err as { name?: string; message?: string } | string;
        const msg = typeof error === 'string' ? error : error?.message || '';
        const name = typeof error === 'object' && error ? error.name : '';
        if (name === 'AbortError' || msg.toLowerCase().includes('abort')) {
          return;
        }
        console.warn('WaveSurfer error:', err);
      });

      // Safely catch any load rejection (e.g. AbortError when component unmounts or URL changes)
      ws.load(recordingUrl).catch((err: unknown) => {
        const error = err as { name?: string; message?: string } | string;
        const msg = typeof error === 'string' ? error : error?.message || '';
        const name = typeof error === 'object' && error ? error.name : '';
        if (name === 'AbortError' || msg.toLowerCase().includes('abort')) {
          return;
        }
        console.warn('WaveSurfer load error:', err);
      });

      punjabiSurfer.current = ws;
    } catch {}

    return () => {
      if (ws) {
        try {
          ws.unAll();
          ws.destroy();
        } catch {}
      }
      punjabiSurfer.current = null;
    };
  }, [recordingUrl]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold text-slate-900">Audio Waveform & Timing Analysis</h3>
        </div>

        {activeSegment && (
          <div className="text-[11px] font-mono text-slate-500">
            Window: <span className="font-semibold text-slate-800">{(activeSegment.end - activeSegment.start).toFixed(2)}s</span>
            {activeRecording && (
              <span className="ml-2 text-indigo-600">
                (Recording: {activeRecording.duration.toFixed(2)}s)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {/* Dubbed Voice Waveform */}
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {targetLanguage} Recording Waveform
            </span>
            {activeRecording && (
              <span className="text-[10px] text-slate-500 font-mono">
                Version v{activeRecording.version}
              </span>
            )}
          </div>

          {recordingUrl ? (
            <div ref={punjabiWaveRef} className="w-full" />
          ) : (
            <div className="h-12 flex items-center justify-center text-xs text-slate-400">
              No recording for this segment yet. Press &apos;R&apos; to record your voice.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
