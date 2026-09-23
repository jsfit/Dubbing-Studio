import { create } from 'zustand';
import { AudioRecorder } from '../lib/audioRecorder';
import { ApiClient } from '../lib/api';
import { usePlayerStore } from './playerStore';
import { useProjectStore } from './projectStore';

export type RecordingWorkflowState = 'idle' | 'countdown' | 'recording' | 'preview';
export type RecordingMode = 'guided' | 'free';

interface RecordingStoreState {
  workflowState: RecordingWorkflowState;
  countdown: number;
  micLevel: number;
  recordedBlob: Blob | null;
  recordedDuration: number;
  previewAudioUrl: string | null;
  mode: RecordingMode;
  preRollSeconds: number;
  isSaving: boolean;
  error: string | null;

  setMode: (mode: RecordingMode) => void;
  setPreRollSeconds: (seconds: number) => void;
  startGuidedRecording: () => Promise<void>;
  startFreeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  acceptRecording: () => Promise<void>;
  discardRecording: () => void;
}

const recorder = new AudioRecorder();
let countdownTimer: number | null = null;
let segmentStopTimer: number | null = null;

export const useRecordingStore = create<RecordingStoreState>((set, get) => ({
  workflowState: 'idle',
  countdown: 0,
  micLevel: 0,
  recordedBlob: null,
  recordedDuration: 0,
  previewAudioUrl: null,
  mode: 'guided',
  preRollSeconds: 2,
  isSaving: false,
  error: null,

  setMode: (mode) => set({ mode }),
  setPreRollSeconds: (preRollSeconds) => set({ preRollSeconds }),

  startGuidedRecording: async () => {
    const activeSeg = useProjectStore.getState().getActiveSegment();
    if (!activeSeg) return;

    const player = usePlayerStore.getState();
    const preRoll = get().preRollSeconds;

    // Release old preview URL if any
    const oldUrl = get().previewAudioUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    set({ workflowState: 'countdown', countdown: preRoll, error: null, recordedBlob: null, previewAudioUrl: null });

    // Seek player to segment start
    player.seek(activeSeg.start);
    player.pause();

    // Duck video volume if configured
    if (player.originalAudioMode === 'ducked') {
      player.setVolume(0.2);
    } else if (player.originalAudioMode === 'muted') {
      player.setIsMuted(true);
    }

    let remaining = preRoll;
    countdownTimer = window.setInterval(async () => {
      remaining -= 1;
      if (remaining > 0) {
        set({ countdown: remaining });
      } else {
        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = null;

        // Start recording
        try {
          await recorder.start({}, (level) => set({ micLevel: level }));
          set({ workflowState: 'recording', countdown: 0 });

          // Start playing video
          player.play();

          // Auto-stop at segment end if guided mode
          const durationMs = Math.max(1000, (activeSeg.end - activeSeg.start) * 1000);
          segmentStopTimer = window.setTimeout(() => {
            get().stopRecording();
          }, durationMs);
        } catch (err: unknown) {
          const error = err as Error;
          set({ workflowState: 'idle', error: `Microphone access denied: ${error.message}` });
          player.setVolume(1.0);
          player.setIsMuted(false);
        }
      }
    }, 1000);
  },

  startFreeRecording: async () => {
    const activeSeg = useProjectStore.getState().getActiveSegment();
    if (!activeSeg) return;

    const oldUrl = get().previewAudioUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    try {
      await recorder.start({}, (level) => set({ micLevel: level }));
      set({ workflowState: 'recording', recordedBlob: null, previewAudioUrl: null, error: null });
    } catch (err: unknown) {
      const error = err as Error;
      set({ workflowState: 'idle', error: `Microphone error: ${error.message}` });
    }
  },

  stopRecording: async () => {
    if (segmentStopTimer) {
      clearTimeout(segmentStopTimer);
      segmentStopTimer = null;
    }

    const player = usePlayerStore.getState();
    player.pause();
    player.setVolume(1.0);
    player.setIsMuted(false);

    try {
      const { blob, duration } = await recorder.stop();
      const previewUrl = URL.createObjectURL(blob);
      set({
        workflowState: 'preview',
        recordedBlob: blob,
        recordedDuration: duration,
        previewAudioUrl: previewUrl,
        micLevel: 0,
      });
    } catch (err: unknown) {
      const error = err as Error;
      set({ workflowState: 'idle', error: error.message });
    }
  },

  cancelRecording: () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (segmentStopTimer) {
      clearTimeout(segmentStopTimer);
      segmentStopTimer = null;
    }
    recorder.cancel();

    const player = usePlayerStore.getState();
    player.pause();
    player.setVolume(1.0);
    player.setIsMuted(false);

    const oldUrl = get().previewAudioUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    set({ workflowState: 'idle', countdown: 0, micLevel: 0, recordedBlob: null, previewAudioUrl: null });
  },

  acceptRecording: async () => {
    const { recordedBlob, recordedDuration } = get();
    const activeSeg = useProjectStore.getState().getActiveSegment();
    const project = useProjectStore.getState().currentProject;

    if (!recordedBlob || !activeSeg || !project) return;

    set({ isSaving: true });
    try {
      await ApiClient.uploadRecording(project.id, activeSeg.id, recordedBlob, recordedDuration);
      await useProjectStore.getState().refreshProject();

      // Clean up preview
      const oldUrl = get().previewAudioUrl;
      if (oldUrl) URL.revokeObjectURL(oldUrl);

      set({
        workflowState: 'idle',
        recordedBlob: null,
        previewAudioUrl: null,
        isSaving: false,
      });

      // Auto-advance to next segment
      useProjectStore.getState().nextUnrecordedSegment();
    } catch (err: unknown) {
      const error = err as Error;
      set({ isSaving: false, error: `Failed to save recording: ${error.message}` });
    }
  },

  discardRecording: () => {
    const oldUrl = get().previewAudioUrl;
    if (oldUrl) URL.revokeObjectURL(oldUrl);

    set({
      workflowState: 'idle',
      recordedBlob: null,
      previewAudioUrl: null,
      countdown: 0,
      micLevel: 0,
    });
  },
}));
