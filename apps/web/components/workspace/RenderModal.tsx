'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Film,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sliders,
  Play,
} from 'lucide-react';
import { ApiClient } from '../../lib/api';
import type { Project, JobProgressEvent } from '@pds/shared';

interface RenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [originalAudioVolume, setOriginalAudioVolume] = useState(0);
  const [punjabiVoiceVolume, setPunjabiVoiceVolume] = useState(1.0);
  const [normalizeLoudness, setNormalizeLoudness] = useState(true);
  const [quality, setQuality] = useState<'fast' | 'balanced' | 'high'>('fast');

  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Listen to job progress via SSE
    const unsubscribe = ApiClient.subscribeToJobs((event: JobProgressEvent) => {
      if (renderJobId && event.jobId === renderJobId) {
        setProgress(event.progress);
        if (event.message) setProgressMessage(event.message);

        if (event.status === 'completed') {
          setIsRendering(false);
          const data = event.data as { downloadUrl?: string } | undefined;
          if (data?.downloadUrl) {
            setDownloadUrl(ApiClient.getMediaUrl(data.downloadUrl));
          }
        } else if (event.status === 'failed') {
          setIsRendering(false);
          setError(event.error || 'Rendering failed');
        }
      }
    });

    return () => unsubscribe();
  }, [isOpen, renderJobId]);

  if (!isOpen || !project) return null;

  const segments = project.segments || [];
  const missingRecordings = segments.filter(
    (s) => !s.recordings || s.recordings.length === 0
  );
  const isFullyRecorded = missingRecordings.length === 0;

  const handleStartRender = async () => {
    setIsRendering(true);
    setProgress(0);
    setProgressMessage('Submitting FFmpeg render job...');
    setError(null);
    setDownloadUrl(null);

    try {
      const res = await ApiClient.startRender(project.id, {
        originalAudioVolume,
        punjabiVoiceVolume,
        normalizeLoudness,
        quality,
      });

      setRenderJobId(res.renderJob.id);
    } catch (err: unknown) {
      const errObj = err as Error;
      setIsRendering(false);
      setError(errObj.message || 'Failed to start rendering');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Export Dubbed Video (MP4)</h2>
              <p className="text-[11px] text-slate-500 font-medium">{project.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isRendering}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Download ready screen */}
          {downloadUrl ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dubbing Render Complete!</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Your final Punjabi dubbed MP4 has been generated and synchronized with FFmpeg.
                </p>
              </div>

              {/* Video preview */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner max-w-sm mx-auto">
                <video src={downloadUrl} controls className="w-full h-full object-contain" />
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={`${project.name.replace(/\s+/g, '_')}_dubbed.mp4`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Finished MP4</span>
                </a>
              </div>
            </div>
          ) : isRendering ? (
            /* Rendering in progress screen */
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Rendering Dubbed MP4...</h3>
                <p className="text-xs text-slate-500 mt-1">{progressMessage || 'Processing with FFmpeg'}</p>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <div className="flex justify-between text-xs font-mono font-medium text-slate-600">
                  <span>Render Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                You can keep this open or continue working while FFmpeg mixes the audio tracks in the background.
              </p>
            </div>
          ) : (
            /* Configure Render screen */
            <>
              {/* Validation Status */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isFullyRecorded
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                {isFullyRecorded ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <p className="font-semibold">
                    {isFullyRecorded
                      ? 'All segments recorded!'
                      : `${segments.length - missingRecordings.length} of ${segments.length} segments recorded`}
                  </p>
                  {!isFullyRecorded && (
                    <p className="mt-0.5 text-slate-600">
                      Missing {missingRecordings.length} recordings (e.g. segments #{missingRecordings.slice(0, 4).map((s) => s.index).join(', #')}
                      {missingRecordings.length > 4 ? '...' : ''}). You can still render, and missing lines will remain silent or play original audio.
                    </p>
                  )}
                </div>
              </div>

              {/* Mix settings */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Audio Mix & Export Settings</span>
                </div>

                {/* Original audio volume */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Original Dialogue Volume</span>
                    <span className="font-mono text-slate-500">{Math.round(originalAudioVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={originalAudioVolume}
                    onChange={(e) => setOriginalAudioVolume(Number.parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Set to 0% to completely replace original speech with your Punjabi voice.
                  </span>
                </div>

                {/* Punjabi voice volume */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Punjabi Voice Volume</span>
                    <span className="font-mono text-slate-500">{Math.round(punjabiVoiceVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={punjabiVoiceVolume}
                    onChange={(e) => setPunjabiVoiceVolume(Number.parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Loudness normalization */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 block">
                      Broadcast Loudness Normalization
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Applies EBU R128 (-16 LUFS) normalization for balanced dialogue.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={normalizeLoudness}
                    onChange={(e) => setNormalizeLoudness(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!downloadUrl && !isRendering && (
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartRender}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition"
            >
              <Film className="w-4 h-4" />
              <span>{isFullyRecorded ? 'Render Dubbed Video' : 'Render Anyway'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
