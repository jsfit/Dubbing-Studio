import type { FastifyInstance } from 'fastify';
import { RenderService } from '../services/render.service.js';
import type { RenderOptionsPayload } from '@pds/shared';

export async function renderRoutes(app: FastifyInstance) {
  // Start render job
  app.post('/api/projects/:id/render', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as RenderOptionsPayload;

    try {
      const result = await RenderService.startRender(id, body);
      return reply.status(202).send({
        success: true,
        renderJob: {
          ...result.renderJob,
          createdAt: result.renderJob.createdAt.toISOString(),
          updatedAt: result.renderJob.updatedAt.toISOString(),
        },
        validation: result.validation,
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(400).send({ error: error.message });
    }
  });

  // Check render job status
  app.get('/api/projects/:id/render/:renderId', async (request, reply) => {
    const { renderId } = request.params as { renderId: string };
    const job = await RenderService.getRenderJob(renderId);

    if (!job) return reply.status(404).send({ error: 'Render job not found' });

    return {
      success: true,
      renderJob: {
        ...job,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
    };
  });
}
