# Punjabi Dubbing Studio — AGENTS.md

## 1. Project Overview

Build a local-first web application called **Punjabi Dubbing Studio**.

The application is designed for manually creating funny/natural Punjabi dubs of existing videos.

The user provides:

1. Original video
2. Original audio/transcript
3. Their own Punjabi translation/adaptation
4. Their own recorded Punjabi voice

The application helps the user synchronize everything sentence-by-sentence and finally produces a dubbed video.

The application is NOT an AI voice-dubbing application.

The user wants to:

* watch the original video
* see the original transcript with timestamps
* write a Punjabi script beside each transcript segment
* jump between transcript segments
* record their own voice for each segment
* preview each recorded segment
* redo recordings easily
* automatically synchronize recorded audio with the original video
* add optional sound effects/music
* generate the final dubbed video using FFmpeg

The application should feel like a **simple professional dubbing workstation**, not a complicated video editor.

---

# 2. Core User Workflow

The primary workflow is:

```text
Create Project
      ↓
Import Video
      ↓
Extract Audio
      ↓
Generate Transcript
      ↓
Review / Correct Transcript
      ↓
Write Punjabi Script
      ↓
Select Segment
      ↓
Play Original Segment
      ↓
Record Punjabi Voice
      ↓
Preview Recording
      ↓
Accept / Re-record
      ↓
Move to Next Segment
      ↓
Review Entire Dub
      ↓
Add SFX / Music if required
      ↓
Render Final Video
      ↓
Export MP4
```

The application should optimize this workflow above everything else.

---

# 3. Technology Stack

## Frontend

Use:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Zustand for local application state
* HTML5 `<video>` for video playback
* Web Audio API / MediaRecorder API for recording
* WaveSurfer.js or equivalent waveform library
* React Hook Form where forms are needed

Do NOT introduce unnecessary UI frameworks.

Prefer a clean modern dark UI.

---

## Backend

Use:

* Node.js
* TypeScript
* Fastify or Express

Preferred:

```text
Node.js + Fastify + TypeScript
```

Backend responsibilities:

* project management
* file management
* video metadata
* audio extraction
* transcription jobs
* FFmpeg processing
* final rendering
* export management

---

## Database

For MVP:

Use SQLite.

Preferred:

```text
SQLite + Prisma
```

Do NOT use MongoDB for the MVP.

The application is primarily a local desktop-style workflow and does not need distributed database infrastructure.

---

## AI Transcription

Use:

```text
faster-whisper
```

The transcription engine should run locally.

The user should be able to select:

```text
tiny
base
small
medium
large-v3
```

Default:

```text
small
```

Allow configuration through settings.

The system should support GPU acceleration when CUDA is available.

The application should also work on CPU.

---

## Video Processing

Use:

```text
FFmpeg
ffprobe
```

FFmpeg is the main media-processing engine.

Do NOT implement custom video encoding.

---

# 4. Target Hardware

The application should work well on:

* Ubuntu
* Windows
* macOS

Primary development/testing environment:

```text
Ubuntu
RTX 2060 Super
8 GB VRAM
40 GB RAM
```

Design the transcription pipeline to take advantage of the RTX 2060 Super when CUDA is available.

---

# 5. Application Structure

Recommended structure:

```text
punjabi-dubbing-studio/

├── AGENTS.md
├── README.md
├── package.json
├── docker-compose.yml
├── .env.example
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── lib/
│   │   └── types/
│   │
│   └── api/
│       ├── src/
│       │   ├── routes/
│       │   ├── services/
│       │   ├── jobs/
│       │   ├── ffmpeg/
│       │   ├── transcription/
│       │   └── storage/
│
├── packages/
│   ├── shared/
│   └── types/
│
├── prisma/
│   └── schema.prisma
│
├── storage/
│   ├── projects/
│   ├── videos/
│   ├── audio/
│   ├── recordings/
│   ├── renders/
│   └── temp/
│
└── scripts/
```

---

# 6. Main Screens

The application should have these screens:

## Dashboard

Display:

* projects
* create project
* import project
* recent projects
* project duration
* number of segments
* completion percentage

Example:

