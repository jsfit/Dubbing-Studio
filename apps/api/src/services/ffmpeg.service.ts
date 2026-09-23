import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';

export interface VideoMetadata {
  duration: number;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio: boolean;
}

export interface RenderSegmentInput {
  recordingPath: string;
  start: number; // in seconds
  duration: number;
}

export interface RenderVideoOptions {
  videoPath: string;
  outputPath: string;
  recordings: RenderSegmentInput[];
  originalAudioVolume?: number; // 0 to 1
  voiceVolume?: number;         // 0 to 2
  normalizeLoudness?: boolean;
  onProgress?: (progress: number) => void;
}

export class FFmpegService {
  /**
   * Probes video file to extract duration, resolution, fps, and audio tracks.
   */
  static async probe(filePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ];

      const proc = spawn(config.ffprobePath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }

        try {
          const info = JSON.parse(stdout);
          const videoStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
          const audioStream = info.streams?.find((s: { codec_type: string }) => s.codec_type === 'audio');

          let duration = Number.parseFloat(info.format?.duration || '0');
          if (!duration && videoStream?.duration) {
            duration = Number.parseFloat(videoStream.duration);
          }

          let fps: number | undefined;
          if (videoStream?.r_frame_rate) {
            const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
            if (den && den > 0) {
              fps = Math.round((num / den) * 100) / 100;
            }
          }

          resolve({
            duration: duration || 0,
            width: videoStream?.width,
            height: videoStream?.height,
            fps,
            hasAudio: !!audioStream,
          });
        } catch (err) {
          reject(new Error(`Failed to parse ffprobe output: ${err}`));
        }
      });
    });
  }

  /**
   * Extracts audio from video to 16kHz mono WAV suitable for Whisper.
   */
  static async extractAudio(
    videoPath: string,
    outputPath: string,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const meta = await this.probe(videoPath);
    const totalDuration = meta.duration || 1;

    return new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        outputPath,
      ];

      const proc = spawn(config.ffmpegPath, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;

        if (onProgress) {
          const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (match) {
            const hours = Number.parseInt(match[1], 10);
            const mins = Number.parseInt(match[2], 10);
            const secs = Number.parseFloat(match[3]);
            const currentTime = hours * 3600 + mins * 60 + secs;
            const percent = Math.min(99, Math.round((currentTime / totalDuration) * 100));
            onProgress(percent);
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100);
          resolve(outputPath);
        } else {
          reject(new Error(`Audio extraction failed with code ${code}: ${stderr}`));
        }
      });
    });
  }

  /**
   * Renders the dubbed video combining original video and placed Punjabi recordings.
   */
  static async renderDubbedVideo(options: RenderVideoOptions): Promise<string> {
    const {
      videoPath,
      outputPath,
      recordings,
      originalAudioVolume = 0,
      voiceVolume = 1.0,
      normalizeLoudness = true,
      onProgress,
    } = options;

    const meta = await this.probe(videoPath);
    const totalDuration = meta.duration || 1;

    // Filter valid recordings that actually exist on disk
    const validRecordings = recordings.filter(
      (r) => fs.existsSync(r.recordingPath) && r.duration > 0
    );

    const args: string[] = ['-y', '-i', videoPath];

    // Append input for each recording
    for (const rec of validRecordings) {
      args.push('-i', rec.recordingPath);
    }

    const filterGraph: string[] = [];

    if (validRecordings.length === 0) {
      // No recordings: simply adjust original audio or keep silent
      if (originalAudioVolume > 0 && meta.hasAudio) {
        filterGraph.push(`[0:a]volume=${originalAudioVolume}[outa]`);
      } else {
        // Generate silent audio
        args.push('-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000:d=${totalDuration}`);
        filterGraph.push(`[${validRecordings.length + 1}:a]apad=whole_dur=${totalDuration}[outa]`);
      }
    } else {
      // Delay each recording to its start timestamp (in milliseconds)
      const delayedTags: string[] = [];
      validRecordings.forEach((rec, idx) => {
        const inputIdx = idx + 1;
        const delayMs = Math.max(0, Math.round(rec.start * 1000));
        const outTag = `delayed_${inputIdx}`;
        filterGraph.push(
          `[${inputIdx}:a]volume=${voiceVolume},adelay=${delayMs}|${delayMs}[${outTag}]`
        );
        delayedTags.push(`[${outTag}]`);
      });

      let mixedVoiceTag = 'voice_mix';
      if (delayedTags.length === 1) {
        mixedVoiceTag = delayedTags[0].replace(/[[\]]/g, '');
      } else {
        filterGraph.push(
          `${delayedTags.join('')}amix=inputs=${delayedTags.length}:dropout_transition=0:normalize=0[${mixedVoiceTag}]`
        );
      }

      if (originalAudioVolume > 0 && meta.hasAudio) {
        filterGraph.push(`[0:a]volume=${originalAudioVolume}[orig_ducked]`);
        filterGraph.push(
          `[orig_ducked][${mixedVoiceTag}]amix=inputs=2:dropout_transition=0:normalize=0[combined_audio]`
        );
        if (normalizeLoudness) {
          filterGraph.push(`[combined_audio]loudnorm=I=-16:TP=-1.5:LRA=11[outa]`);
        } else {
          filterGraph.push(`[combined_audio]volume=1.0[outa]`);
        }
      } else {
        if (normalizeLoudness) {
          filterGraph.push(`[${mixedVoiceTag}]loudnorm=I=-16:TP=-1.5:LRA=11[outa]`);
        } else {
          filterGraph.push(`[${mixedVoiceTag}]volume=1.0[outa]`);
        }
      }
    }

    args.push('-filter_complex', filterGraph.join(';'));
    args.push('-map', '0:v');
    args.push('-map', '[outa]');
    args.push('-c:v', 'libx264');
    args.push('-preset', 'veryfast');
    args.push('-crf', '22');
    args.push('-c:a', 'aac');
    args.push('-b:a', '192k');
    args.push('-shortest');
    args.push(outputPath);

    return new Promise((resolve, reject) => {
      const proc = spawn(config.ffmpegPath, args);
      let stderr = '';

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;

        if (onProgress) {
          const match = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (match) {
            const hours = Number.parseInt(match[1], 10);
            const mins = Number.parseInt(match[2], 10);
            const secs = Number.parseFloat(match[3]);
            const currentTime = hours * 3600 + mins * 60 + secs;
            const percent = Math.min(99, Math.round((currentTime / totalDuration) * 100));
            onProgress(percent);
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100);
          resolve(outputPath);
        } else {
          reject(new Error(`Video rendering failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
}
