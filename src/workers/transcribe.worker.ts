/**
 * Web Worker: runs Whisper transcription off the main thread to prevent browser freeze/crash.
 */

import type { SubtitleSegment } from "../types";

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
      { text: output.text.trim(), start: 0, end: 999999 },
    ];
  }
  return [];
}

function postProgress(stage: string, label: string, percent: number) {
  self.postMessage({ type: "progress", stage, label, percent });
}

self.onmessage = async (e: MessageEvent<{ type: "start"; audioUrl: string; useSmallModel?: boolean }>) => {
  if (e.data.type !== "start") return;
  const { audioUrl, useSmallModel } = e.data;
  const model = useSmallModel ? "Xenova/whisper-small.en" : "Xenova/whisper-tiny.en";

  try {
    postProgress("loading", "Loading Whisper...", 0);
    await new Promise((r) => setTimeout(r, 50));

    const { pipeline } = await import("@huggingface/transformers");

    postProgress("loading-model", `Loading ${useSmallModel ? "small" : "tiny"} model (first time may take a minute)...`, 5);
    await new Promise((r) => setTimeout(r, 50));

    const transcriber = await pipeline(
      "automatic-speech-recognition",
      model,
      { quantized: true, device: "wasm" }
    );

    postProgress("transcribing", "Transcribing audio...", 15);
    await new Promise((r) => setTimeout(r, 50));

    const output = await transcriber(audioUrl, {
      chunk_length_s: 15,
      stride_length_s: 3,
      return_timestamps: true,
      force_full_sequences: true,
    });

    const segments = parseWhisperOutput(
      output as { text?: string; chunks?: Array<{ text: string; timestamp: [number, number] }> }
    );
    self.postMessage({ type: "done", segments });
  } catch (err) {
    self.postMessage({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