```text
Punjabi Dubbing Studio

[ + New Project ]

Recent Projects

Funny Video #1
12:34
42 / 87 segments completed

Funny Video #2
08:12
87 / 87 segments completed

Funny Video #3
21:44
12 / 156 segments completed
```

---

# 7. Create Project

User can:

* select video
* enter project name
* choose transcription language
* select Whisper model
* select transcription device

Example:

```text
Project Name:
Funny Punjabi Dub #01

Video:
[ Select Video ]

Transcript Language:
[ English ]

Whisper Model:
[ Small ]

Device:
[ CUDA ]

[ Create Project ]
```

---

# 8. Main Dubbing Workspace

This is the most important screen.

Layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ Punjabi Dubbing Studio                    Save   Export       │
├─────────────────────────┬─────────────────────────────────────┤
│                         │ Segment 14 / 87                     │
│                         │                                     │
│                         │ ORIGINAL                            │
│                         │ What are you doing here?            │
│       VIDEO             │                                     │
│                         │ PUNJABI                             │
│                         │ ┌─────────────────────────────────┐ │
│                         │ │ Oye tu ethe ki kari jana ain?   │ │
│                         │ └─────────────────────────────────┘ │
│                         │                                     │
│                         │ [▶ Play] [🎙 Record] [▶ Preview]   │
│                         │ [↻ Re-record] [✓ Accept]            │
├─────────────────────────┴─────────────────────────────────────┤
│                                                               │
│ Transcript / Script Timeline                                  │
│                                                               │
│ 00:00  What are you doing?              ✓                     │
│ 00:05  Where are you going?             ✓                     │
│ 00:09  Come here!                       🎙                    │
│ 00:14  What happened?                   ○                     │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Waveform                                                     │
│ ███████████████████████████████████████████████████████████ │
└───────────────────────────────────────────────────────────────┘
```

---

# 9. Video Player

The video player must support:

* play
* pause
* seek
* volume
* fullscreen
* playback speed
* current time
* duration

Playback speed options:

```text
0.5x
0.75x
1x
1.25x
1.5x
2x
```

Keyboard:

```text
Space      Play / Pause
←          Previous segment
→          Next segment
↑          Previous segment
↓          Next segment
R          Record
P          Preview recording
Enter      Accept recording
Esc        Stop recording
```

Keyboard shortcuts must not trigger while the user is typing in a text field.

---

# 10. Transcript

The transcript is segmented.

Each segment contains:

```ts
interface TranscriptSegment {
  id: string;
  index: number;
  start: number;
  end: number;
  originalText: string;
  punjabiText: string;
  status: "pending" | "recorded" | "approved";
  recordingPath?: string;
  recordingDuration?: number;
}
```

Example:

```json
{
  "id": "segment-001",
  "index": 1,
  "start": 0,
  "end": 4.2,
  "originalText": "What are you doing?",
  "punjabiText": "Oye tu ki kari jana ain?",
  "status": "approved",
  "recordingPath": "recordings/segment-001.wav"
}
```

---

# 11. Transcript UI

Each transcript segment should display:

```text
┌──────────────────────────────────────────────────────────┐
│ 00:12.400 → 00:17.800                         ✓ Recorded │
│                                                          │
│ ORIGINAL                                                 │
│ What are you doing here?                                 │
│                                                          │
│ PUNJABI                                                  │
│ Oye tu ethe ki kari jana ain?                            │
│                                                          │
│ [▶ Play] [🎙 Record] [▶ Preview] [↻ Re-record]          │
└──────────────────────────────────────────────────────────┘
```

Clicking a segment must:

1. make it active
2. seek video to segment start
3. visually highlight it
4. optionally scroll it into view

---

# 12. Automatic Segment Highlighting

As video plays:

```text
currentTime >= segment.start
AND
currentTime < segment.end
```

the segment becomes active.

Example:

```text
Video time = 00:13.2

00:00–00:05  ✓
00:05–00:09  ✓
00:09–00:14  ACTIVE
00:14–00:18  ○
```

The active segment should automatically scroll into view.

---

# 13. Punjabi Script Editor

Each segment has an editable Punjabi field.

Requirements:

* multiline textarea
* autosave
* undo/redo
* character count
* optional spellcheck
* Unicode support
* Punjabi Shahmukhi and Gurmukhi should not be restricted

Do NOT automatically translate the user's text.

The user is intentionally writing/adapting the Punjabi script themselves.

---

# 14. Recording System

The user records their own voice.

Use:

```text
MediaRecorder API
```

Preferred format:

```text
audio/webm
```

Convert to WAV or AAC/Opus using FFmpeg when required.

Recording workflow:

```text
Click Record
      ↓
