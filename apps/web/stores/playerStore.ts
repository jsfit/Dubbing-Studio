import { create } from 'zustand';

export type OriginalAudioMode = 'full' | 'ducked' | 'muted';

interface PlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  originalAudioMode: OriginalAudioMode;
  isLoopingSegment: boolean;
  videoElement: HTMLVideoElement | null;

  setVideoElement: (el: HTMLVideoElement | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setOriginalAudioMode: (mode: OriginalAudioMode) => void;
  setIsLoopingSegment: (loop: boolean) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  playSegment: (start: number, end: number) => void;
}

let segmentEndChecker: number | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
  volume: 1,
  isMuted: false,
  originalAudioMode: 'ducked',
  isLoopingSegment: false,
  videoElement: null,

  setVideoElement: (el) => set({ videoElement: el }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => {
    const el = get().videoElement;
    if (el) el.playbackRate = playbackRate;
    set({ playbackRate });
  },
  setVolume: (volume) => {
    const el = get().videoElement;
    if (el) el.volume = volume;
    set({ volume, isMuted: volume === 0 });
  },
  setIsMuted: (isMuted) => {
    const el = get().videoElement;
    if (el) el.muted = isMuted;
    set({ isMuted });
  },
  setOriginalAudioMode: (originalAudioMode) => set({ originalAudioMode }),
  setIsLoopingSegment: (isLoopingSegment) => set({ isLoopingSegment }),

  play: () => {
    const el = get().videoElement;
    if (el) el.play().catch(() => {});
  },

  pause: () => {
    const el = get().videoElement;
    if (el) el.pause();
  },

  togglePlay: () => {
    const el = get().videoElement;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  },

  seek: (time: number) => {
    const el = get().videoElement;
    if (el) {
      el.currentTime = Math.max(0, Math.min(el.duration || 10000, time));
    }
    set({ currentTime: time });
  },

  playSegment: (start: number, end: number) => {
    const { videoElement, isLoopingSegment } = get();
    if (!videoElement) return;

    if (segmentEndChecker) clearInterval(segmentEndChecker);

    videoElement.currentTime = start;
    videoElement.play().catch(() => {});

    segmentEndChecker = window.setInterval(() => {
      if (videoElement.currentTime >= end) {
        if (isLoopingSegment) {
          videoElement.currentTime = start;
        } else {
          videoElement.pause();
          if (segmentEndChecker) {
            clearInterval(segmentEndChecker);
            segmentEndChecker = null;
          }
        }
      }
    }, 50);
  },
}));
