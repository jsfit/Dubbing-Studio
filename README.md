# 🎙️ Dubbing Studio

> **A local-first, professional desktop workstation for manually creating natural, hilarious, and authentic video dubs in ANY language.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-23%2B-brightgreen.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000.svg)](https://fastify.io)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-6.0%2B-007808.svg)](https://ffmpeg.org)
[![Theme: Light](https://img.shields.io/badge/Theme-Light_Only-indigo.svg)](#design-system)
[![White-Label: Multi-Language](https://img.shields.io/badge/Languages-Universal_%26_Custom-purple.svg)](#multi-language-support)

Dubbing Studio is a white-labeled, universal video dubbing workstation engineered specifically for comedic creators, translators, localization teams, and voice actors. Instead of fighting complex, bloated timeline video editors like Premiere Pro or CapCut, Dubbing Studio optimizes for the exact dubbing loop: **Watch → Script → Speak → Accept → Advance → Render**.

---

## 🌍 Universal Multi-Language Support

Dubbing Studio is **fully language-agnostic**:
* **Any Source Language**: Transcribe English, Spanish, Japanese, French, German, Chinese, Hindi, Arabic, or auto-detect with Whisper.
* **Any Target Dubbing Language**: Dub into Spanish, Punjabi, Hindi, French, German, Japanese, Arabic, English, Italian, Portuguese, Korean, or **type your own custom dialect or language**.
* **Any Writing Script**: Full Unicode support for Latin alphabets, Cyrillic, Arabic/Persian/Shahmukhi, Devanagari, Gurmukhi, Kanji/Hiragana/Katakana, Hangul, etc.

---

## 💡 Core Philosophy

* **Human Delivery Over AI Voices**: This is **not** an AI voice cloning or synthetic TTS tool. True comedic timing and emotional delivery live in human nuance, pitch, vocal slang, and pauses. The user writes their own localized adaptation and records their own voice.
* **Local-First & Private**: Videos, voice recordings, and project files never leave your machine. No cloud uploads, no monthly credit limits, and no telemetry.
* **Strict Light Studio Aesthetics**: Designed with a clean, high-contrast Light Theme (`#f8fafc` canvas, pure `#ffffff` cards, slate borders, and vibrant status chips) optimized for clarity during long dubbing sessions.
* **Zero-Friction Keyboard Flow**: Dub an entire video using keyboard shortcuts (`Space`, `R`, `P`, `Enter`, `Esc`, Arrow keys) without reaching for the mouse.

---

## 🚀 Quick Start

### 1. Prerequisites

Ensure you have the following installed on your machine:
* **Node.js** (v20+ recommended, tested on v23.11)
* **npm** (v10+)
* **FFmpeg & ffprobe** (v6+ installed and available in `PATH`)
* **Python 3.10+** (optional, for local `faster-whisper` AI transcription)

Verify system tools:
```bash
node -v
npm -v
ffmpeg -version
ffprobe -version
```

### 2. Installation

Clone the repository and install all workspace dependencies:
```bash
git clone https://github.com/your-username/ascend_master.git dubbing-studio
cd dubbing-studio

# Install monorepo dependencies
npm install
```

### 3. Database & Environment Setup

Copy the environment file and sync the SQLite database:
```bash
cp .env.example .env
cp .env apps/api/.env
cp .env apps/web/.env.local

# Generate Prisma Client and apply SQLite schema
npm run db:generate
npm run db:push
```

### 4. Run Locally

Start both the Fastify backend and the Next.js frontend in parallel:
```bash
npm run dev
```

* **Web Dubbing Workstation**: [http://localhost:3000](http://localhost:3000)
* **Fastify API Server**: [http://localhost:4000](http://localhost:4000)
* **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🎬 Step-by-Step Example Walkthrough

Here is a real example demonstrating how to dub a video into **any language** (e.g. Spanish or Punjabi):

```
+-----------------------------------------------------------------------------------+
| Dubbing Studio  [Dub: Spanish]                                     [Render Video] |
|----------------------------------------+------------------------------------------|
|                                        | Segment #001 (00:00.0 -> 00:03.2)        |
|                                        |                                          |
|                VIDEO                   | ORIGINAL DIALOGUE                        |
|         [ 640 x 360 Player ]           | "What did you just do to the vase?!"     |
|                                        |                                          |
|  [> Play]  [00:01.2 / 00:06.0]  [1.0x] | SPANISH SCRIPT                           |
|----------------------------------------| +--------------------------------------+ |
| Recording Station: Ready               | | ¡¿Pero qué le acabas de hacer al     | |
| [ Countdown: 2s ] [Record Line (R)]    | | jarrón, pedazo de monstruo?!         | |
|----------------------------------------| +--------------------------------------+ |
| Waveform: Dual Timing Comparison       | Mood: 😂 Punchline                       |
| Original:  ||||||||||.....||||||       | [> Play Orig] [🎙 Re-record] [✓ Approved] |
+-----------------------------------------------------------------------------------+
```

### Step 1: Create a Project & Pick Your Languages
1. Open [http://localhost:3000](http://localhost:3000) and click **+ New Project**.
2. Enter a project title (e.g., `Funny Cat Investigation - Spanish Dub`).
3. Drag & drop your video file (MP4, WebM, MOV, or MKV).
4. Choose **Original Audio Language** (e.g. `English` or `Auto-detect`).
5. Choose **Target Dubbing Language** (e.g. `Spanish`, `French`, `German`, `Punjabi`, `Hindi`, `Japanese`, or select `Custom` to enter any dialect).
6. Click **Create Project**. The backend extracts audio (16kHz WAV), probes video metadata with `ffprobe`, runs Whisper transcription, and splits the video into sentence-level segments.

### Step 2: Write Your Localized Dialogue
Inside the workstation, select any segment to jump the video directly to its start time:
* **Original English Dialogue**: *"What are you doing here?"*
* **Adapted Spanish Line**: `¡¿Pero qué estás haciendo tú aquí?!`
* **Adapted Punjabi Line**: `Oye tu ethe kadi de chaul kaddan dya ain?`
* Add optional mood markers: `😂 Punchline`, `😡 Angry`, `😱 Shock`, or `😎 Sarcastic`.
* Changes auto-save automatically in the background.

### Step 3: Record Voice with Guided Pre-Roll
1. Press `R` (or click **Record Line**).
2. A 2-second visual countdown (`3.. 2.. 1..`) prepares your delivery.
3. Original video plays with audio automatically ducked (to 20% or muted) so you hear original pacing without microphone bleed.
4. Speak your adapted line into your microphone.
5. Recording automatically stops at the segment boundary (Guided mode).

### Step 4: Preview & Compare Waveforms
1. Listen back to your recording preview.
2. Inspect the **Audio Waveform Comparison** panel: see your recorded speech waveform aligned against the original dialogue timing.
3. If delivery was great, press `Enter` to **Accept** — the recording is stored versioned (`v1`), the segment turns green (`✓ Approved`), and the workstation automatically advances to the next unrecorded segment.
4. If you flubbed a line, press `R` to instantly re-record. All versions are safely preserved in history.

### Step 5: Render Finished MP4
1. Click **Render Video** in the top navigation.
2. The pre-render validator checks for any missing recordings.
3. Configure your mix:
   - **Original Dialogue Volume**: `0%` (replace completely) or `15%` (background ambient trace).
   - **Dubbed Voice Volume**: `100%`.
   - **Broadcast Loudness Normalization**: Enabled (`-16 LUFS` EBU R128).
4. Click **Render Dubbed Video**.
5. Watch the live Server-Sent Events (SSE) progress bar as FFmpeg mixes the audio with exact millisecond `adelay` alignment and muxes it with the original video.
6. Preview the output in the modal and click **Download Finished MP4**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| <kbd>Space</kbd> | **Play / Pause** | Toggle video playback |
| <kbd>R</kbd> | **Record / Re-record** | Start guided countdown or redo recording |
| <kbd>P</kbd> | **Preview** | Play current segment range from start |
| <kbd>Enter</kbd> | **Accept** | Save recording version and auto-advance to next line |
| <kbd>Esc</kbd> | **Stop / Cancel** | Stop live recording or dismiss modal |
| <kbd>↑</kbd> or <kbd>←</kbd> | **Previous Segment** | Navigate to preceding dialogue line |
| <kbd>↓</kbd> or <kbd>→</kbd> | **Next Segment** | Navigate to subsequent dialogue line |

> *Note: Shortcuts are safely suspended while typing inside the script editor.*

---

## 🏗️ Architecture & Monorepo Structure

```
dubbing-studio/
├── packages/
│   └── shared/                 # Shared TypeScript models and DTO interfaces
│       ├── src/
│       │   ├── index.ts        # Project, Segment, Recording, and RenderJob types
│       │   └── ...
│
├── apps/
│   ├── api/                    # Fastify Backend Service
│   │   ├── prisma/
│   │   │   └── schema.prisma   # SQLite database models
│   │   └── src/
│   │       ├── config.ts       # Storage paths, FFmpeg settings
│   │       ├── index.ts        # Fastify server entry
│   │       ├── jobs/
│   │       │   └── jobQueue.ts # In-process job runner & SSE broadcast
│   │       ├── python/
│   │       │   └── transcribe.py # faster-whisper CLI runner
│   │       ├── routes/         # Projects, Segments, Recordings, Render, Jobs
│   │       └── services/
│   │           ├── ffmpeg.service.ts         # ffprobe, audio extraction, audio mix
│   │           ├── transcription.service.ts  # FasterWhisperProvider abstraction
│   │           ├── project.service.ts        # Database & storage orchestration
│   │           └── render.service.ts         # Video composition engine
│   │
│   └── web/                    # Next.js 15 Dubbing Workstation
│       ├── app/
│       │   ├── page.tsx        # Dashboard screen (Projects grid, creation modal)
│       │   ├── projects/[id]/page.tsx # Dubbing Workstation screen
│       │   └── globals.css     # Light theme tokens & utilities
│       ├── components/
│       │   ├── common/Header.tsx
│       │   ├── dashboard/      # ProjectCard, CreateProjectModal
│       │   └── workspace/      # VideoPlayer, ScriptPanel, RecordingControls,
│       │                       # WaveformComparison, RenderModal, ShortcutsModal
│       ├── stores/             # Zustand stores: projectStore, playerStore, recordingStore
│       └── lib/                # ApiClient, AudioRecorder (Web Audio API)
│
└── storage/                    # Local media assets directory
    ├── projects/
    ├── videos/                 # Original ingested MP4 files
    ├── audio/                  # Extracted 16kHz WAV tracks for Whisper
    ├── recordings/             # Versioned user voice recordings (seg_..._v1.webm)
    └── renders/                # Final exported dubbed MP4 files
```

---

## 📡 REST & Real-time API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status |
| `GET` | `/api/projects` | List all projects with progress stats |
| `POST` | `/api/projects` | Create a new dubbing project (source & target language) |
| `GET` | `/api/projects/:id` | Fetch full project with video, segments, and recordings |
| `DELETE` | `/api/projects/:id` | Delete project and clean up storage files |
| `POST` | `/api/projects/:id/video` | Upload video file and trigger background extraction/transcription |
| `PUT` | `/api/projects/:id/segments/:segmentId` | Update dub script text, timings, note, or comedy marker |
| `POST` | `/api/projects/:id/segments` | Add a custom transcript segment manually |
| `DELETE` | `/api/projects/:id/segments/:segmentId` | Delete a transcript segment |
| `GET` | `/api/projects/:id/export/srt` | Download subtitles in standard `.srt` format |
| `POST` | `/api/projects/:id/segments/:segmentId/recording` | Upload user audio recording (creates next version) |
| `PUT` | `/api/projects/:id/segments/:segmentId/recordings/:recId/active` | Switch active/approved recording version |
| `POST` | `/api/projects/:id/render` | Trigger FFmpeg render with audio mix options |
| `GET` | `/api/projects/:id/render/:renderId` | Inspect render job status |
| `GET` | `/api/jobs/stream` | Server-Sent Events (SSE) stream for real-time progress |
| `GET` | `/storage/*` | Static file delivery for videos, waveforms, and renders |

---

## 🎨 Design System: Light Studio

The studio interface is strictly styled for high legibility in light environments:
* **Background**: Slate-50 (`#f8fafc`)
* **Surfaces**: Pure White (`#ffffff`) with subtle 1px border (`#e2e8f0`)
* **Typography**: Slate-900 (`#0f172a`) for high contrast readability
* **Brand Primary**: Indigo-600 (`#4f46e5`) with soft indigo badges
* **Status Badges**:
  - `✓ Approved`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
  - `🎙 Recorded`: Sky (`bg-sky-50 text-sky-700 border-sky-200`)
  - `✏ Script Ready`: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
  - `○ Empty`: Slate (`bg-slate-100 text-slate-500 border-slate-200`)
  - `● Live Recording`: Rose (`bg-rose-50 text-rose-700 border-rose-200 animate-pulse`)

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
