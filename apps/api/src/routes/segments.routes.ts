import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { ProjectService } from '../services/project.service.js';
import type { UpdateSegmentPayload } from '@pds/shared';

export async function segmentRoutes(app: FastifyInstance) {
  // Update segment (Punjabi text, status, note, timings)
  app.put('/api/projects/:id/segments/:segmentId', async (request, reply) => {
    const { segmentId } = request.params as { id: string; segmentId: string };
    const body = request.body as UpdateSegmentPayload;

    try {
      const updated = await ProjectService.updateSegment(segmentId, body);
      return { success: true, segment: updated };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message });
    }
  });

  // Create manual segment
  app.post('/api/projects/:id/segments', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      start: number;
      end: number;
      originalText?: string;
      punjabiText?: string;
    };

    if (body.start === undefined || body.end === undefined || body.end <= body.start) {
      return reply.status(400).send({ error: 'Valid start and end timestamps are required (end > start)' });
    }

    const count = await prisma.transcriptSegment.count({ where: { projectId: id } });

    const segment = await prisma.transcriptSegment.create({
      data: {
        projectId: id,
        index: count + 1,
        start: body.start,
        end: body.end,
        originalText: body.originalText || '',
        punjabiText: body.punjabiText || '',
        status: body.punjabiText ? 'scripted' : 'pending',
      },
      include: { recordings: true },
    });

    return reply.status(201).send({ success: true, segment });
  });

  // Delete segment
  app.delete('/api/projects/:id/segments/:segmentId', async (request, reply) => {
    const { segmentId } = request.params as { id: string; segmentId: string };

    try {
      await prisma.transcriptSegment.delete({ where: { id: segmentId } });
      return { success: true, message: 'Segment deleted' };
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message });
    }
  });

  // Export SRT
  app.get('/api/projects/:id/export/srt', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await prisma.project.findUnique({
      where: { id },
      include: { segments: { orderBy: { index: 'asc' } } },
    });

    if (!project) return reply.status(404).send({ error: 'Project not found' });

    let srtContent = '';
    project.segments.forEach((seg, idx) => {
      const text = seg.punjabiText || seg.originalText;
      srtContent += `${idx + 1}\n`;
      srtContent += `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n`;
      srtContent += `${text}\n\n`;
    });

    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${project.name.replace(/\s+/g, '_')}_punjabi.srt"`);
    return reply.send(srtContent);
  });
}

function formatSrtTime(sec: number): string {
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
