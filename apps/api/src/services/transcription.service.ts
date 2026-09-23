import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';
import { jobQueue } from '../jobs/jobQueue.js';

export interface RawSegment {
  index: number;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionOptions {
  model?: string;
  device?: string;
  language?: string;
  jobId?: string;
  projectId?: string;
}

export interface TranscriptionResult {
  language?: string;
  duration?: number;
  segments: RawSegment[];
}

export interface TranscriptionProvider {
  name: string;
  transcribe(audioPath: string, options: TranscriptionOptions): Promise<TranscriptionResult>;
}

export class FasterWhisperProvider implements TranscriptionProvider {
  name = 'faster-whisper';

  private findPythonBinary(): string {
    const candidates = [
      path.resolve(process.cwd(), '../../.venv/bin/python'),
      path.resolve(process.cwd(), '.venv/bin/python'),
      path.resolve(process.cwd(), '../../venv/bin/python'),
      'python3',
      'python',
    ];

    for (const candidate of candidates) {
      if (candidate.startsWith('/') && fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return 'python3';
  }

  async transcribe(audioPath: string, options: TranscriptionOptions): Promise<TranscriptionResult> {
    const pythonBin = this.findPythonBinary();
    const scriptPath = path.resolve(process.cwd(), 'src/python/transcribe.py');

    const model = options.model || config.whisperModel;
    const device = options.device || config.whisperDevice;
    const language = options.language || 'en';

    const args = [
      scriptPath,
      '--audio', audioPath,
      '--model', model,
      '--device', device,
    ];

    if (language && language !== 'auto') {
      args.push('--language', language);
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(pythonBin, args);
      let stderr = '';
      const segments: RawSegment[] = [];
      let finalResult: TranscriptionResult | null = null;

      proc.stdout.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const data = JSON.parse(trimmed);
            if (data.event === 'status') {
              if (options.jobId) {
                jobQueue.updateProgress(options.jobId, 5, data.message);
              }
            } else if (data.event === 'segment') {
              segments.push(data.segment);
              if (options.jobId) {
                jobQueue.updateProgress(options.jobId, data.progress, `Transcribing: "${data.segment.text}"`, {
                  segmentCount: segments.length,
                });
              }
            } else if (data.event === 'complete') {
              finalResult = {
                language: data.language,
                duration: data.duration,
                segments: data.segments || segments,
              };
            }
          } catch {
            // Non-JSON log line
          }
        }
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && finalResult) {
          resolve(finalResult);
        } else if (code === 0 && segments.length > 0) {
          resolve({ segments });
        } else {
          // If faster-whisper failed (e.g. missing dependency), provide an informative message
          let errMsg = `Transcription failed (code ${code}): ${stderr}`;
          try {
            const parsed = JSON.parse(stderr.trim());
            if (parsed.error) errMsg = parsed.error;
          } catch {
            // Raw stderr
          }
          reject(new Error(errMsg));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn python for transcription: ${err.message}`));
      });
    });
  }
}

export class TranscriptionService {
  private static provider: TranscriptionProvider = new FasterWhisperProvider();

  static setProvider(provider: TranscriptionProvider) {
    this.provider = provider;
  }

  static async transcribeAudio(audioPath: string, options: TranscriptionOptions): Promise<TranscriptionResult> {
    return this.provider.transcribe(audioPath, options);
  }
}
