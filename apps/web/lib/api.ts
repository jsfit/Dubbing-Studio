import type {
  Project,
  TranscriptSegment,
  Recording,
  RenderJob,
  CreateProjectPayload,
  UpdateSegmentPayload,
  RenderOptionsPayload,
  JobProgressEvent,
} from '@pds/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiClient {
  static getBaseUrl(): string {
    return API_BASE;
  }

  static getMediaUrl(relativePath?: string | null): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    // Normalize path to static storage route
    const parts = relativePath.split('storage/');
    const sub = parts.length > 1 ? parts[1] : relativePath.replace(/^.*[\\/]/, '');
    return `${API_BASE}/storage/${sub}`;
  }

  static async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    const data = await res.json();
    return data.projects;
  }

  static async getProject(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project details');
    const data = await res.json();
    return data.project;
  }

  static async createProject(payload: CreateProjectPayload): Promise<Project> {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project');
    }
    const data = await res.json();
    return data.project;
  }

  static async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  }

  static async uploadVideo(
    projectId: string,
    file: File
  ): Promise<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const res = await fetch(`${API_BASE}/api/projects/${projectId}/video`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload video');
    }

    return res.json();
  }

  static async updateSegment(
    projectId: string,
    segmentId: string,
    payload: UpdateSegmentPayload
  ): Promise<TranscriptSegment> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/segments/${segmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update segment');
    }
    const data = await res.json();
    return data.segment;
  }

  static async createSegment(
    projectId: string,
    data: { start: number; end: number; originalText?: string; punjabiText?: string }
  ): Promise<TranscriptSegment> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/segments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add segment');
    const resData = await res.json();
    return resData.segment;
  }

  static async deleteSegment(projectId: string, segmentId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/segments/${segmentId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete segment');
  }

  static async uploadRecording(
    projectId: string,
    segmentId: string,
    blob: Blob,
    duration: number
  ): Promise<Recording> {
    const formData = new FormData();
    formData.append('file', blob, `recording.webm`);
    formData.append('duration', String(duration));

    const res = await fetch(`${API_BASE}/api/projects/${projectId}/segments/${segmentId}/recording`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload recording');
    }

    const data = await res.json();
    return data.recording;
  }

  static async setActiveRecording(
    projectId: string,
    segmentId: string,
    recordingId: string,
    approved = false
  ): Promise<Recording> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/segments/${segmentId}/recordings/${recordingId}/active`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    });

    if (!res.ok) throw new Error('Failed to set active recording');
    const data = await res.json();
    return data.recording;
  }

  static async deleteRecording(projectId: string, recordingId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/recordings/${recordingId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete recording');
  }

  static async startRender(
    projectId: string,
    options: RenderOptionsPayload = {}
  ): Promise<{ renderJob: RenderJob; validation: any }> {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initiate render');
    }

    return res.json();
  }

  static subscribeToJobs(onEvent: (event: JobProgressEvent) => void): () => void {
    const es = new EventSource(`${API_BASE}/api/jobs/stream`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch {}
    };

    return () => {
      es.close();
    };
  }
}
