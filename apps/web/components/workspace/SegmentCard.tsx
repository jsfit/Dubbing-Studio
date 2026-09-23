'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  Mic,
  MessageSquare,
  Smile,
  Volume2,
} from 'lucide-react';
import type { TranscriptSegment, SegmentStatus } from '@pds/shared';
import { useProjectStore } from '../../stores/projectStore';
import { usePlayerStore } from '../../stores/playerStore';
import { ApiClient } from '../../lib/api';

interface SegmentCardProps {
  segment: TranscriptSegment;
  isActive: boolean;
  onSelect: () => void;
  onRecord: () => void;
}

export const SegmentCard: React.FC<SegmentCardProps> = ({
  segment,
  isActive,
  onSelect,
  onRecord,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const updateSegmentText = useProjectStore((s) => s.updateSegmentText);
  const updateSegmentNote = useProjectStore((s) => s.updateSegmentNote);
  const updateSegmentMarker = useProjectStore((s) => s.updateSegmentMarker);
  const playSegment = usePlayerStore((s) => s.playSegment);
  const seek = usePlayerStore((s) => s.seek);
  const targetLanguage = useProjectStore((s) => s.currentProject?.targetLanguage) || 'Dub';

  const [text, setText] = useState(segment.punjabiText || '');
  const [showNote, setShowNote] = useState(!!segment.note);
  const [note, setNote] = useState(segment.note || '');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Sync internal state if prop changes
  useEffect(() => {
    setText(segment.punjabiText || '');
  }, [segment.punjabiText]);

  // Scroll active segment into view
  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    updateSegmentText(segment.id, val);
  };

  const handleNoteBlur = () => {
    updateSegmentNote(segment.id, note);
  };

  const activeRecording = segment.recordings?.find((r) => r.active || r.approved) || segment.recordings?.[0];

  const handlePlayRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeRecording) return;
    const url = ApiClient.getMediaUrl(activeRecording.path);
    const audio = new Audio(url);
    setIsPlayingAudio(true);
    audio.play().catch(() => {});
    audio.onended = () => setIsPlayingAudio(false);
  };

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const renderStatusBadge = (status: SegmentStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'recorded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Mic className="w-3 h-3" />
            Recorded (v{activeRecording?.version || 1})
          </span>
        );
      case 'scripted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Script Ready
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            Empty
          </span>
        );
    }
  };

  const markerEmojis: Record<string, string> = {
    punchline: '😂 Punchline',
    angry: '😡 Angry',
    shock: '😱 Shock',
    sarcastic: '😎 Sarcastic',
    suspicious: '🤨 Suspicious',
  };

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        isActive
          ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/10'
          : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
            #{String(segment.index).padStart(3, '0')}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              seek(segment.start);
              playSegment(segment.start, segment.end);
            }}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2 py-0.5 rounded transition"
            title="Play segment range"
          >
            <Clock className="w-3 h-3" />
            <span>{formatSec(segment.start)} → {formatSec(segment.end)}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {segment.marker && (
            <span className="text-[11px] px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md font-medium">
              {markerEmojis[segment.marker] || segment.marker}
            </span>
          )}
          {renderStatusBadge(segment.status)}
        </div>
      </div>

      {/* Original Transcript */}
      <div className="mb-3 bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-0.5">
            Original Transcript
          </span>
          <p className="text-xs text-slate-800 leading-relaxed font-medium">
            {segment.originalText || '(No dialogue)'}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            seek(segment.start);
            playSegment(segment.start, segment.end);
          }}
          className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 transition mt-1"
          title="Listen original"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Language Adaptation Script Editor */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold tracking-wider text-indigo-700 uppercase">
            {targetLanguage} Script
          </label>
          <span className="text-[10px] text-slate-400">{text.length} chars</span>
        </div>
        <textarea
          rows={2}
          value={text}
          onChange={handleTextChange}
          placeholder={`Write your adapted line in ${targetLanguage}...`}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-medium transition leading-snug"
        />
      </div>

      {/* Note input if enabled */}
      {showNote && (
        <div className="mb-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder="Director note: Say this with high sarcastic pitch..."
            className="w-full px-2.5 py-1 text-xs bg-amber-50/50 border border-amber-200 rounded-md text-amber-900 placeholder:text-amber-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* Bottom Segment Action Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          {/* Quick preview recording button if exists */}
          {activeRecording && (
            <button
              type="button"
              onClick={handlePlayRecording}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
              title={`Preview latest ${targetLanguage} recording`}
            >
              <Play className="w-3 h-3" />
              <span>{isPlayingAudio ? 'Playing...' : `Play (v${activeRecording.version})`}</span>
            </button>
          )}

          {/* Comedy marker picker */}
          <select
            value={segment.marker || ''}
            onChange={(e) => {
              e.stopPropagation();
              updateSegmentMarker(segment.id, e.target.value || null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 focus:outline-none"
            title="Mark line comedy mood"
          >
            <option value="">Mood: None</option>
            <option value="punchline">😂 Punchline</option>
            <option value="angry">😡 Angry</option>
            <option value="shock">😱 Shock</option>
            <option value="sarcastic">😎 Sarcastic</option>
            <option value="suspicious">🤨 Suspicious</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowNote(!showNote);
            }}
            className={`p-1 rounded transition ${showNote ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-700'}`}
            title="Add segment note"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
              onRecord();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition"
          >
            <Mic className="w-3 h-3" />
            <span>{activeRecording ? 'Re-record' : 'Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
