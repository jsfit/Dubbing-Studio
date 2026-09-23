import { create } from 'zustand';
import type { Project, TranscriptSegment } from '@pds/shared';
import { ApiClient } from '../lib/api';

interface ProjectState {
  currentProject: Project | null;
  activeSegmentId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  saveStatusText: string;
  error: string | null;

  fetchProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  selectSegment: (id: string | null) => void;
  getActiveSegment: () => TranscriptSegment | null;
  updateSegmentText: (segmentId: string, text: string) => Promise<void>;
  updateSegmentNote: (segmentId: string, note: string) => Promise<void>;
  updateSegmentMarker: (segmentId: string, marker: any) => Promise<void>;
  nextSegment: () => void;
  prevSegment: () => void;
  nextUnrecordedSegment: () => void;
  refreshProject: () => Promise<void>;
}

let autosaveTimeout: NodeJS.Timeout | null = null;

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  activeSegmentId: null,
  isLoading: false,
  isSaving: false,
  saveStatusText: 'All changes saved',
  error: null,

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await ApiClient.getProject(id);
      const activeId = project.segments && project.segments.length > 0 ? project.segments[0].id : null;
      set({ currentProject: project, activeSegmentId: activeId, isLoading: false });
    } catch (err: unknown) {
      const error = err as Error;
      set({ error: error.message, isLoading: false });
    }
  },

  refreshProject: async () => {
    const current = get().currentProject;
    if (!current) return;
    try {
      const project = await ApiClient.getProject(current.id);
      set({ currentProject: project });
    } catch {}
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  selectSegment: (id) => set({ activeSegmentId: id }),

  getActiveSegment: () => {
    const { currentProject, activeSegmentId } = get();
    if (!currentProject || !currentProject.segments || !activeSegmentId) return null;
    return currentProject.segments.find((s) => s.id === activeSegmentId) || null;
  },

  updateSegmentText: async (segmentId: string, text: string) => {
    const project = get().currentProject;
    if (!project || !project.segments) return;

    // Optimistic update
    const updatedSegments = project.segments.map((s) =>
      s.id === segmentId ? { ...s, punjabiText: text, status: (s.status === 'approved' || s.status === 'recorded') ? s.status : (text.trim() ? 'scripted' : 'pending') as any } : s
    );

    set({
      currentProject: { ...project, segments: updatedSegments },
      isSaving: true,
      saveStatusText: 'Saving changes...',
    });

    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(async () => {
      try {
        await ApiClient.updateSegment(project.id, segmentId, { punjabiText: text });
        set({ isSaving: false, saveStatusText: 'All changes saved' });
      } catch (err) {
        set({ isSaving: false, saveStatusText: 'Failed to save' });
      }
    }, 800);
  },

  updateSegmentNote: async (segmentId: string, note: string) => {
    const project = get().currentProject;
    if (!project || !project.segments) return;

    const updatedSegments = project.segments.map((s) =>
      s.id === segmentId ? { ...s, note } : s
    );
    set({ currentProject: { ...project, segments: updatedSegments } });
    await ApiClient.updateSegment(project.id, segmentId, { note });
  },

  updateSegmentMarker: async (segmentId: string, marker: any) => {
    const project = get().currentProject;
    if (!project || !project.segments) return;

    const updatedSegments = project.segments.map((s) =>
      s.id === segmentId ? { ...s, marker } : s
    );
    set({ currentProject: { ...project, segments: updatedSegments } });
    await ApiClient.updateSegment(project.id, segmentId, { marker });
  },

  nextSegment: () => {
    const { currentProject, activeSegmentId } = get();
    if (!currentProject || !currentProject.segments) return;
    const idx = currentProject.segments.findIndex((s) => s.id === activeSegmentId);
    if (idx >= 0 && idx < currentProject.segments.length - 1) {
      set({ activeSegmentId: currentProject.segments[idx + 1].id });
    }
  },

  prevSegment: () => {
    const { currentProject, activeSegmentId } = get();
    if (!currentProject || !currentProject.segments) return;
    const idx = currentProject.segments.findIndex((s) => s.id === activeSegmentId);
    if (idx > 0) {
      set({ activeSegmentId: currentProject.segments[idx - 1].id });
    }
  },

  nextUnrecordedSegment: () => {
    const { currentProject, activeSegmentId } = get();
    if (!currentProject || !currentProject.segments) return;
    const currentIdx = currentProject.segments.findIndex((s) => s.id === activeSegmentId);
    const candidate = currentProject.segments
      .slice(currentIdx + 1)
      .find((s) => !s.recordings || s.recordings.length === 0);

    if (candidate) {
      set({ activeSegmentId: candidate.id });
    } else {
      // Check from beginning
      const fromStart = currentProject.segments.find((s) => !s.recordings || s.recordings.length === 0);
      if (fromStart) set({ activeSegmentId: fromStart.id });
    }
  },
}));