3
2
1
      ↓
Play original segment
      ↓
User speaks Punjabi
      ↓
Segment ends
      ↓
Recording stops
      ↓
Preview
      ↓
Accept / Re-record
```

The application should support two recording modes.

## Mode A — Guided Recording

Automatically:

1. seek to segment start
2. countdown
3. play original
4. start recording
5. stop recording at segment end

## Mode B — Free Recording

User can:

* start recording manually
* stop manually
* record longer than original segment
* trim afterward

Default:

```text
Guided Recording
```

---

# 15. Pre-roll

Before recording:

```text
3
2
1
```

Configurable:

```text
0 sec
1 sec
2 sec
3 sec
```

Default:

```text
2 seconds
```

---

# 16. Original Audio During Recording

The user should be able to configure:

```text
Original audio during recording:

[✓] Play original audio
[ ] Reduce original audio
[ ] Mute original audio
```

If reduced:

```text
Original audio = 20%
Microphone = 100%
```

This allows the user to hear the original dialogue while dubbing.

---

# 17. Microphone Settings

Settings must include:

```text
Microphone:
[ Default System Microphone ]

Input volume:
[ slider ]

Monitoring:
[ ON / OFF ]

Noise suppression:
[ ON / OFF ]

Automatic gain:
[ ON / OFF ]
```

Do not process the user's voice destructively during recording.

Keep the original recording.

---

# 18. Recording Storage

Never overwrite an existing recording immediately.

Use versioned recordings:

```text
segment-001-v1.webm
segment-001-v2.webm
segment-001-v3.webm
```

The user can select which recording is active.

Example:

```text
Recording History

v1  00:04.2  12:30 PM
v2  00:04.5  12:34 PM
v3  00:04.1  12:36 PM  ✓ Active
```

---

# 19. Recording Quality

Default:

```text
48 kHz
mono
24-bit where supported
```

If browser limitations prevent this, accept the browser's available format and normalize during FFmpeg processing.

---

# 20. Waveform

Display:

1. original audio waveform
2. Punjabi recording waveform

Example:

```text
Original:

███████░░████████████░░░██████

Punjabi:

░░████████████░░████████░░░░██
```

The user should be able to visually compare timing.

---

# 21. Segment Trimming

Every recording should support:

* trim beginning
* trim ending
* split
* delete

Do not modify the original recording.

Create a processed version.

---

# 22. Audio Synchronization

The original video remains the master timeline.

Every Punjabi recording is assigned to:

```text
segment.start
```

Example:

```text
Segment:

start = 12.4
end = 17.8

Punjabi recording:

duration = 4.7 seconds
```

Place recording at:

```text
12.4 seconds
```

Do NOT automatically stretch speech unless the user enables it.

---

# 23. Optional Time Stretch

Provide:

```text
Fit voice to segment
```

Modes:

```text
Off
Stretch
Compress
```

Use FFmpeg audio tempo processing.

Never alter pitch.

The application should warn the user when extreme stretching is required.

Example:

```text
Your recording: 6.2 sec
Segment:        4.1 sec

This requires 34% compression.

[Use Anyway] [Re-record]
```

---

# 24. Original Dialogue Removal

The final output should normally replace the original dialogue.

However, because separating dialogue from music/SFX is not always possible, provide:

```text
Original Audio Mix

Original:
[ 0% ─────────────── 100% ]

Punjabi:
[ 0% ─────────────── 100% ]
```

Default:

```text
Original = 0%
Punjabi = 100%
```

Later versions can support AI vocal/dialogue separation.

Do NOT require source separation for MVP.

---

# 25. Background Music

Allow optional background music.

Features:

* import MP3/WAV
* trim
* volume
* fade in
* fade out
* loop

Example:

```text
Music Volume: 15%

