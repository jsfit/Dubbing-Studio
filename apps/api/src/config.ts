import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const rootDir = path.resolve(process.cwd(), '../..');
const storageRoot = path.resolve(rootDir, process.env.STORAGE_PATH || './storage');

export const config = {
  appName: process.env.APP_NAME || 'Punjabi Dubbing Studio',
  apiPort: Number.parseInt(process.env.API_PORT || '4000', 10),
  webPort: Number.parseInt(process.env.WEB_PORT || '3000', 10),
  host: process.env.API_HOST || '0.0.0.0',
  storagePath: storageRoot,
  dirs: {
    projects: path.join(storageRoot, 'projects'),
    videos: path.join(storageRoot, 'videos'),
    audio: path.join(storageRoot, 'audio'),
    recordings: path.join(storageRoot, 'recordings'),
    renders: path.join(storageRoot, 'renders'),
    temp: path.join(storageRoot, 'temp'),
  },
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH || 'ffprobe',
  whisperModel: process.env.DEFAULT_WHISPER_MODEL || 'small',
  whisperDevice: process.env.WHISPER_DEVICE || 'auto',
  maxUploadSizeMb: Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB || '2048', 10),
};

// Ensure all storage directories exist
for (const dir of Object.values(config.dirs)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
