import type { FastifyInstance } from 'fastify';
import { ProjectService } from '../services/project.service.js';

export async function projectRoutes(app: FastifyInstance) {
  // List all projects
  app.get('/api/projects', async () => {
    const projects = await ProjectService.listProjects();
    return { success: true, projects };
  });

  // Create project
  app.post('/api/projects', async (request, reply) => {
    const body = request.body as {
      name: string;
      description?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      whisperModel?: string;
      device?: string;
    };

    if (!body.name || body.name.trim().length === 0) {
      return reply.status(400).send({ error: 'Project name is required' });
    }

    const project = await ProjectService.createProject(body);
    return reply.status(201).send({ success: true, project });
  });

  // Get single project
  app.get('/api/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await ProjectService.getProject(id);
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    return { success: true, project };
  });

  // Delete project
  app.delete('/api/projects/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await ProjectService.deleteProject(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    return { success: true, message: 'Project deleted' };
  });

  // Upload video and start transcription
  app.post('/api/projects/:id/video', async (request, reply) => {
    const { id } = request.params as { id: string };

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No video file provided' });
    }

    const buffer = await data.toBuffer();
    const originalFilename = data.filename || 'uploaded_video.mp4';

    try {
      const result = await ProjectService.attachVideoAndTranscribe(id, buffer, originalFilename);
      return reply.status(200).send({
        success: true,
        videoAsset: result.videoAsset,
        jobId: result.jobId,
        message: 'Video uploaded, extraction & transcription started in background',
      });
    } catch (err: unknown) {
      const error = err as Error;
      return reply.status(500).send({ error: error.message });
    }
  });
}
