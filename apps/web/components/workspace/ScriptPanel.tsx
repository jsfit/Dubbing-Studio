'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowUp,
  ArrowDown,
  FastForward,
  Download,
  Filter,
} from 'lucide-react';
import { SegmentCard } from './SegmentCard';
import { useProjectStore } from '../../stores/projectStore';
import { ApiClient } from '../../lib/api';

interface ScriptPanelProps {
  onTriggerRecord: () => void;
}

export const ScriptPanel: React.FC<ScriptPanelProps> = ({ onTriggerRecord }) => {
  const {
    currentProject,
    activeSegmentId,
    selectSegment,
    nextSegment,
    prevSegment,
    nextUnrecordedSegment,
  } = useProjectStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unrecorded' | 'recorded'>('all');

  const segments = currentProject?.segments || [];

  const filteredSegments = segments.filter((seg) => {
    const matchesSearch =
      seg.originalText.toLowerCase().includes(search.toLowerCase()) ||
      (seg.punjabiText && seg.punjabiText.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'unrecorded') {
      return !seg.recordings || seg.recordings.length === 0;
    }
    if (filterType === 'recorded') {
      return seg.recordings && seg.recordings.length > 0;
    }
    return true;
  });

  const handleExportSrt = () => {
    if (!currentProject) return;
    window.open(`${ApiClient.getBaseUrl()}/api/projects/${currentProject.id}/export/srt`, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden">
      {/* Top Header / Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm">Dialogue & Script Timeline</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredSegments.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportSrt}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition"
              title="Export Punjabi Subtitles (SRT)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SRT</span>
            </button>
          </div>
        </div>

        {/* Search bar & quick filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search dialogues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('unrecorded')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                filterType === 'unrecorded'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unrecorded
            </button>
          </div>
        </div>

        {/* Segment navigation row */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevSegment}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition flex items-center gap-1 font-medium"
              title="Previous segment (↑ / Left)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              type="button"
              onClick={nextSegment}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition flex items-center gap-1 font-medium"
              title="Next segment (↓ / Right)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Next</span>
            </button>
          </div>

          <button
            type="button"
            onClick={nextUnrecordedSegment}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition"
          >
            <span>Next Unrecorded</span>
            <FastForward className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Segments Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment) => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              isActive={segment.id === activeSegmentId}
              onSelect={() => selectSegment(segment.id)}
              onRecord={onTriggerRecord}
            />
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No segments matching your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
