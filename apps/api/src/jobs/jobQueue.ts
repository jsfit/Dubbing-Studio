import { EventEmitter } from 'node:events';
import type { JobProgressEvent, JobStatus } from '@pds/shared';

class JobQueueManager extends EventEmitter {
  private jobs: Map<string, JobProgressEvent> = new Map();

  createJob(jobId: string, type: 'transcription' | 'render' | 'audio_extract', projectId: string): JobProgressEvent {
    const job: JobProgressEvent = {
      jobId,
      type,
      projectId,
      status: 'queued',
      progress: 0,
      message: 'Job initialized',
    };
    this.jobs.set(jobId, job);
    this.emit('progress', job);
    return job;
  }

  updateProgress(jobId: string, progress: number, message?: string, data?: unknown): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progress = Math.min(100, Math.max(0, Math.round(progress * 10) / 10));
    if (message) job.message = message;
    if (data !== undefined) job.data = data;

    this.jobs.set(jobId, job);
    this.emit('progress', job);
  }

  completeJob(jobId: string, message = 'Completed successfully', data?: unknown): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.message = message;
    if (data !== undefined) job.data = data;

    this.jobs.set(jobId, job);
    this.emit('progress', job);
  }

  failJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.message = `Failed: ${error}`;

    this.jobs.set(jobId, job);
    this.emit('progress', job);
  }

  getJob(jobId: string): JobProgressEvent | undefined {
    return this.jobs.get(jobId);
  }
}

export const jobQueue = new JobQueueManager();
