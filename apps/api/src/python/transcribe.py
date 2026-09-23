#!/usr/bin/env python3
"""
faster-whisper CLI runner for Punjabi Dubbing Studio.
Extracts segments with start/end timestamps and text.
Outputs JSON lines for progress and final segment list.
"""

import sys
import json
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description="Transcribe audio using faster-whisper")
    parser.add_argument("--audio", required=True, help="Path to input audio file (16kHz WAV)")
    parser.add_argument("--model", default="small", help="Whisper model size: tiny, base, small, medium, large-v3")
    parser.add_argument("--device", default="auto", help="Device: auto, cuda, cpu")
    parser.add_argument("--language", default=None, help="Transcription language code, e.g. en, pa, hi, ur")
    args = parser.parse_args()

    if not os.path.exists(args.audio):
        print(json.dumps({"error": f"Audio file not found: {args.audio}"}), file=sys.stderr)
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(json.dumps({
            "error": "faster_whisper Python package is not installed in the active environment. Please install it using `pip install faster-whisper`."
        }), file=sys.stderr)
        sys.exit(2)

    device = args.device
    compute_type = "float16" if device == "cuda" else "int8"
    if device == "auto":
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
            compute_type = "float16" if device == "cuda" else "int8"
        except Exception:
            device = "cpu"
            compute_type = "int8"

    print(json.dumps({"event": "status", "message": f"Loading model '{args.model}' on {device} ({compute_type})..."}))
    sys.stdout.flush()

    try:
        model = WhisperModel(args.model, device=device, compute_type=compute_type)
    except Exception as e:
        if device == "cuda":
            print(json.dumps({"event": "status", "message": f"CUDA initialization failed ({e}), falling back to CPU..."}))
            sys.stdout.flush()
            model = WhisperModel(args.model, device="cpu", compute_type="int8")
        else:
            raise e

    print(json.dumps({"event": "status", "message": "Transcribing audio segments..."}))
    sys.stdout.flush()

    segments, info = model.transcribe(
        args.audio,
        language=args.language if args.language and args.language != "auto" else None,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500)
    )

    result_segments = []
    index = 1
    total_duration = info.duration if hasattr(info, "duration") and info.duration else 1.0

    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        seg_data = {
            "index": index,
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": text
        }
        result_segments.append(seg_data)
        progress = min(99.0, round((seg.end / total_duration) * 100, 1)) if total_duration > 0 else 50.0
        print(json.dumps({"event": "segment", "progress": progress, "segment": seg_data}))
        sys.stdout.flush()
        index += 1

    print(json.dumps({
        "event": "complete",
        "progress": 100.0,
        "language": info.language,
        "language_probability": info.language_probability,
        "duration": info.duration,
        "segments": result_segments
    }))
    sys.stdout.flush()

if __name__ == "__main__":
    main()
