import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { config } from './config.js';
import { projectRoutes } from './routes/projects.routes.js';
import { segmentRoutes } from './routes/segments.routes.js';
import { recordingRoutes } from './routes/recordings.routes.js';
import { renderRoutes } from './routes/render.routes.js';
import { jobsRoutes } from './routes/jobs.routes.js';

const app = Fastify({
  logger: true,
});

async function main() {
  // CORS
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Multipart uploads (up to 2GB videos)
  await app.register(multipart, {
    limits: {
      fileSize: config.maxUploadSizeMb * 1024 * 1024,
    },
  });

  // Static storage files (videos, wavs, recordings, renders)
  await app.register(fastifyStatic, {
    root: config.storagePath,
    prefix: '/storage/',
    decorateReply: false,
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    app: config.appName,
    time: new Date().toISOString(),
  }));

  // Application Routes
  await app.register(projectRoutes);
  await app.register(segmentRoutes);
  await app.register(recordingRoutes);
  await app.register(renderRoutes);
  await app.register(jobsRoutes);

  try {
    await app.listen({ port: config.apiPort, host: config.host });
    console.log(`[PDS API] Server running at http://${config.host}:${config.apiPort}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