Fade In: 2 sec
Fade Out: 3 sec
```

---

# 26. Sound Effects

Allow users to add SFX.

Examples:

```text
laugh
whoosh
pop
drum hit
vine boom
record scratch
sad trombone
```

SFX should have:

```text
start time
volume
fade in
fade out
```

Do not bundle copyrighted sound effects.

Allow user-provided SFX files.

---

# 27. Timeline

Timeline tracks:

```text
VIDEO
ORIGINAL AUDIO
PUNJABI VOICE
MUSIC
SFX
```

MVP does not need a full professional multi-track editor.

Only provide enough timeline control for dubbing.

---

# 28. Transcript Import

Support:

```text
SRT
VTT
TXT
JSON
```

If SRT/VTT contains timestamps, import them directly.

If TXT contains plain transcript:

Use Whisper or manual segmentation.

---

# 29. Transcript Export

Support:

```text
SRT
VTT
JSON
TXT
```

JSON should preserve all dubbing metadata.

Example:

```json
{
  "project": "Funny Punjabi Dub",
  "segments": [
    {
      "start": 0,
      "end": 4,
      "original": "Hello",
      "punjabi": "Oye ki haal ae?",
      "recording": "segment-001-v2.wav"
    }
  ]
}
```

---

# 30. Auto-Save

Autosave:

* Punjabi text
* active segment
* recording metadata
* settings
* timeline changes

Default:

```text
every 2 seconds after change
```

Do not autosave large binary files repeatedly.

---

# 31. Project Format

A project should be portable.

Recommended:

```text
project/
├── project.json
├── source/
│   └── original.mp4
├── transcript/
│   └── transcript.json
├── recordings/
│   ├── segment-001-v1.wav
│   └── segment-002-v1.wav
├── music/
├── sfx/
└── renders/
```

The project can be zipped:

```text
funny-punjabi-dub.pds.zip
```

PDS = Punjabi Dubbing Studio project.

---

# 32. Rendering

Rendering must be handled by FFmpeg.

Final audio:

```text
Punjabi Voice
      +
Music
      +
SFX
      +
Optional Original Audio
      ↓
Final Audio
      ↓
Original Video
      ↓
Final MP4
```

Default output:

```text
MP4
H.264
AAC
1080p
```

Do not unnecessarily re-encode video if the original video format allows stream copying.

Allow:

```text
Fast
Balanced
High Quality
```

---

# 33. Render Progress

Show:

```text
Rendering...

██████████████████░░░░ 78%

00:43 / 00:55

Estimated remaining: 12 seconds
```

The render should run as a background job.

The UI must remain usable.

---

# 34. Render Queue

Support multiple renders.

Example:

```text
Render Queue

Funny Dub #01       Rendering 78%
Funny Dub #02       Queued
Funny Dub #03       Complete
```

Only run a configurable number of FFmpeg processes.

Default:

```text
1 render at a time
```

---

# 35. Project Validation

Before rendering:

Check:

```text
✓ Original video exists
✓ Transcript exists
✓ All required segments have Punjabi script
✓ All required recordings exist
✓ Recording files are readable
✓ No invalid timestamps
✓ FFmpeg available
```

Show:

```text
Project Ready

87 / 87 scripts complete
82 / 87 recordings complete

Cannot render yet.

Missing:
Segment 14
Segment 37
Segment 61
Segment 82
Segment 85
```

Allow:

```text
[Render Anyway]
```

only if the user explicitly chooses it.

---

# 36. Segment Status

Use:

```text
○ Empty
✏ Script written
🎙 Recorded
✓ Approved
⚠ Needs attention
```

Completion percentage should be based on approved recordings.

---

# 37. Search

Allow searching transcript/script.

Example:

```text
Search:
"hospital"

Results:

00:01:22  Original: We need to go to the hospital.
00:05:13  Original: The hospital is closed.
```

Click result → seek video.

---

# 38. Notes

Each segment can have an optional note.

Example:

```text
Note:
"Make this line sarcastic."

"Say this loudly."

