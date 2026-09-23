import type { FastifyInstance } from 'fastify';
import { jobQueue } from '../jobs/jobQueue.js';
import type { JobProgressEvent } from '@pds/shared';

export async function jobsRoutes(app: FastifyInstance) {
  // SSE stream endpoint
  app.get('/api/jobs/stream', (request, reply) => {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial ping
    reply.raw.write(': connected\n\n');

    const listener = (event: JobProgressEvent) => {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    jobQueue.on('progress', listener);

    const keepAlive = setInterval(() => {
      reply.raw.write(': ping\n\n');
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(keepAlive);
      jobQueue.off('progress', listener);
    });
  });
}
