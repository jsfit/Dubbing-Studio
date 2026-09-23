'use client';

import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Gauge,
  Sliders,
} from 'lucide-react';
import { usePlayerStore, type OriginalAudioMode } from '../../stores/playerStore';
import { useProjectStore } from '../../stores/projectStore';
import { ApiClient } from '../../lib/api';

interface VideoPlayerProps {
  videoPath?: string | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoPath }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    volume,
    isMuted,
    originalAudioMode,
    isLoopingSegment,
    setVideoElement,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setPlaybackRate,
    setVolume,
    setIsMuted,
    setOriginalAudioMode,
    setIsLoopingSegment,
    togglePlay,
    seek,
  } = usePlayerStore();

  const activeSegment = useProjectStore((s) => s.getActiveSegment());

  const videoUrl = ApiClient.getMediaUrl(videoPath);

  useEffect(() => {
    if (videoRef.current) {
      setVideoElement(videoRef.current);
    }
    return () => setVideoElement(null);
  }, [setVideoElement]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Auto-highlight active segment as video plays
    const project = useProjectStore.getState().currentProject;
    if (project && project.segments) {
      const activeSeg = project.segments.find(
        (seg) => time >= seg.start && time < seg.end
      );
      if (activeSeg && activeSeg.id !== useProjectStore.getState().activeSegmentId) {
        useProjectStore.getState().selectSegment(activeSeg.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Video display */}
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
        ) : (
          <div className="text-slate-400 text-xs">No video loaded</div>
        )}

        {/* Big play overlay when paused */}
        {!isPlaying && videoUrl && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center backdrop-blur-sm transition transform hover:scale-105"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        )}

        {/* Current Segment indicator pill on video */}
        {activeSegment && (
          <div className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-medium border border-white/10 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>Segment #{activeSegment.index}</span>
            <span className="text-slate-300">({formatTime(activeSegment.start)} - {formatTime(activeSegment.end)})</span>
          </div>
        )}
      </div>

      {/* Scrubber timeline bar */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={(e) => seek(Number.parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition"
          />
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 border-t border-slate-100 text-slate-700">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Replay Segment */}
          {activeSegment && (
            <button
              type="button"
              onClick={() => seek(activeSegment.start)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              title="Jump to segment start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Timecode display */}
          <span className="text-xs font-mono font-medium text-slate-700 ml-1">
            {formatTime(currentTime)} <span className="text-slate-400">/</span> {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Loop current segment */}
          <button
            type="button"
            onClick={() => setIsLoopingSegment(!isLoopingSegment)}
            className={`p-1.5 rounded-lg transition ${
              isLoopingSegment
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
            title="Loop current segment"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Playback speed selector */}
          <div className="flex items-center gap-1 text-xs">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(Number.parseFloat(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>

          {/* Original Audio Ducking during recording */}
          <div className="flex items-center gap-1 text-xs">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={originalAudioMode}
              onChange={(e) => setOriginalAudioMode(e.target.value as OriginalAudioMode)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-1.5 py-0.5 text-xs focus:outline-none focus:border-indigo-500"
              title="Original audio level during recording"
            >
              <option value="ducked">Ducked (20%)</option>
              <option value="muted">Muted (0%)</option>
              <option value="full">Full (100%)</option>
            </select>
          </div>

          {/* Volume slider */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-slate-700 transition"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
              className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