"Pause before punchline."
```

Notes should not appear in the final output.

---

# 39. Punchline / Comedy Markers

Allow marking segments:

```text
😂 Punchline
😡 Angry
😱 Shock
😎 Sarcastic
🤨 Suspicious
```

This is optional metadata.

It can help the user while recording.

---

# 40. Script Display Modes

Provide:

## Compact

```text
Original
Punjabi
```

## Large

For recording:

```text
┌───────────────────────────────────────┐
│                                       │
│ OYE TU ETHAY KI KARI JANA AIN?       │
│                                       │
└───────────────────────────────────────┘
```

Large mode should be optimized for reading while recording.

---

# 41. Teleprompter Mode

Add a dedicated mode:

```text
🎙 Teleprompter
```

Display:

```text
                    Oye tu ethe
                    ki kari jana ain?

                    3

                    2

                    1
```

The user can read the Punjabi line while the original video plays.

Options:

```text
Font size
Line spacing
Text alignment
Mirror
Scroll speed
```

---

# 42. Focus Mode

Focus mode hides everything except:

```text
Video
Current Punjabi line
Record controls
Timer
```

This should make recording much easier.

Shortcut:

```text
F
```

---

# 43. Segment Navigation

Buttons:

```text
← Previous
Current Segment
Next →
```

Also:

```text
First incomplete
Next incomplete
Previous incomplete
```

This is extremely important.

Example:

```text
[ Next Unrecorded → ]
```

After accepting a recording, automatically move to the next unrecorded segment if enabled.

Setting:

```text
Auto advance:
[✓]
```

---

# 44. Playback Loop

Current segment can loop:

```text
[✓] Loop current segment
```

Useful for practicing timing.

---

# 45. A/B Preview

Provide:

```text
Original
Punjabi
Final
```

Buttons:

```text
[Original]
[Punjabi]
[Final Mix]
```

The user can compare the same segment quickly.

---

# 46. Audio Normalization

Before final render:

Normalize Punjabi voice.

Recommended target:

```text
-16 LUFS
```

Do not normalize the original recording destructively.

Use FFmpeg during render.

---

# 47. Silence Detection

Optional tool:

```text
Detect silence
```

Useful for trimming recordings.

Do not automatically delete silence without user confirmation.

---

# 48. Transcription Pipeline

When user imports video:

```text
video
 ↓
ffprobe
 ↓
extract audio
 ↓
faster-whisper
 ↓
raw transcript
 ↓
segment normalization
 ↓
JSON
```

Whisper output must preserve:

```text
start
end
text
```

Do not blindly split transcript into arbitrary fixed intervals.

Use Whisper's segment boundaries first.

---

# 49. Transcript Editing

User must be able to:

* edit text
* change start time
* change end time
* split segment
* merge segments
* delete segment
* insert segment

Example:

```text
[Split]

00:00–00:10
Hello everyone. Today we're going...

becomes:

00:00–00:04
Hello everyone.

00:04–00:10
Today we're going...
```

---

# 50. Segment Timing Safety

Never allow:

```text
start < 0
end <= start
end > video duration
```

Validate all timestamps.

---

# 51. File Handling

Use UUIDs internally.

Never rely on user filenames for storage paths.

Example:

```text
projects/
  6c1f...
```

Sanitize filenames.

Prevent:

```text
../
../../
absolute paths
```

---

# 52. API

Recommended endpoints:

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
DELETE /api/projects/:id

POST   /api/projects/:id/video

POST   /api/projects/:id/transcribe

GET    /api/projects/:id/transcript

PUT    /api/projects/:id/segments/:segmentId

POST   /api/projects/:id/segments/:segmentId/recording

GET    /api/projects/:id/segments/:segmentId/recordings

DELETE /api/projects/:id/recordings/:recordingId

POST   /api/projects/:id/render

GET    /api/projects/:id/render/:renderId

GET    /api/projects/:id/export
```

---

# 53. Background Jobs

Long operations must not block HTTP requests.

Jobs:

```text
TRANSCRIBE_VIDEO
PROCESS_AUDIO
PROCESS_RECORDING
RENDER_VIDEO
EXPORT_PROJECT
```

For MVP, use an in-process job queue.

Later:

```text
BullMQ + Redis
```

Do NOT add Redis until it is actually needed.

---

# 54. WebSocket / SSE

Render/transcription progress should be sent to frontend using:

```text
Server-Sent Events
```

or WebSocket.

Prefer SSE for MVP because the communication is mostly server → client.

Example:

```text
transcription: 34%
render: 72%
```

---

# 55. Error Handling

Errors should be user-friendly.

Bad:

