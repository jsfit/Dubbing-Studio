'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Film, Trash2, ArrowRight, Globe } from 'lucide-react';
import type { Project } from '@pds/shared';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const stats = project.stats || {
    totalSegments: 0,
    recordedSegments: 0,
    completionPercentage: 0,
    duration: 0,
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition text-base">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500">
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
                onDelete(project.id);
              }
            }}
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Language Pill */}
        <div className="flex items-center gap-1.5 my-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            <Globe className="w-3 h-3" />
            Dub: {project.targetLanguage || 'Dubbed'}
          </span>
          <span className="text-[11px] text-slate-400">from {project.sourceLanguage.toUpperCase()}</span>
        </div>

        {project.description && (
          <p className="text-xs text-slate-600 mb-3 line-clamp-2">{project.description}</p>
        )}

        <div className="grid grid-cols-2 gap-2 my-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Duration</span>
            <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {stats.duration > 0 ? formatDuration(stats.duration) : '--:--'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Completed</span>
            <span className="font-medium text-slate-700 block mt-0.5">
              {stats.recordedSegments} / {stats.totalSegments} segments
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Dubbing Progress</span>
            <span className="font-medium text-indigo-600">{stats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">
          Model: {project.whisperModel}
        </span>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-lg shadow-sm transition"
        >
          <span>Open Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
