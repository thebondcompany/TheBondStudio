/**
 * Client-side Whisper transcription. Runs in a Web Worker when possible
 * to avoid freezing/crashing the browser. Falls back to main thread with yields.
 */

import type { SubtitleSegment } from "@/types";

export interface TranscribeResult {
  segments: SubtitleSegment[];
}

/** Merge word-level chunks into phrase-level segments (~2.5s or ~10 words) for readable subtitles. */
function mergeWordChunksToPhrases(
  chunks: Array<{ text: string; timestamp: [number, number] }>
): SubtitleSegment[] {
  const filtered = chunks.filter((c) => c.text?.trim());
  if (filtered.length === 0) return [];

  const TARGET_DURATION = 2.5;
  const MAX_WORDS = 12;
  const GAP_THRESHOLD = 0.6;

  const segments: SubtitleSegment[] = [];
  let group: { words: string[]; start: number; end: number } = {
    words: [],
    start: filtered[0].timestamp[0] ?? 0,
    end: filtered[0].timestamp[1] ?? 0,
  };

  for (const c of filtered) {
    const s = c.timestamp[0] ?? 0;
    const e = c.timestamp[1] ?? 0;
    const text = c.text.trim();
    const gap = s - group.end;

    const duration = e - group.start;
    const shouldBreak =
      group.words.length >= MAX_WORDS ||
      duration >= TARGET_DURATION ||
      (gap > GAP_THRESHOLD && group.words.length > 0);

    if (shouldBreak && group.words.length > 0) {
      segments.push({
        text: group.words.join(" ").trim(),
        start: group.start,
        end: group.end,
      });
      group = { words: [], start: s, end: e };
    }

    group.words.push(text);
    group.end = e;
    if (group.words.length === 1) group.start = s;
  }

  if (group.words.length > 0) {
    segments.push({
      text: group.words.join(" ").trim(),
      start: group.start,
      end: group.end,
    });
  }
  return segments;
}

function parseWhisperOutput(output: {
  text?: string;
  chunks?: Array<{ text: string; timestamp: [number, number] }>;
}): SubtitleSegment[] {
  if (output.chunks && Array.isArray(output.chunks)) {
    const filtered = output.chunks.filter((c) => c.text?.trim());
    if (filtered.length === 0) return [];
    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    const avgDuration = last && first
      ? ((last.timestamp[1] ?? 0) - (first.timestamp[0] ?? 0)) / filtered.length
      : 0;
    const isWordLevel = avgDuration < 1.5 && filtered.length > 10;
    if (isWordLevel) {
      return mergeWordChunksToPhrases(filtered);
    }
    return filtered.map((c) => ({
      text: c.text.trim(),
      start: c.timestamp[0] ?? 0,
      end: c.timestamp[1] ?? 0,
    }));
  }
  if (output.text?.trim()) {
    return [
      {
        text: output.text.trim(),
        start: 0,
        end: 999999,
      },
    ];
  }
  return [];
}

export type TranscribeProgressStage =
  | "loading"
  | "loading-model"
  | "transcribing";

export interface TranscribeProgress {
  stage: TranscribeProgressStage;
  label: string;
  percent: number;
}

export interface TranscribeOptions {
  onProgress?: (progress: TranscribeProgress) => void;
  durationSeconds?: number;
  /** Use whisper-small for better accuracy (slower). Default: whisper-tiny */
  useSmallModel?: boolean;
}

function runInWorker(
  audioUrl: string,
  opts: TranscribeOptions
): Promise<TranscribeResult> {
  const { onProgress, durationSeconds } = opts;
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL("../workers/transcribe.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch {
      reject(new Error("Worker not supported"));
      return;
    }

    // Let the worker report its own coarse stages (0,5,15,100) to avoid
    // pretending we have fine‑grained progress that we can't compute.

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "progress") {
        onProgress?.({
          stage: e.data.stage,
          label: e.data.label,
          percent: e.data.percent,
        });
      } else if (e.data.type === "done") {
        worker.terminate();
        resolve({ segments: e.data.segments });
      } else if (e.data.type === "error") {
        worker.terminate();
        reject(new Error(e.data.message));
      }
    };
    worker.onerror = () => {
      if (progressInterval) clearInterval(progressInterval);
      worker.terminate();
      reject(new Error("Transcription worker failed"));
    };
    worker.postMessage({ type: "start", audioUrl, useSmallModel: opts.useSmallModel });
  });
}

async function runOnMainThread(
  audioUrl: string,
  opts: TranscribeOptions
): Promise<TranscribeResult> {
  const { onProgress, durationSeconds, useSmallModel } = opts;
  const model = useSmallModel ? "Xenova/whisper-small.en" : "Xenova/whisper-tiny.en";
  const report = (stage: TranscribeProgressStage, label: string, percent: number) => {
    onProgress?.({ stage, label, percent });
  };

  report("loading", "Loading Whisper...", 0);
  await new Promise((r) => setTimeout(r, 100));

  const { pipeline } = await import("@huggingface/transformers");
  report("loading-model", "Loading model (first time may take a minute)...", 5);
  await new Promise((r) => setTimeout(r, 100));

  const transcriber = await pipeline(
    "automatic-speech-recognition",
    model,
    { quantized: true, device: "wasm" }
  );

  report("transcribing", "Transcribing audio...", 15);

  await new Promise((r) => setTimeout(r, 50));

  const output = await transcriber(audioUrl, {
    chunk_length_s: 15,
    stride_length_s: 3,
    return_timestamps: true,
    force_full_sequences: true,
  });

  report("transcribing", "Done", 100);

  const segments = parseWhisperOutput(
    output as { text?: string; chunks?: Array<{ text: string; timestamp: [number, number] }> }
  );
  return { segments };
}

export async function transcribeAudio(
  audioUrl: string,
  onProgress?: (progress: TranscribeProgress) => void
): Promise<TranscribeResult>;
export async function transcribeAudio(
  audioUrl: string,
  options: TranscribeOptions
): Promise<TranscribeResult>;
export async function transcribeAudio(
  audioUrl: string,
  onProgressOrOptions?: ((progress: TranscribeProgress) => void) | TranscribeOptions
): Promise<TranscribeResult> {
  const opts: TranscribeOptions =
    typeof onProgressOrOptions === "function"
      ? { onProgress: onProgressOrOptions }
      : onProgressOrOptions ?? {};

  try {
    return await runInWorker(audioUrl, opts);
  } catch {
    return runOnMainThread(audioUrl, opts);
  }
}