```text
FFmpeg exited with code 1
```

Good:

```text
Unable to render the video.

FFmpeg could not process the original audio.

[View Technical Details]
[Retry]
```

Technical logs should remain available.

---

# 56. Logging

Use structured logging.

Levels:

```text
debug
info
warn
error
```

Never log:

* microphone recordings
* project contents
* sensitive user data

unless explicitly required for debugging.

---

# 57. Privacy

The application should be local-first.

By default:

```text
Video stays on user's machine.
Recordings stay on user's machine.
Transcription stays on user's machine.
```

Do not upload video/audio to external APIs.

No telemetry in MVP.

---

# 58. Optional Cloud Mode

Do not implement initially.

Architecture should make it possible later to replace:

```text
Local Whisper
```

with:

```text
Cloud transcription API
```

through an abstraction:

```ts
interface TranscriptionProvider {
  transcribe(input: string): Promise<Transcript>;
}
```

---

# 59. Transcription Provider Interface

Implement:

```ts
interface TranscriptionProvider {
  name: string;

  transcribe(
    audioPath: string,
    options: TranscriptionOptions
  ): Promise<TranscriptResult>;
}
```

Initial provider:

```text
FasterWhisperProvider
```

Future:

```text
OpenAIWhisperProvider
AssemblyAIProvider
```

Do not tightly couple the frontend to Whisper.

---

# 60. FFmpeg Service

Create:

```text
FFmpegService
```

Responsibilities:

```text
probe()
extractAudio()
convertAudio()
trimAudio()
normalizeAudio()
mixAudio()
renderVideo()
```

All FFmpeg commands must be generated safely.

Do not construct shell commands by concatenating untrusted strings.

---

# 61. Database Schema

Minimum models:

```text
Project
VideoAsset
TranscriptSegment
Recording
AudioTrack
RenderJob
ProjectSetting
```

Relationships:

```text
Project
 ├── VideoAsset
 ├── TranscriptSegment[]
 │      └── Recording[]
 ├── AudioTrack[]
 └── RenderJob[]
```

---

# 62. Example Prisma Models

Use approximately:

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  video       VideoAsset?
  segments    TranscriptSegment[]
  audioTracks AudioTrack[]
  renderJobs  RenderJob[]
}

