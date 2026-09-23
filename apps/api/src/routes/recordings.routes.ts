import type { FastifyInstance } from 'fastify';
import fs from 'node:fs';
import { prisma } from '../prisma.js';
import { ProjectService } from '../services/project.service.js';

export async function recordingRoutes(app: FastifyInstance) {
  // Upload audio recording for a segment
  app.post('/api/projects/:id/segments/:segmentId/recording', async (request, reply) => {
    const { segmentId } = request.params as { id: string; segmentId: string };

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No audio file provided' });
    }

    const buffer = await data.toBuffer();
    const durationField = (data.fields?.duration as { value?: string })?.value;
    const duration = durationField ? Number.parseFloat(durationField) : undefined;

    try {
      const recording = await ProjectService.saveRecording(segmentId, buffer, duration);
      return reply.status(201).send({
        success: true,
        recording: {
          ...recording,
          createdAt: recording.createdAt.toISOString(),
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message });
    }
  });

  // Set active recording version / approve
  app.put('/api/projects/:id/segments/:segmentId/recordings/:recordingId/active', async (request, reply) => {
    const { segmentId, recordingId } = request.params as {
      id: string;
      segmentId: string;
      recordingId: string;
    };
    const body = (request.body || {}) as { approved?: boolean };

    try {
      const updated = await ProjectService.setActiveRecording(segmentId, recordingId, !!body.approved);
      return { success: true, recording: updated };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message });
    }
  });

  // Delete recording
  app.delete('/api/projects/:id/recordings/:recordingId', async (request, reply) => {
    const { recordingId } = request.params as { recordingId: string };

    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
    if (!recording) return reply.status(404).send({ error: 'Recording not found' });

    if (recording.path && fs.existsSync(recording.path)) {
      try { fs.unlinkSync(recording.path); } catch {}
    }

    await prisma.recording.delete({ where: { id: recordingId } });
    return { success: true, message: 'Recording deleted' };
  });
}
