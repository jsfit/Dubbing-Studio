'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/common/Header';
import { VideoPlayer } from '../../../components/workspace/VideoPlayer';
import { ScriptPanel } from '../../../components/workspace/ScriptPanel';
import { RecordingControls } from '../../../components/workspace/RecordingControls';
import { WaveformComparison } from '../../../components/workspace/WaveformComparison';
import { RenderModal } from '../../../components/workspace/RenderModal';
import { KeyboardShortcutsModal } from '../../../components/workspace/KeyboardShortcutsModal';
import { useProjectStore } from '../../../stores/projectStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { useRecordingStore } from '../../../stores/recordingStore';
import { Loader2 } from 'lucide-react';

interface ProjectWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectWorkspacePage({ params }: ProjectWorkspacePageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const {
    currentProject,
    isLoading,
    isSaving,
    saveStatusText,
    fetchProject,
    nextSegment,
    prevSegment,
  } = useProjectStore();

  const { togglePlay, playSegment, seek } = usePlayerStore();
  const {
    workflowState,
    startGuidedRecording,
    stopRecording,
    cancelRecording,
    acceptRecording,
  } = useRecordingStore();

  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    fetchProject(projectId);
  }, [projectId, fetchProject]);

  // Global Keyboard shortcuts handler (Space, R, P, Enter, Esc, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyR':
          e.preventDefault();
          if (workflowState === 'idle' || workflowState === 'preview') {
            startGuidedRecording();
          }
          break;
        case 'KeyP':
          e.preventDefault();
          const active = useProjectStore.getState().getActiveSegment();
          if (active) {
            seek(active.start);
            playSegment(active.start, active.end);
          }
          break;
        case 'Enter':
          if (workflowState === 'preview') {
            e.preventDefault();
            acceptRecording();
          }
          break;
        case 'Escape':
          if (workflowState === 'recording' || workflowState === 'countdown') {
            e.preventDefault();
            cancelRecording();
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          prevSegment();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          nextSegment();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    workflowState,
    togglePlay,
    startGuidedRecording,
    cancelRecording,
    acceptRecording,
    seek,
    playSegment,
    prevSegment,
    nextSegment,
  ]);

  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Loading Dubbing Workstation...</p>
        </div>
      </div>
    );
  }

  const recordedCount = currentProject.segments?.filter(
    (s) => s.recordings && s.recordings.length > 0
  ).length || 0;
  const totalCount = currentProject.segments?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Studio Header */}
      <Header
        projectName={currentProject.name}
        saveStatus={isSaving ? 'Saving changes...' : saveStatusText}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRender={() => setIsRenderOpen(true)}
        recordedCount={recordedCount}
        totalCount={totalCount}
      />

      {/* Main Workstation Layout */}
      <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] w-full mx-auto">
        {/* Left Column: Video Player, Recording Bar, Waveform */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <VideoPlayer videoPath={currentProject.video?.path} />
          <RecordingControls />
          <WaveformComparison />
        </div>

        {/* Right Column: Dialogue Timeline & Punjabi Script Editor */}
        <div className="lg:col-span-5 h-[calc(100vh-6rem)] sticky top-20">
          <ScriptPanel onTriggerRecord={startGuidedRecording} />
        </div>
      </div>

      {/* Render Modal */}
      <RenderModal
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
        project={currentProject}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