model VideoAsset {
  id        String   @id @default(cuid())
  projectId String   @unique
  path      String
  duration  Float
  width     Int?
  height    Int?
  fps       Float?
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model TranscriptSegment {
  id           String   @id @default(cuid())
  projectId    String
  index        Int
  start        Float
  end          Float
  originalText String
  punjabiText  String   @default("")
  status       String   @default("pending")
  note         String?

  project    Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  recordings Recording[]

  @@index([projectId, index])
}

model Recording {
  id        String   @id @default(cuid())
  segmentId String
  version   Int
  path      String
  duration  Float
  approved  Boolean  @default(false)
  createdAt DateTime @default(now())

  segment TranscriptSegment @relation(fields: [segmentId], references: [id], onDelete: Cascade)

  @@index([segmentId])
}

model AudioTrack {
  id        String @id @default(cuid())
  projectId String
  type      String
  path      String
  volume    Float  @default(1)
  start     Float  @default(0)

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model RenderJob {
  id        String   @id @default(cuid())
  projectId String
  status    String
  progress  Float    @default(0)
  output    String?
  error     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

---

# 63. Important UX Principle

The user should almost never need to touch the timeline manually.

The application should automatically handle:

```text
timestamps
segment selection
recording placement
audio alignment
```

The user should focus on:

```text
Punjabi script
delivery
comedy
timing
```

---

# 64. Main Keyboard Workflow

Optimize for this exact workflow:

```text
Space
↓
Play current segment

R
↓
Record

Speak Punjabi

Enter
↓
Accept

↓
Next segment

R
↓
Record

Speak Punjabi

Enter
↓
Next
```

The user should be able to dub an entire video without touching the mouse frequently.

---

# 65. Auto Advance

Settings:

```text
[✓] Automatically move to next segment
[✓] Automatically play next segment
[ ] Automatically start recording
```

Default:

```text
Auto advance = ON
Auto play = OFF
Auto recording = OFF
```

Do not automatically record without an explicit user action.

---

# 66. Recording Safety

Never lose an existing recording.

If the user presses:

```text
Record
```

and an existing recording exists:

```text
Existing recording found.

Create new version?

[Record New Version]
[Cancel]
```

---

# 67. Undo / Redo

Support undo/redo for:

* script edits
* timing edits
* segment split
* segment merge
* volume changes
* timeline edits

Do not attempt to undo physical file deletion automatically.

---

# 68. Autosave Recovery

If browser closes unexpectedly:

On reopening:

```text
Recovered unsaved changes.

[Restore]
[Discard]
```

---

# 69. Dark Mode

Default:

```text
Dark
```

The workspace should be comfortable for long recording sessions.

Avoid excessive colors.

Use colors only for status:

```text
green = complete
yellow = attention
red = error
blue = active
```

---

# 70. Responsive Design

Primary target:

```text
Desktop
```

Minimum recommended:

```text
1280 × 720
```

Mobile is not required for MVP.

Tablet support is optional.

---

# 71. Performance

The video player must remain smooth.

Do not store the entire video in React state.

Do not store large audio blobs in Zustand.

Use:

```text
file references
URLs
IDs
metadata
```

instead.

Keep large binary data outside React state.

---

# 72. Browser Memory

Recordings can become large.

Do not keep all recordings as Blob objects indefinitely.

After saving:

```text
Blob
 ↓
upload/save
 ↓
release Blob URL
```

Use:

```text
URL.revokeObjectURL()
```

when previews are no longer required.

---

# 73. Project Import / Export

Export:

```text
Project
```

as:

```text
.pds.zip
```

Import should restore:

```text
video
transcript
Punjabi scripts
recordings
music
SFX
settings
```

---

# 74. MVP Features

MVP must include:

### Project

* create project
* import video
* save project

### Transcription

* local faster-whisper
* timestamps
* transcript editing

### Script

* original transcript
* Punjabi script beside it
* autosave

### Video

* synchronized playback
* segment seeking
* active segment highlighting

### Recording

* microphone selection
* record segment
* preview
* re-record
* recording versioning

### Timeline

* basic waveform
* segment visualization

### Export

* FFmpeg
* Punjabi voice replacement
* MP4 export

---

# 75. Phase 2

Add:

* teleprompter
* focus mode
* SFX
* background music
* recording trimming
* audio normalization
* render queue
* project ZIP
* SRT/VTT import/export
* search
* notes
* punchline markers

---

# 76. Phase 3

Add:

* AI silence detection
* AI vocal separation
* automatic timing suggestions
* automatic Punjabi script suggestions
* pronunciation assistance
* voice cleanup
* noise removal
* advanced waveform editing
* multi-track timeline

AI suggestions must always remain optional.

The user's manually written Punjabi script must never be silently replaced.

---

# 77. Non-Goals

Do NOT build:

* a full Premiere Pro replacement
* a full CapCut replacement
* AI voice cloning
* automatic funny translation
* automatic publishing to YouTube
* social media scheduling
* cloud storage
* collaborative editing

The product is a focused dubbing workstation.

---

# 78. Development Rules

## TypeScript

Use strict TypeScript.

```json
{
  "strict": true
}
```

Do not use:

```ts
any
```

unless there is a documented reason.

---

## React

Avoid unnecessary global state.

Use local state for:

* modal visibility
* input fields
* temporary UI state

Use Zustand for:

* active project
* active segment
* playback state
* recording state
* project settings

---

# 79. State Design

Recommended Zustand stores:

```text
projectStore
playerStore
recordingStore
timelineStore
renderStore
settingsStore
```

Do not create one giant store.

---

# 80. Component Structure

Recommended:

```text
DubbingWorkspace
├── VideoPanel
│   ├── VideoPlayer
│   └── PlayerControls
│
├── ScriptPanel
│   ├── SegmentList
│   ├── SegmentCard
│   ├── OriginalText
│   ├── PunjabiEditor
│   └── RecordingControls
│
├── Timeline
│   ├── Waveform
│   ├── SegmentTimeline
│   └── AudioTracks
│
└── BottomToolbar
```

---

# 81. Code Quality

Prefer small services.

Example:

```text
services/
├── project.service.ts
├── transcription.service.ts
├── recording.service.ts
├── ffmpeg.service.ts
├── render.service.ts
└── storage.service.ts
```

Do not put FFmpeg commands inside route handlers.

---

# 82. Testing

Unit test:

* timestamp calculations
* segment splitting
* segment merging
* audio placement
* render command generation
* project serialization

Integration test:

```text
video
 ↓
transcription
 ↓
project
 ↓
recording
 ↓
render
```

Browser tests:

* segment navigation
* recording controls
* autosave
* keyboard shortcuts

---

# 83. Security

Even though this is local-first:

* sanitize filenames
* validate upload types
* validate file sizes
* prevent path traversal
* validate FFmpeg arguments
* never execute arbitrary user-provided shell commands
* limit API access to local environment if running locally

---

# 84. Docker

Provide Docker support for:

```text
web
api
sqlite/storage
```

However, local FFmpeg and Whisper GPU support may be easier outside Docker initially.

The application should support:

```text
Native mode
```

first.

Docker should be an optional deployment method.

For CUDA Docker support, document NVIDIA Container Toolkit separately.

---

# 85. Environment Variables

Example:

```env
APP_NAME=Punjabi Dubbing Studio

API_PORT=4000
WEB_PORT=3000

DATABASE_URL=file:./dev.db

STORAGE_PATH=./storage

FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

WHISPER_PATH=faster-whisper

DEFAULT_WHISPER_MODEL=small
WHISPER_DEVICE=auto

MAX_UPLOAD_SIZE_MB=2048
```

---

# 86. First Implementation Milestone

Do NOT attempt to implement everything at once.

Build in this order:

## Step 1

Create project.

## Step 2

Upload video.

## Step 3

Play video.

## Step 4

Extract audio using FFmpeg.

## Step 5

Run faster-whisper.

## Step 6

Display transcript with timestamps.

## Step 7

Click transcript → seek video.

## Step 8

Add Punjabi text field.

## Step 9

Add microphone recording.

## Step 10

Attach recording to segment.

## Step 11

Automatically place recordings on timeline.

## Step 12

Render final video.

Only after these work should advanced features be added.

---

# 87. Definition of Done — MVP

The MVP is complete when the following workflow works:

```text
User opens application

        ↓

Creates project

        ↓

Imports a 10-minute video

        ↓

Whisper generates transcript

        ↓

User sees:

Original                 Punjabi
---------------------------------------------
What are you doing?     Oye tu ki kari jana ain?
Where are you going?    Kithe turya peya ain?
Come here!              Oye idhar aa!

        ↓

User clicks first segment

        ↓

Video jumps to segment

        ↓

User clicks Record

        ↓

Original segment plays

        ↓

User speaks Punjabi

        ↓

Recording automatically stops

        ↓

User previews it

        ↓

Accept

        ↓

Next segment

        ↓

Repeat

        ↓

User clicks Render

        ↓

FFmpeg creates final MP4

        ↓

Final video contains:

Original Video
+
Punjabi Voice
+
Optional Music/SFX
```

This entire workflow must work reliably before adding advanced features.

---

# 88. Agent Instructions

When implementing this project:

1. Read this AGENTS.md before making changes.
2. Do not implement features outside the current milestone unless requested.
3. Keep the application local-first.
4. Prefer simple solutions.
5. Do not introduce unnecessary dependencies.
6. Do not rewrite working architecture without a clear reason.
7. Do not modify original media files.
8. Always preserve original recordings.
9. Never silently delete user recordings.
10. Never silently overwrite project data.
11. Keep binary media outside React state.
12. Keep FFmpeg operations in backend services.
13. Keep transcription behind an abstraction.
14. Use strict TypeScript.
15. Add tests for media/timestamp logic.
16. Handle FFmpeg failures gracefully.
17. Show useful errors to the user.
18. Keep the UI optimized for keyboard-driven dubbing.
19. Do not build a generic video editor.
20. Optimize for:

```text
Watch
→ Read
→ Speak
→ Accept
→ Next
```

---

# 89. Product Principle

The most important product principle is:

> The user should spend their time making the Punjabi funny, not fighting the video editor.

Everything in the application should support that goal.




Dev notes:
everything will be localy
add .git ignore file
no need for the auth for now
use npm
make it in phases
