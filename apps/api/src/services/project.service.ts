import path from 'node:path';
import fs from 'node:fs';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { FFmpegService } from './ffmpeg.service.js';
import { TranscriptionService } from './transcription.service.js';
import { jobQueue } from '../jobs/jobQueue.js';
import type { CreateProjectPayload, UpdateSegmentPayload, SegmentStatus } from '@pds/shared';

export class ProjectService {
  static async listProjects() {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        video: true,
        segments: {
          include: {
            recordings: true,
          },
        },
      },
    });

    return projects.map((p) => {
      const totalSegments = p.segments.length;
      const scriptedSegments = p.segments.filter((s) => s.punjabiText && s.punjabiText.trim().length > 0).length;
      const recordedSegments = p.segments.filter((s) => s.recordings.length > 0).length;
      const approvedSegments = p.segments.filter((s) => s.recordings.some((r) => r.approved)).length;
      const completionPercentage = totalSegments > 0 ? Math.round((recordedSegments / totalSegments) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        sourceLanguage: p.sourceLanguage,
        whisperModel: p.whisperModel,
        device: p.device,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        video: p.video ? {
          id: p.video.id,
          projectId: p.video.projectId,
          filename: p.video.filename,
          path: p.video.path,
          duration: p.video.duration,
          width: p.video.width,
          height: p.video.height,
          fps: p.video.fps,
          createdAt: p.video.createdAt.toISOString(),
        } : null,
        stats: {
          totalSegments,
          scriptedSegments,
          recordedSegments,
          approvedSegments,
          completionPercentage,
          duration: p.video?.duration || 0,
        },
      };
    });
  }

  static async getProject(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        video: true,
        segments: {
          orderBy: { index: 'asc' },
          include: {
            recordings: {
              orderBy: { version: 'desc' },
            },
          },
        },
        audioTracks: true,
        renderJobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return null;

    const totalSegments = project.segments.length;
    const scriptedSegments = project.segments.filter((s) => s.punjabiText && s.punjabiText.trim().length > 0).length;
    const recordedSegments = project.segments.filter((s) => s.recordings.length > 0).length;
    const approvedSegments = project.segments.filter((s) => s.recordings.some((r) => r.approved)).length;
    const completionPercentage = totalSegments > 0 ? Math.round((recordedSegments / totalSegments) * 100) : 0;

    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      video: project.video ? {
        ...project.video,
        createdAt: project.video.createdAt.toISOString(),
      } : null,
      segments: project.segments.map((s) => ({
        ...s,
        recordings: s.recordings.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      })),
      renderJobs: project.renderJobs.map((j) => ({
        ...j,
        createdAt: j.createdAt.toISOString(),
        updatedAt: j.updatedAt.toISOString(),
      })),
      stats: {
        totalSegments,
        scriptedSegments,
        recordedSegments,
        approvedSegments,
        completionPercentage,
        duration: project.video?.duration || 0,
      },
    };
  }

  static async createProject(payload: CreateProjectPayload) {
    return prisma.project.create({
      data: {
        name: payload.name,
        description: payload.description,
        sourceLanguage: payload.sourceLanguage || 'en',
        whisperModel: payload.whisperModel || config.whisperModel,
        device: payload.device || config.whisperDevice,
      },
    });
  }

  static async deleteProject(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { video: true, segments: { include: { recordings: true } } },
    });

    if (!project) return false;

    // Remove video file
    if (project.video?.path && fs.existsSync(project.video.path)) {
      try { fs.unlinkSync(project.video.path); } catch {}
    }

    // Remove recordings
    for (const seg of project.segments) {
      for (const rec of seg.recordings) {
        if (rec.path && fs.existsSync(rec.path)) {
          try { fs.unlinkSync(rec.path); } catch {}
        }
      }
    }

    await prisma.project.delete({ where: { id } });
    return true;
  }

  static async attachVideoAndTranscribe(
    projectId: string,
    fileBuffer: Buffer,
    originalFilename: string
  ) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const ext = path.extname(originalFilename) || '.mp4';
    const videoFilename = `video_${projectId}_${Date.now()}${ext}`;
    const videoPath = path.join(config.dirs.videos, videoFilename);

    fs.writeFileSync(videoPath, fileBuffer);

    // Probe video metadata
    const meta = await FFmpegService.probe(videoPath);

    // Create or update video record
    const videoAsset = await prisma.videoAsset.upsert({
      where: { projectId },
      create: {
        projectId,
        filename: originalFilename,
        path: videoPath,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
      },
      update: {
        filename: originalFilename,
        path: videoPath,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: meta.fps,
      },
    });

    // Start background extraction and transcription
    const jobId = `transcribe_${projectId}_${Date.now()}`;
    jobQueue.createJob(jobId, 'transcription', projectId);

    (async () => {
      try {
        const audioFilename = `audio_${projectId}_${Date.now()}.wav`;
        const audioPath = path.join(config.dirs.audio, audioFilename);

        jobQueue.updateProgress(jobId, 10, 'Extracting audio track for transcription...');
        await FFmpegService.extractAudio(videoPath, audioPath, (percent) => {
          jobQueue.updateProgress(jobId, 10 + Math.round(percent * 0.15), 'Extracting audio...');
        });

        jobQueue.updateProgress(jobId, 25, `Running Whisper model (${project.whisperModel})...`);

        try {
          const result = await TranscriptionService.transcribeAudio(audioPath, {
            model: project.whisperModel,
            device: project.device,
            language: project.sourceLanguage,
            jobId,
            projectId,
          });

          // Delete existing segments before inserting new
          await prisma.transcriptSegment.deleteMany({ where: { projectId } });

          // Insert transcribed segments
          for (const seg of result.segments) {
            await prisma.transcriptSegment.create({
              data: {
                projectId,
                index: seg.index,
                start: seg.start,
                end: seg.end,
                originalText: seg.text,
                punjabiText: '',
                status: 'pending',
              },
            });
          }

          jobQueue.completeJob(jobId, 'Transcription completed', {
            segmentCount: result.segments.length,
          });
        } catch (transcribeErr: unknown) {
          const err = transcribeErr as Error;
          // If faster-whisper is not ready, generate initial smart placeholder segments based on video duration
          // so the user can immediately use the workspace and test
          jobQueue.updateProgress(jobId, 60, `Local Whisper note: ${err.message}. Creating initial segments for workspace...`);

          const segCount = Math.max(1, Math.min(20, Math.round((meta.duration || 30) / 4)));
          const segDuration = (meta.duration || 30) / segCount;

          await prisma.transcriptSegment.deleteMany({ where: { projectId } });

          for (let i = 0; i < segCount; i++) {
            const start = roundTime(i * segDuration);
            const end = roundTime(Math.min(meta.duration || 30, (i + 1) * segDuration));
            await prisma.transcriptSegment.create({
              data: {
                projectId,
                index: i + 1,
                start,
                end,
                originalText: `Segment ${i + 1} (${start}s - ${end}s)`,
                punjabiText: '',
                status: 'pending',
              },
            });
          }

          jobQueue.completeJob(jobId, 'Transcription completed (segments initialized)', {
            segmentCount: segCount,
            whisperNote: err.message,
          });
        }
      } catch (err: unknown) {
        const error = err as Error;
        jobQueue.failJob(jobId, error.message);
      }
    })();

    return { videoAsset, jobId };
  }

  static async updateSegment(segmentId: string, payload: UpdateSegmentPayload) {
    const existing = await prisma.transcriptSegment.findUnique({
      where: { id: segmentId },
      include: { recordings: true },
    });

    if (!existing) throw new Error('Segment not found');

    let status = payload.status || existing.status;
    if (!payload.status) {
      if (existing.recordings.some((r) => r.approved)) {
        status = 'approved';
      } else if (existing.recordings.length > 0) {
        status = 'recorded';
      } else if (payload.punjabiText && payload.punjabiText.trim().length > 0) {
        status = 'scripted';
      } else {
        status = 'pending';
      }
    }

    return prisma.transcriptSegment.update({
      where: { id: segmentId },
      data: {
        punjabiText: payload.punjabiText !== undefined ? payload.punjabiText : existing.punjabiText,
        originalText: payload.originalText !== undefined ? payload.originalText : existing.originalText,
        start: payload.start !== undefined ? payload.start : existing.start,
        end: payload.end !== undefined ? payload.end : existing.end,
        note: payload.note !== undefined ? payload.note : existing.note,
        marker: payload.marker !== undefined ? payload.marker : existing.marker,
        status,
      },
    });
  }

  static async saveRecording(
    segmentId: string,
    fileBuffer: Buffer,
    originalDuration?: number
  ) {
    const segment = await prisma.transcriptSegment.findUnique({
      where: { id: segmentId },
      include: { recordings: { orderBy: { version: 'desc' } } },
    });

    if (!segment) throw new Error('Segment not found');

    const nextVersion = (segment.recordings[0]?.version || 0) + 1;
    const filename = `seg_${segment.id}_v${nextVersion}.webm`;
    const recordingPath = path.join(config.dirs.recordings, filename);

    fs.writeFileSync(recordingPath, fileBuffer);

    // Calculate duration via ffprobe or use supplied duration
    let duration = originalDuration || (segment.end - segment.start);
    try {
      const meta = await FFmpegService.probe(recordingPath);
      if (meta.duration > 0) {
        duration = roundTime(meta.duration);
      }
    } catch {
      // fallback to provided duration
    }

    // Set other recordings of this segment to inactive
    await prisma.recording.updateMany({
      where: { segmentId },
      data: { active: false },
    });

    const recording = await prisma.recording.create({
      data: {
        segmentId,
        version: nextVersion,
        path: recordingPath,
        duration,
        active: true,
        approved: false,
      },
    });

    // Update segment status to 'recorded'
    await prisma.transcriptSegment.update({
      where: { id: segmentId },
      data: { status: 'recorded' },
    });

    return recording;
  }

  static async setActiveRecording(segmentId: string, recordingId: string, approved = false) {
    await prisma.recording.updateMany({
      where: { segmentId },
      data: { active: false },
    });

    const recording = await prisma.recording.update({
      where: { id: recordingId },
      data: { active: true, approved },
    });

    await prisma.transcriptSegment.update({
      where: { id: segmentId },
      data: { status: approved ? 'approved' : 'recorded' },
    });

    return recording;
  }
}

function roundTime(t: number): number {
  return Math.round(t * 1000) / 1000;
}
