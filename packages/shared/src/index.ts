export type SegmentStatus = 'pending' | 'scripted' | 'recorded' | 'approved';

export type PunchlineMarker = 'punchline' | 'angry' | 'shock' | 'sarcastic' | 'suspicious';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface VideoAsset {
  id: string;
  projectId: string;
  filename: string;
  path: string;
  duration: number;
  width?: number | null;
  height?: number | null;
  fps?: number | null;
  createdAt: string;
}

export interface Recording {
  id: string;
  segmentId: string;
  version: number;
  path: string;
  duration: number;
  active: boolean;
  approved: boolean;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  projectId: string;
  index: number;
  start: number;
  end: number;
  originalText: string;
  punjabiText: string; // Database field for target dub text
  status: SegmentStatus;
  note?: string | null;
  marker?: PunchlineMarker | null;
  recordings?: Recording[];
}

export interface AudioTrack {
  id: string;
  projectId: string;
  type: 'music' | 'sfx';
  name: string;
  path: string;
  volume: number;
  start: number;
  duration?: number | null;
  fadeIn: number;
  fadeOut: number;
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: JobStatus;
  progress: number;
  outputPath?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  whisperModel: string;
  device: string;
  createdAt: string;
  updatedAt: string;
  video?: VideoAsset | null;
  segments?: TranscriptSegment[];
  audioTracks?: AudioTrack[];
  renderJobs?: RenderJob[];
  stats?: {
    totalSegments: number;
    scriptedSegments: number;
    recordedSegments: number;
    approvedSegments: number;
    completionPercentage: number;
    duration: number;
  };
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  whisperModel?: string;
  device?: string;
}

export interface UpdateSegmentPayload {
  punjabiText?: string; // target dub line
  originalText?: string;
  start?: number;
  end?: number;
  status?: SegmentStatus;
  note?: string | null;
  marker?: PunchlineMarker | null;
}

export interface RenderOptionsPayload {
  originalAudioVolume?: number; // 0 to 1, default 0
  voiceVolume?: number;         // 0 to 2, default 1
  punjabiVoiceVolume?: number;  // alias for backward compatibility
  musicVolume?: number;         // 0 to 1, default 0.15
  sfxVolume?: number;           // 0 to 1, default 0.8
  normalizeLoudness?: boolean;  // default true (-16 LUFS)
  quality?: 'fast' | 'balanced' | 'high';
}

export interface JobProgressEvent {
  jobId: string;
  type: 'transcription' | 'render' | 'audio_extract';
  projectId: string;
  status: JobStatus;
  progress: number; // 0 to 100
  message?: string;
  data?: unknown;
  error?: string;
}
