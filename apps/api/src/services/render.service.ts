import path from 'node:path';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { FFmpegService, type RenderSegmentInput } from './ffmpeg.service.js';
import { jobQueue } from '../jobs/jobQueue.js';
import type { RenderOptionsPayload } from '@pds/shared';

export class RenderService {
  static async startRender(projectId: string, options: RenderOptionsPayload = {}) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        video: true,
        segments: {
          orderBy: { index: 'asc' },
          include: {
            recordings: true,
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');
    if (!project.video) throw new Error('Cannot render: No video asset attached to project');

    // Check completeness
    const missingRecordings = project.segments.filter(
      (s) => !s.recordings.some((r) => r.active || r.approved)
    );
    const missingScripts = project.segments.filter(
      (s) => !s.punjabiText || s.punjabiText.trim().length === 0
    );

    const renderJob = await prisma.renderJob.create({
      data: {
        projectId,
        status: 'queued',
        progress: 0,
      },
    });

    const jobId = renderJob.id;
    jobQueue.createJob(jobId, 'render', projectId);

    // Prepare recording segment inputs for FFmpeg
    const recordingInputs: RenderSegmentInput[] = [];
    for (const seg of project.segments) {
      // Find active or approved recording
      const activeRec = seg.recordings.find((r) => r.approved) || seg.recordings.find((r) => r.active);
      if (activeRec) {
        recordingInputs.push({
          recordingPath: activeRec.path,
          start: seg.start,
          duration: activeRec.duration,
        });
      }
    }

    // Run render in background
    (async () => {
      try {
        await prisma.renderJob.update({
          where: { id: jobId },
          data: { status: 'processing', progress: 5 },
        });
        jobQueue.updateProgress(jobId, 5, 'Initializing FFmpeg video rendering engine...');

        const outputFilename = `render_${projectId}_${Date.now()}.mp4`;
        const outputPath = path.join(config.dirs.renders, outputFilename);

        await FFmpegService.renderDubbedVideo({
          videoPath: project.video!.path,
          outputPath,
          recordings: recordingInputs,
          originalAudioVolume: options.originalAudioVolume ?? 0,
          voiceVolume: options.punjabiVoiceVolume ?? 1.0,
          normalizeLoudness: options.normalizeLoudness ?? true,
          onProgress: (progress) => {
            jobQueue.updateProgress(jobId, progress, `Rendering dubbed MP4 (${progress}%)...`);
            prisma.renderJob.update({
              where: { id: jobId },
              data: { progress },
            }).catch(() => {});
          },
        });

        await prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            progress: 100,
            outputPath,
          },
        });

        jobQueue.completeJob(jobId, 'Render completed successfully', {
          outputPath,
          downloadUrl: `/storage/renders/${outputFilename}`,
        });
      } catch (err: unknown) {
        const error = err as Error;
        await prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: error.message,
          },
        });
        jobQueue.failJob(jobId, error.message);
      }
    })();

    return {
      renderJob,
      validation: {
        totalSegments: project.segments.length,
        recordedSegments: project.segments.length - missingRecordings.length,
        missingRecordingsCount: missingRecordings.length,
        missingRecordingIndices: missingRecordings.map((s) => s.index),
        missingScriptsCount: missingScripts.length,
        canRender: true,
      },
    };
  }

  static async getRenderJob(jobId: string) {
    return prisma.renderJob.findUnique({ where: { id: jobId } });
  }
}
